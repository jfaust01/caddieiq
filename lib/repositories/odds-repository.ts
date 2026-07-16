/**
 * Odds repository.
 *
 * The only layer permitted to persist Odds Intelligence data (tables
 * `odds_events`, `odds_quotes`). It accepts an already-mapped, already-resolved
 * event (tournament id + per-selection player ids decided upstream by the odds
 * importer) and persists it idempotently — it never maps, fetches, or grades.
 *
 * Idempotency + freshness: an event is reconciled on the provider event id, and
 * each quote on `(event, market, bookmaker, selection)`. A re-import only
 * overwrites a quote when the incoming `lastUpdate` is newer than the stored
 * one, so a stale refresh can never regress fresher odds. This is the betting
 * analogue of the Weather engine's "replace snapshot wholesale" — here we
 * reconcile per quote because multiple books contribute to one event.
 *
 * Read side: exposes exactly the verified rows the pure Odds Intelligence engine
 * needs (by tournament and by player), plus coverage counts for the admin
 * data-coverage dashboard. Consensus is DERIVED in the engine, never stored.
 */

import type { PrismaClient } from "@/lib/generated/prisma/client"

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

/** A market key as stored (mirrors the Prisma `OddsMarketType` enum). */
export type OddsMarket =
  | "TOURNAMENT_WINNER"
  | "TOP_5"
  | "TOP_10"
  | "TOP_20"
  | "MAKE_CUT"
  | "MISS_CUT"

/** One sportsbook price for one selection, resolved to a CaddieIQ player. */
export interface ResolvedOddsQuote {
  market: OddsMarket
  bookmakerKey: string
  bookmakerTitle: string
  selection: string
  selectionSlug: string
  /** Resolved CaddieIQ player id, or null when unmatched. */
  playerId: string | null
  decimalOdds: number
  americanOdds: number
  impliedProbability: number
  lastUpdate: Date
}

/** A fully-resolved event ready to persist: identity + quotes. */
export interface ResolvedOddsEvent {
  providerEventId: string
  sportKey: string
  sportTitle: string | null
  /** Resolved CaddieIQ tournament id, or null when unmatched. */
  tournamentId: string | null
  commenceTime: Date | null
  capturedAt: Date
  quotes: ResolvedOddsQuote[]
}

/** A stored quote row shaped for the pure engine (Decimals widened to number). */
export interface OddsQuoteRow {
  market: OddsMarket
  bookmakerKey: string
  bookmakerTitle: string
  selection: string
  selectionSlug: string
  playerId: string | null
  decimalOdds: number
  americanOdds: number
  impliedProbability: number
  lastUpdate: Date
}

/** A stored event + its quotes, shaped for the pure engine. */
export interface OddsEventRow {
  id: string
  providerEventId: string
  sportKey: string
  sportTitle: string | null
  tournamentId: string | null
  commenceTime: Date | null
  capturedAt: Date
  quotes: OddsQuoteRow[]
}

/** A player's quote plus the event/tournament it belongs to (player page). */
export interface PlayerOddsQuoteRow extends OddsQuoteRow {
  eventId: string
  sportTitle: string | null
  tournamentId: string | null
  tournamentName: string | null
  commenceTime: Date | null
  capturedAt: Date
}

/** Aggregate coverage counts for the admin data-coverage dashboard. */
export interface OddsCoverageCounts {
  events: number
  eventsLinkedToTournament: number
  quotes: number
  quotesResolvedToPlayer: number
  distinctBookmakers: number
  latestCapturedAt: Date | null
}

export class OddsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "odds", sink)
  }

  /**
   * Idempotently persist one resolved event and its quotes. The event is
   * reconciled on `providerEventId`; each quote on its composite unique key.
   * A quote is only overwritten when the incoming `lastUpdate` is newer than
   * the stored one (newer-wins) — otherwise it is left untouched.
   */
  async upsertEvent(
    resolved: ResolvedOddsEvent,
  ): Promise<RepositoryResult<{ id: string }>> {
    const reference = resolved.providerEventId
    try {
      const existing = await this.prisma.oddsEvent.findUnique({
        where: { providerEventId: reference },
        select: { id: true },
      })

      const record = await this.prisma.oddsEvent.upsert({
        where: { providerEventId: reference },
        create: {
          providerEventId: reference,
          sportKey: resolved.sportKey,
          sportTitle: resolved.sportTitle,
          tournamentId: resolved.tournamentId,
          commenceTime: resolved.commenceTime,
          source: "the-odds-api",
          capturedAt: resolved.capturedAt,
        },
        update: {
          sportKey: resolved.sportKey,
          sportTitle: resolved.sportTitle,
          tournamentId: resolved.tournamentId,
          commenceTime: resolved.commenceTime,
          capturedAt: resolved.capturedAt,
        },
        select: { id: true },
      })

      // Pre-load stored quote freshness for this event so we can skip writes
      // whose incoming lastUpdate is not newer than what we already hold.
      const storedQuotes = await this.prisma.oddsQuote.findMany({
        where: { oddsEventId: record.id },
        select: { market: true, bookmakerKey: true, selectionSlug: true, lastUpdate: true },
      })
      const freshnessByKey = new Map<string, Date>()
      for (const q of storedQuotes) {
        freshnessByKey.set(`${q.market}|${q.bookmakerKey}|${q.selectionSlug}`, q.lastUpdate)
      }

      for (const quote of resolved.quotes) {
        const key = `${quote.market}|${quote.bookmakerKey}|${quote.selectionSlug}`
        const storedAt = freshnessByKey.get(key)
        // Newer-wins: a non-newer incoming quote is ignored entirely.
        if (storedAt && quote.lastUpdate.getTime() <= storedAt.getTime()) continue

        await this.prisma.oddsQuote.upsert({
          where: {
            oddsEventId_market_bookmakerKey_selectionSlug: {
              oddsEventId: record.id,
              market: quote.market,
              bookmakerKey: quote.bookmakerKey,
              selectionSlug: quote.selectionSlug,
            },
          },
          create: {
            oddsEventId: record.id,
            market: quote.market,
            bookmakerKey: quote.bookmakerKey,
            bookmakerTitle: quote.bookmakerTitle,
            selection: quote.selection,
            selectionSlug: quote.selectionSlug,
            playerId: quote.playerId,
            decimalOdds: quote.decimalOdds,
            americanOdds: quote.americanOdds,
            impliedProbability: quote.impliedProbability,
            lastUpdate: quote.lastUpdate,
          },
          update: {
            bookmakerTitle: quote.bookmakerTitle,
            selection: quote.selection,
            playerId: quote.playerId,
            decimalOdds: quote.decimalOdds,
            americanOdds: quote.americanOdds,
            impliedProbability: quote.impliedProbability,
            lastUpdate: quote.lastUpdate,
          },
        })
      }

      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "oddsEvent",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<{ id: string }>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved events. Never throws per item. */
  async bulkUpsertEvents(
    rows: readonly ResolvedOddsEvent[],
  ): Promise<BulkRepositoryResult<{ id: string }>> {
    return this.runBulk(
      rows,
      (r) => r.providerEventId,
      (r) => this.upsertEvent(r),
    )
  }

  /**
   * All verified quotes for a tournament's linked odds events, newest capture
   * first. Read-only. Returns the full multi-book set so the engine can derive
   * consensus; empty array when no odds event is linked to the tournament.
   */
  async findEventsByTournamentId(tournamentId: string): Promise<OddsEventRow[]> {
    const events = await this.prisma.oddsEvent.findMany({
      where: { tournamentId },
      orderBy: { capturedAt: "desc" },
      include: {
        quotes: {
          orderBy: [{ market: "asc" }, { impliedProbability: "desc" }],
        },
      },
    })
    return events.map(toEventRow)
  }

  /**
   * A single odds event with its full multi-book quote set, by internal id.
   * Read-only. Unlike {@link findEventsByTournamentId} this does not require the
   * event to be linked to a CaddieIQ tournament, so the player view can always
   * reconstruct the full field an isolated player quote sits in. Returns null
   * when no such event exists.
   */
  async findEventById(eventId: string): Promise<OddsEventRow | null> {
    const event = await this.prisma.oddsEvent.findUnique({
      where: { id: eventId },
      include: {
        quotes: {
          orderBy: [{ market: "asc" }, { impliedProbability: "desc" }],
        },
      },
    })
    return event ? toEventRow(event) : null
  }

  /**
   * Verified quotes for a specific player across linked events, newest capture
   * first. Read-only — the player page consumes this to derive the player's
   * market signal.
   */
  async findQuotesByPlayerId(
    playerId: string,
    limit = 60,
  ): Promise<PlayerOddsQuoteRow[]> {
    const quotes = await this.prisma.oddsQuote.findMany({
      where: { playerId },
      orderBy: { event: { capturedAt: "desc" } },
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            sportTitle: true,
            tournamentId: true,
            commenceTime: true,
            capturedAt: true,
            tournament: { select: { name: true } },
          },
        },
      },
    })
    return quotes.map((q) => ({
      market: q.market as OddsMarket,
      bookmakerKey: q.bookmakerKey,
      bookmakerTitle: q.bookmakerTitle,
      selection: q.selection,
      selectionSlug: q.selectionSlug,
      playerId: q.playerId,
      decimalOdds: toNumber(q.decimalOdds),
      americanOdds: q.americanOdds,
      impliedProbability: toNumber(q.impliedProbability),
      lastUpdate: q.lastUpdate,
      eventId: q.event.id,
      sportTitle: q.event.sportTitle,
      tournamentId: q.event.tournamentId,
      tournamentName: q.event.tournament?.name ?? null,
      commenceTime: q.event.commenceTime,
      capturedAt: q.event.capturedAt,
    }))
  }

  /** Aggregate coverage counts for the admin data-coverage dashboard. */
  async getCoverageCounts(): Promise<OddsCoverageCounts> {
    const [events, eventsLinked, quotes, quotesResolved, distinctBooks, latest] =
      await Promise.all([
        this.prisma.oddsEvent.count(),
        this.prisma.oddsEvent.count({ where: { tournamentId: { not: null } } }),
        this.prisma.oddsQuote.count(),
        this.prisma.oddsQuote.count({ where: { playerId: { not: null } } }),
        this.prisma.oddsQuote.findMany({
          distinct: ["bookmakerKey"],
          select: { bookmakerKey: true },
        }),
        this.prisma.oddsEvent.findFirst({
          orderBy: { capturedAt: "desc" },
          select: { capturedAt: true },
        }),
      ])
    return {
      events,
      eventsLinkedToTournament: eventsLinked,
      quotes,
      quotesResolvedToPlayer: quotesResolved,
      distinctBookmakers: distinctBooks.length,
      latestCapturedAt: latest?.capturedAt ?? null,
    }
  }
}

/** Widen a Prisma event+quotes record to the engine's row shape. */
function toEventRow(event: {
  id: string
  providerEventId: string
  sportKey: string
  sportTitle: string | null
  tournamentId: string | null
  commenceTime: Date | null
  capturedAt: Date
  quotes: Array<{
    market: string
    bookmakerKey: string
    bookmakerTitle: string
    selection: string
    selectionSlug: string
    playerId: string | null
    decimalOdds: unknown
    americanOdds: number
    impliedProbability: unknown
    lastUpdate: Date
  }>
}): OddsEventRow {
  return {
    id: event.id,
    providerEventId: event.providerEventId,
    sportKey: event.sportKey,
    sportTitle: event.sportTitle,
    tournamentId: event.tournamentId,
    commenceTime: event.commenceTime,
    capturedAt: event.capturedAt,
    quotes: event.quotes.map((q) => ({
      market: q.market as OddsMarket,
      bookmakerKey: q.bookmakerKey,
      bookmakerTitle: q.bookmakerTitle,
      selection: q.selection,
      selectionSlug: q.selectionSlug,
      playerId: q.playerId,
      decimalOdds: toNumber(q.decimalOdds),
      americanOdds: q.americanOdds,
      impliedProbability: toNumber(q.impliedProbability),
      lastUpdate: q.lastUpdate,
    })),
  }
}

/** Coerce a Prisma Decimal (or number) into a JS number. */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value)
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _oddsRepository: OddsRepository | undefined
export function getOddsRepository(): OddsRepository {
  return (_oddsRepository ??= new OddsRepository())
}
