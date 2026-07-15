/**
 * Base repository.
 *
 * Shared persistence plumbing for the concrete entity repositories. It provides
 * the idempotent-upsert and bulk-iteration templates so each repository only
 * declares *what* a domain object maps to on create/update, not *how* the
 * insert/update/skip/failure bookkeeping and logging work.
 *
 * Repositories are the only layer permitted to touch the database. They accept
 * already-validated CaddieIQ domain objects and never map, validate, or fetch.
 */

import type { PrismaClient } from "@/lib/generated/prisma/client"

import { RepositoryLogger, type RepositoryLogSink } from "./logger"
import { toRepositoryError } from "./errors"
import {
  accumulate,
  emptyBulkResult,
  fail,
  ok,
  type BulkRepositoryResult,
  type RepositoryResult,
} from "./repository-result"

/**
 * Describes how a domain object of type `D` persists to a Prisma model `T`
 * whose unique reconciliation key is `slug`.
 *
 * `slug` is a deterministic, source-derived value, which is what makes upserts
 * idempotent: re-importing the same source record resolves to the same row and
 * updates it rather than inserting a duplicate.
 */
export interface UpsertPlan<CreateInput, UpdateInput> {
  /** The unique slug this domain object reconciles against. */
  slug: string
  /** Prisma `create` payload used when no row exists for `slug`. */
  create: CreateInput
  /** Prisma `update` payload used when a row already exists for `slug`. */
  update: UpdateInput
}

/**
 * A minimal Prisma delegate surface the base repository relies on. The concrete
 * repositories pass their real delegate (e.g. `prisma.player`); this structural
 * type keeps the base decoupled from any single model.
 */
export interface SlugDelegate<T, CreateInput, UpdateInput> {
  findUnique(args: { where: { slug: string } }): Promise<T | null>
  create(args: { data: CreateInput }): Promise<T>
  update(args: { where: { slug: string }; data: UpdateInput }): Promise<T>
}

export abstract class BaseRepository {
  protected readonly logger: RepositoryLogger

  constructor(
    protected readonly prisma: PrismaClient,
    entity: string,
    sink?: RepositoryLogSink,
  ) {
    this.logger = new RepositoryLogger(entity, sink)
  }

  /**
   * Idempotently persist one domain object via its {@link UpsertPlan}.
   *
   * Resolves the row by unique `slug`: updates when present, inserts when not.
   * Logs the resulting insert/update, coerces any throwable into a typed
   * repository error, and returns a structured {@link RepositoryResult}.
   */
  protected async upsertBySlug<T, CreateInput, UpdateInput>(
    delegate: SlugDelegate<T, CreateInput, UpdateInput>,
    plan: UpsertPlan<CreateInput, UpdateInput>,
    entity: string,
  ): Promise<RepositoryResult<T>> {
    try {
      const existing = await delegate.findUnique({ where: { slug: plan.slug } })
      if (existing) {
        const record = await delegate.update({ where: { slug: plan.slug }, data: plan.update })
        this.logger.update(plan.slug)
        return ok(record, "updated")
      }
      const record = await delegate.create({ data: plan.create })
      this.logger.insert(plan.slug)
      return ok(record, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity, operation: "upsert", reference: plan.slug })
      this.logger.failure(plan.slug, repoError.message, { code: repoError.code })
      return fail<T>(repoError)
    }
  }

  /**
   * How many items {@link runBulk} persists concurrently.
   *
   * Persisting one row at a time serializes thousands of database round-trips
   * on a full import, which cannot complete in a normal execution budget. A
   * bounded worker pool keeps wall-clock time reasonable while still bounding
   * the number of simultaneous connections we open against the database.
   *
   * Override per repository if a model needs a tighter or looser bound.
   */
  protected readonly bulkConcurrency = 16

  /**
   * Run an async single-item persister across a batch, folding every result
   * into a {@link BulkRepositoryResult}. A failure on one item is captured and
   * the batch continues — bulk operations never throw for a single bad item.
   *
   * Items are processed by a bounded pool of workers (see
   * {@link bulkConcurrency}). Each result is recorded against its original
   * index so the folded `records`/`errors` stay in input order regardless of
   * the order in which the concurrent persists resolve.
   */
  protected async runBulk<D, T>(
    items: readonly D[],
    referenceOf: (item: D) => string | undefined,
    persist: (item: D) => Promise<RepositoryResult<T>>,
  ): Promise<BulkRepositoryResult<T>> {
    const results: Array<RepositoryResult<T>> = new Array(items.length)

    const runOne = async (index: number): Promise<void> => {
      const item = items[index]
      const reference = referenceOf(item)
      try {
        results[index] = await persist(item)
      } catch (error) {
        // Defensive: `persist` is expected to return, not throw, but guard the
        // batch so one unexpected throwable can't abort the whole import.
        const repoError = toRepositoryError(error, { operation: "bulk", reference })
        this.logger.failure(reference, repoError.message, { code: repoError.code })
        results[index] = fail<T>(repoError)
      }
    }

    // Group indices by reconciliation key. Items that share a key (the same
    // slug) MUST run sequentially: concurrent upserts on one key would both
    // read "not found" and race to insert, tripping the unique constraint.
    // Items with distinct keys are independent and safe to run in parallel.
    // Undefined references get a unique bucket so they never serialize together.
    const buckets = new Map<string, number[]>()
    for (let index = 0; index < items.length; index += 1) {
      const key = referenceOf(items[index]) ?? `__undefined_${index}`
      const bucket = buckets.get(key)
      if (bucket) bucket.push(index)
      else buckets.set(key, [index])
    }
    const queue = [...buckets.values()]

    // Bounded worker pool: `workerCount` cursors pull the next bucket off a
    // shared counter until the queue is drained, running each bucket's items
    // in input order.
    let cursor = 0
    const workerCount = Math.max(1, Math.min(this.bulkConcurrency, queue.length))
    const workers: Array<Promise<void>> = []
    for (let w = 0; w < workerCount; w += 1) {
      workers.push(
        (async () => {
          while (true) {
            const queueIndex = cursor
            cursor += 1
            if (queueIndex >= queue.length) return
            for (const index of queue[queueIndex]) {
              await runOne(index)
            }
          }
        })(),
      )
    }
    await Promise.all(workers)

    // Fold in input order so the result is deterministic.
    const acc = emptyBulkResult<T>()
    for (let index = 0; index < items.length; index += 1) {
      accumulate(acc, results[index], index, referenceOf(items[index]))
    }
    return acc
  }
}
