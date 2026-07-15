/**
 * Betting repository.
 *
 * The only layer permitted to persist betting data (tables `betting_events`,
 * `betting_markets`, `betting_outcomes`). It accepts already-mapped domain
 * events whose tournament and per-outcome player associations have been resolved
 * to CaddieIQ ids (or null) by the betting importer — it never maps or fetches.
 *
 * Idempotency: every node is reconciled on its unique provider `externalId`, so
 * re-importing updates in place. The scramble gate lives upstream in the mapper;
 * this layer simply persists the `available` flags and (possibly null) values it
 * is given, never fabricating odds.
 */

import type { DomainBettingEvent } from "@/lib/domain/betting/types"
import type {
  BettingEvent as BettingEventRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import {
  fail,
  ok,
  type BulkRepositoryResult,
  type RepositoryResult,
} from "./repository-result"

/**
 * A mapped betting event whose tournament association has been resolved by the
 * importer, plus a `playerExternalId → CaddieIQ id` map covering every outcome
 * so the repository can attach player ids without additional queries.
 */
export interface ResolvedBettingEvent {
  tournamentId: string | null
  /** Resolves an outcome's provider PlayerID to a CaddieIQ id (or absent). */
  playerIdByExternalId: Map<number, string>
  event: DomainBettingEvent
}

/** A betting outcome flattened for UI rendering. */
export interface BettingOutcomeView {
  id: string
  label: string | null
  payoutAmerican: number | null
  payoutDecimal: number | null
  available: boolean
  playerId: string | null
}

export class BettingRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "betting", sink)
  }

  /**
   * Idempotently persist one resolved event and its full market/outcome tree,
   * each node reconciled on its unique provider `externalId`.
   */
  async upsert(
    resolved: ResolvedBettingEvent,
  ): Promise<RepositoryResult<BettingEventRecord>> {
    const { tournamentId, playerIdByExternalId, event } = resolved
    const reference = event.externalId
    try {
      const existing = await this.prisma.bettingEvent.findUnique({
        where: { externalId: reference },
        select: { id: true },
      })
      const record = await this.prisma.bettingEvent.upsert({
        where: { externalId: reference },
        create: {
          externalId: reference,
          tournamentId,
          name: event.name,
          startDate: event.startDate,
        },
        update: { tournamentId, name: event.name, startDate: event.startDate },
      })

      // Persist markets + outcomes. Reconcile each on its own externalId so
      // re-imports update in place; the counts of nodes are bounded per event.
      for (const market of event.markets) {
        const marketRecord = await this.prisma.bettingMarket.upsert({
          where: { externalId: market.externalId },
          create: {
            externalId: market.externalId,
            bettingEventId: record.id,
            betType: market.betType,
            name: market.name,
            available: market.available,
          },
          update: {
            bettingEventId: record.id,
            betType: market.betType,
            name: market.name,
            available: market.available,
          },
        })
        for (const outcome of market.outcomes) {
          const playerId =
            outcome.playerExternalId != null
              ? playerIdByExternalId.get(outcome.playerExternalId) ?? null
              : null
          await this.prisma.bettingOutcome.upsert({
            where: { externalId: outcome.externalId },
            create: {
              externalId: outcome.externalId,
              bettingMarketId: marketRecord.id,
              playerId,
              label: outcome.label,
              payoutAmerican: outcome.payoutAmerican,
              payoutDecimal: outcome.payoutDecimal,
              available: outcome.available,
            },
            update: {
              bettingMarketId: marketRecord.id,
              playerId,
              label: outcome.label,
              payoutAmerican: outcome.payoutAmerican,
              payoutDecimal: outcome.payoutDecimal,
              available: outcome.available,
            },
          })
        }
      }

      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "bettingEvent",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<BettingEventRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved events. Never throws per item. */
  async bulkUpsert(
    rows: readonly ResolvedBettingEvent[],
  ): Promise<BulkRepositoryResult<BettingEventRecord>> {
    return this.runBulk(
      rows,
      (r) => r.event.externalId,
      (r) => this.upsert(r),
    )
  }

  /**
   * Outright-winner odds for a player across events, newest first. Read-only.
   * Returns only AVAILABLE outcomes (real payouts) — scrambled ones are stored
   * for structure but never surfaced as odds.
   */
  async listAvailableOutcomesForPlayer(
    playerId: string,
    limit = 10,
  ): Promise<BettingOutcomeView[]> {
    return this.prisma.bettingOutcome.findMany({
      where: { playerId, available: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        label: true,
        payoutAmerican: true,
        payoutDecimal: true,
        available: true,
        playerId: true,
      },
    }) as unknown as Promise<BettingOutcomeView[]>
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _bettingRepository: BettingRepository | undefined
export function getBettingRepository(): BettingRepository {
  return (_bettingRepository ??= new BettingRepository())
}
