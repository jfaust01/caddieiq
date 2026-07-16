/**
 * Odds import & association (The Odds API → CaddieIQ).
 *
 * Pipeline:
 *   Provider   → list active golf outright sports, then fetch multi-book odds
 *                for each (regions=us, markets=outrights, decimal).
 *   Normalize  → derive American odds + raw implied probability from each
 *                verified decimal price (pure `math.ts`). Nothing is fabricated:
 *                a quote exists only where the provider returned a real price.
 *   Bridge     → event → CaddieIQ tournament by name (see `matchTournament`);
 *                selection (player name) → Player by deterministic slug.
 *   Repository → idempotent, freshness-guarded upsert (newer `lastUpdate` wins).
 *
 * The Odds API's golf coverage is tournament-WINNER outrights, so every quote is
 * stored under the TOURNAMENT_WINNER market. Other markets (Top-5/10/20, cut)
 * are modeled but never invented — they simply carry no rows until a feed offers
 * them. Unmatched events/selections are still stored (linked ids left null) so
 * coverage is reported honestly rather than silently dropped.
 */

import { slugify } from "@/lib/domain/shared/utils"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { OddsApiClient } from "@/lib/providers/odds/client"
import type { OddsApiEvent } from "@/lib/providers/odds/types"
import { decimalToAmerican, impliedProbabilityFromDecimal, isValidDecimalOdds } from "@/lib/odds-intelligence/math"
import {
  getOddsRepository,
  type OddsRepository,
  type ResolvedOddsEvent,
  type ResolvedOddsQuote,
} from "@/lib/repositories"

/** A tournament candidate used for name-based event association. */
export interface TournamentMatchCandidate {
  id: string
  name: string
  slug: string
  startDate: Date | null
  endDate: Date | null
}

/** Outcome of an odds import run, suitable for an import report. */
export interface OddsImportSummary {
  sportsConsidered: number
  eventsSeen: number
  inserted: number
  updated: number
  failed: number
  /** Events resolved to a CaddieIQ tournament. */
  linkedToTournament: number
  /** Distinct (event,book,selection) quotes built from verified prices. */
  quotesBuilt: number
  /** Quotes resolved to a CaddieIQ player. */
  quotesLinkedToPlayer: number
  /** Distinct bookmakers observed across all events. */
  distinctBookmakers: number
  /** Quota snapshot from the provider after the run. */
  quota: { remaining: number | null; used: number | null }
  notes: string[]
}

export interface ImportOddsOptions {
  prisma?: PrismaClient
  client?: OddsApiClient
  repository?: OddsRepository
  /** Override the set of sport keys to import (defaults to live golf sports). */
  sportKeys?: readonly string[]
  maxNotes?: number
}

/** Market-name suffixes appended to golf sport keys, stripped before matching. */
const SPORT_KEY_SUFFIXES = [
  "_winner",
  "_outright",
  "_outrights",
  "_top_5_finish",
  "_top_10_finish",
  "_top_20_finish",
]

/**
 * Derive a tournament-name slug from a The Odds API event. The `sport_key`
 * (e.g. `golf_the_open_championship_winner`) is the reliable signal — its
 * `sport_title` is often a marketing label ("The Open Winner"). We strip the
 * `golf_` prefix and the market suffix, leaving `the_open_championship` →
 * `the-open-championship`, which lines up with CaddieIQ tournament slugs.
 */
export function eventMatchSlug(
  event: Pick<OddsApiEvent, "sport_key" | "sport_title">,
): string {
  let key = (event.sport_key ?? "").toLowerCase()
  if (key.startsWith("golf_")) key = key.slice("golf_".length)
  for (const suffix of SPORT_KEY_SUFFIXES) {
    if (key.endsWith(suffix)) {
      key = key.slice(0, -suffix.length)
      break
    }
  }
  const fromKey = slugify(key)
  return fromKey || slugify(event.sport_title ?? "")
}

/**
 * Match an odds event to a CaddieIQ tournament, optionally constrained by date
 * proximity. Pure and exported for testing.
 *
 * Strategy (honest, conservative — prefers no link over a wrong link):
 *   1. Exact slug equality between the event's derived slug and a tournament
 *      slug (see {@link eventMatchSlug}).
 *   2. Slug containment either direction (e.g. "the-open-championship" ⊇
 *      "open-championship"), but only for reasonably long slugs to avoid
 *      matching on a single common word.
 *   3. When `commenceTime` is provided and several tournaments tie, prefer the
 *      one whose [startDate, endDate] window is nearest the commence time.
 */
export function matchTournament(
  event: Pick<OddsApiEvent, "sport_key" | "sport_title" | "commence_time">,
  candidates: readonly TournamentMatchCandidate[],
): string | null {
  const titleSlug = eventMatchSlug(event)
  if (!titleSlug) return null

  const commence = event.commence_time ? new Date(event.commence_time) : null
  const commenceMs = commence && !Number.isNaN(commence.getTime()) ? commence.getTime() : null

  const scored: { id: string; score: number; dateDelta: number }[] = []
  for (const candidate of candidates) {
    const candidateSlug = candidate.slug || slugify(candidate.name)
    if (!candidateSlug) continue

    let score = 0
    if (candidateSlug === titleSlug) {
      score = 3
    } else if (
      titleSlug.length >= 8 &&
      candidateSlug.length >= 8 &&
      (titleSlug.includes(candidateSlug) || candidateSlug.includes(titleSlug))
    ) {
      score = 2
    }
    if (score === 0) continue

    // Date proximity (days) between commence time and the tournament window.
    let dateDelta = Number.MAX_SAFE_INTEGER
    if (commenceMs != null && candidate.startDate) {
      const start = candidate.startDate.getTime()
      const end = candidate.endDate?.getTime() ?? start
      if (commenceMs >= start && commenceMs <= end) dateDelta = 0
      else dateDelta = Math.min(Math.abs(commenceMs - start), Math.abs(commenceMs - end))
    }
    scored.push({ id: candidate.id, score, dateDelta })
  }

  if (scored.length === 0) return null
  scored.sort((a, b) => (b.score - a.score) || (a.dateDelta - b.dateDelta))
  return scored[0].id
}

/**
 * Build the resolved quotes for one event from its raw bookmaker books. Only
 * verified decimal prices become quotes; anything non-numeric or <= 1 is
 * skipped (never coerced to a fake price). Exported for testing.
 */
export function buildQuotesForEvent(
  event: OddsApiEvent,
  playerIdBySlug: ReadonlyMap<string, string>,
): { quotes: ResolvedOddsQuote[]; bookmakers: Set<string> } {
  const quotes: ResolvedOddsQuote[] = []
  const bookmakers = new Set<string>()

  for (const book of event.bookmakers ?? []) {
    const bookUpdate = book.last_update ? new Date(book.last_update) : null
    for (const market of book.markets ?? []) {
      if (market.key !== "outrights") continue // golf = winner outrights only
      const marketUpdate = market.last_update ? new Date(market.last_update) : bookUpdate
      const lastUpdate =
        marketUpdate && !Number.isNaN(marketUpdate.getTime()) ? marketUpdate : new Date()

      for (const outcome of market.outcomes ?? []) {
        const decimal = outcome.price
        if (!isValidDecimalOdds(decimal)) continue
        const selection = outcome.name?.trim()
        if (!selection) continue
        const selectionSlug = slugify(selection)
        bookmakers.add(book.key)
        quotes.push({
          market: "TOURNAMENT_WINNER",
          bookmakerKey: book.key,
          bookmakerTitle: book.title ?? book.key,
          selection,
          selectionSlug,
          playerId: playerIdBySlug.get(selectionSlug) ?? null,
          decimalOdds: decimal,
          americanOdds: decimalToAmerican(decimal),
          impliedProbability: impliedProbabilityFromDecimal(decimal),
          lastUpdate,
        })
      }
    }
  }

  return { quotes, bookmakers }
}

/**
 * Import golf odds from The Odds API and associate them with tournaments and
 * players. Idempotent and safe to re-run: the repository reconciles on stable
 * keys and only overwrites a quote when the incoming price is newer.
 */
export async function importOdds(
  options: ImportOddsOptions = {},
): Promise<OddsImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const client = options.client ?? OddsApiClient.fromEnv()
  const repository = options.repository ?? getOddsRepository()
  const maxNotes = options.maxNotes ?? 25

  const summary: OddsImportSummary = {
    sportsConsidered: 0,
    eventsSeen: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    linkedToTournament: 0,
    quotesBuilt: 0,
    quotesLinkedToPlayer: 0,
    distinctBookmakers: 0,
    quota: { remaining: null, used: null },
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // Determine which golf sport keys to import.
  let sportKeys: string[]
  if (options.sportKeys && options.sportKeys.length > 0) {
    sportKeys = [...options.sportKeys]
  } else {
    try {
      const sports = await client.listGolfSports()
      sportKeys = sports.map((s) => s.key)
    } catch (error) {
      note(`Failed to list golf sports: ${(error as Error).message}`)
      return summary
    }
  }
  summary.sportsConsidered = sportKeys.length
  if (sportKeys.length === 0) {
    note("No active golf outright markets are currently offered by the provider.")
    return summary
  }

  // Catalogs for id resolution: player slug → id, tournament candidates.
  const [dbPlayers, dbTournaments] = await Promise.all([
    prisma.player.findMany({ where: { deletedAt: null }, select: { id: true, slug: true } }),
    prisma.tournament.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, startDate: true, endDate: true },
    }),
  ])
  const playerIdBySlug = new Map(dbPlayers.map((p) => [p.slug, p.id]))
  const tournamentCandidates: TournamentMatchCandidate[] = dbTournaments.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    startDate: t.startDate,
    endDate: t.endDate,
  }))

  const allBookmakers = new Set<string>()
  const resolved: ResolvedOddsEvent[] = []
  const capturedAt = new Date()

  for (const sportKey of sportKeys) {
    let events: OddsApiEvent[]
    try {
      const result = await client.fetchOdds(sportKey)
      events = result.events
      summary.quota = { remaining: result.quota.remaining, used: result.quota.used }
    } catch (error) {
      note(`Fetch failed for ${sportKey}: ${(error as Error).message}`)
      continue
    }

    for (const event of events) {
      summary.eventsSeen += 1
      const tournamentId = matchTournament(event, tournamentCandidates)
      if (tournamentId) summary.linkedToTournament += 1

      const { quotes, bookmakers } = buildQuotesForEvent(event, playerIdBySlug)
      for (const book of bookmakers) allBookmakers.add(book)
      summary.quotesBuilt += quotes.length
      summary.quotesLinkedToPlayer += quotes.filter((q) => q.playerId != null).length

      resolved.push({
        providerEventId: event.id,
        sportKey: event.sport_key,
        sportTitle: event.sport_title ?? null,
        tournamentId,
        commenceTime: event.commence_time ? new Date(event.commence_time) : null,
        capturedAt,
        quotes,
      })
    }
  }

  summary.distinctBookmakers = allBookmakers.size

  const result = await repository.bulkUpsertEvents(resolved)
  summary.inserted = result.inserted
  summary.updated = result.updated
  summary.failed = result.failed
  for (const err of result.errors) {
    note(`Persist failed (${err.reference ?? "?"}): ${err.error.message}`)
  }

  return summary
}
