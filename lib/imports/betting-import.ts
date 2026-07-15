/**
 * Betting import & association.
 *
 * SportsDataIO exposes betting events (with nested markets + outcomes) via
 * `/odds/json/BettingEventsByDate/{date}`. This module drives the full pipeline:
 *
 *   Provider   → fetch betting events for a set of dates + the players &
 *                tournaments catalogs (for the id bridges)
 *   Mapper     → map each raw event into a DomainBettingEvent, with the scramble
 *                gate applied to market descriptors and outcome payouts
 *   Bridge     → event TournamentID → slug → Tournament.id;
 *                outcome PlayerID → slug → Player.id
 *   Repository → upsert the event/market/outcome tree on unique externalIds
 *
 * Scramble handling: the pipeline is fully built. When the trial tier scrambles
 * a value the mapper stores the real STRUCTURE with `available:false` + null
 * values, so nothing fake is surfaced and real odds flow automatically once a
 * production key is installed.
 */

import { mapSportsDataBettingEvent } from "@/lib/domain/betting/mapper"
import type { DomainBettingEvent } from "@/lib/domain/betting/types"
import { mapSportsDataPlayer } from "@/lib/domain/player/mapper"
import { mapSportsDataTournament } from "@/lib/domain/tournament/mapper"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { SportsDataProvider } from "@/lib/providers/sportsdataio/client"
import type {
  SdioBettingEvent,
  SdioPlayer,
  SdioTournament,
} from "@/lib/providers/sportsdataio/types"
import {
  getBettingRepository,
  type BettingRepository,
  type ResolvedBettingEvent,
} from "@/lib/repositories"

/** Outcome of a betting import run, suitable for an import report. */
export interface BettingImportSummary {
  eventsSeen: number
  inserted: number
  updated: number
  failed: number
  /** Events resolved to a CaddieIQ tournament. */
  linkedToTournament: number
  /** Distinct outcomes whose values were scrambled (stored unavailable). */
  scrambledOutcomes: number
  /** Distinct outcomes with real, available payouts. */
  availableOutcomes: number
  notes: string[]
}

export interface ImportBettingOptions {
  prisma?: PrismaClient
  provider?: SportsDataProvider
  repository?: BettingRepository
  /** `YYYY-MM-DD` dates to pull events for. Defaults to today (UTC). */
  dates?: readonly string[]
  maxNotes?: number
}

/** Today's date in `YYYY-MM-DD` (UTC), the provider's expected format. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Import betting events for the given dates and associate them with tournaments
 * and players. Idempotent: every node reconciles on its unique `externalId`.
 */
export async function importBetting(
  options: ImportBettingOptions = {},
): Promise<BettingImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const provider = options.provider ?? SportsDataProvider.fromEnv()
  const repository = options.repository ?? getBettingRepository()
  const maxNotes = options.maxNotes ?? 25
  const dates = options.dates && options.dates.length > 0 ? options.dates : [todayUtc()]

  const summary: BettingImportSummary = {
    eventsSeen: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    linkedToTournament: 0,
    scrambledOutcomes: 0,
    availableOutcomes: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // Bridges: provider id → deterministic slug, using the exact mappers so slugs
  // match what we stored, then slug → CaddieIQ id from our catalogs.
  const tournamentSlugByExternalId = new Map<string, string>()
  try {
    const tournaments = await provider.listTournaments()
    for (const raw of (tournaments.data ?? []) as SdioTournament[]) {
      const mapped = mapSportsDataTournament(raw)
      tournamentSlugByExternalId.set(mapped.externalRef.externalId, mapped.slug)
    }
  } catch (error) {
    note(`Tournaments feed fetch failed (events may be unlinked): ${(error as Error).message}`)
  }

  const playerSlugByExternalId = new Map<string, string>()
  try {
    const players = await provider.listPlayers()
    for (const raw of (players.data ?? []) as SdioPlayer[]) {
      const mapped = mapSportsDataPlayer(raw)
      playerSlugByExternalId.set(mapped.externalRef.externalId, mapped.slug)
    }
  } catch (error) {
    note(`Players feed fetch failed (outcomes may be unlinked): ${(error as Error).message}`)
  }

  const [dbTournaments, dbPlayers] = await Promise.all([
    prisma.tournament.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
    prisma.player.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
  ])
  const tournamentIdBySlug = new Map(dbTournaments.map((t) => [t.slug, t.id]))
  const playerIdBySlug = new Map(dbPlayers.map((p) => [p.slug, p.id]))

  // Provider: fetch events across all requested dates.
  const rawEvents: SdioBettingEvent[] = []
  for (const date of dates) {
    try {
      const response = await provider.listBettingEventsByDate(date)
      rawEvents.push(...(response.data ?? []))
    } catch (error) {
      note(`Betting fetch failed for ${date}: ${(error as Error).message}`)
    }
  }
  summary.eventsSeen = rawEvents.length

  // Mapper + bridge → resolved rows for the repository.
  const resolved: ResolvedBettingEvent[] = rawEvents.map((raw) => {
    const event = mapSportsDataBettingEvent(raw)
    const tournamentId = resolveTournamentId(
      event,
      tournamentSlugByExternalId,
      tournamentIdBySlug,
    )
    if (tournamentId) summary.linkedToTournament += 1

    // Resolve every outcome's player id up front so the repository issues no
    // extra queries, and tally scramble stats for the report.
    const playerIdByExternalId = new Map<number, string>()
    for (const market of event.markets) {
      for (const outcome of market.outcomes) {
        if (outcome.available) summary.availableOutcomes += 1
        else summary.scrambledOutcomes += 1
        if (outcome.playerExternalId != null && outcome.playerSlug) {
          const slug =
            playerSlugByExternalId.get(String(outcome.playerExternalId)) ??
            outcome.playerSlug
          const id = playerIdBySlug.get(slug)
          if (id) playerIdByExternalId.set(outcome.playerExternalId, id)
        }
      }
    }
    return { tournamentId, playerIdByExternalId, event }
  })

  const result = await repository.bulkUpsert(resolved)
  summary.inserted += result.inserted
  summary.updated += result.updated
  summary.failed += result.failed
  for (const err of result.errors) {
    note(`Persist failed (${err.reference ?? "?"}): ${err.error.message}`)
  }

  return summary
}

/** Resolve an event's tournament id via its provider TournamentID → slug → id. */
function resolveTournamentId(
  event: DomainBettingEvent,
  slugByExternalId: Map<string, string>,
  idBySlug: Map<string, string>,
): string | null {
  if (event.tournamentExternalId == null) return null
  const slug = slugByExternalId.get(String(event.tournamentExternalId))
  return slug ? idBySlug.get(slug) ?? null : null
}
