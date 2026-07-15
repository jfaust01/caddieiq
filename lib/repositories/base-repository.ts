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
   * Run an async single-item persister across a batch, folding every result
   * into a {@link BulkRepositoryResult}. A failure on one item is captured and
   * the batch continues — bulk operations never throw for a single bad item.
   */
  protected async runBulk<D, T>(
    items: readonly D[],
    referenceOf: (item: D) => string | undefined,
    persist: (item: D) => Promise<RepositoryResult<T>>,
  ): Promise<BulkRepositoryResult<T>> {
    const acc = emptyBulkResult<T>()
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]
      const reference = referenceOf(item)
      try {
        const result = await persist(item)
        accumulate(acc, result, index, reference)
      } catch (error) {
        // Defensive: `persist` is expected to return, not throw, but guard the
        // batch so one unexpected throwable can't abort the whole import.
        const repoError = toRepositoryError(error, { operation: "bulk", reference })
        this.logger.failure(reference, repoError.message, { code: repoError.code })
        accumulate(acc, fail<T>(repoError), index, reference)
      }
    }
    return acc
  }
}
