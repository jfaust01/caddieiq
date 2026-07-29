/**
 * Tournament field import & linking.
 *
 * A tournament's *field* — the roster of players entered in / competing at an
 * event — is the join between an existing `Tournament` and existing `Player`
 * records, stored in `tournament_fields`. SportsDataIO exposes it only per
 * tournament via `/json/Leaderboard/{tournamentid}`, so this module drives the
 * full pipeline for each of our tournaments:
 *
 *   Provider   → fetch the leaderboard for the tournament's provider id
 *   Mapper     → map each raw row to a `TournamentFieldEntry` (status derived)
 *   Validation → drop malformed/duplicate entries (see field-validator)
 *   Repository → resolve player slug → id, then upsert the join row
 *
 * Matching strategy (no external-id columns exist, so everything reconciles by
 * deterministic slug):
 *   our tournament → provider TournamentID  via slugify(name) + calendar year
 *   entry          → Player.id              via slugify(player name)
 *
 * Nothing is fabricated. An entry is persisted only when its player already
 * exists; tournaments with no published field (future editions) and unmatched
 * players (amateurs/qualifiers absent from our catalog) are counted and
 * reported, never guessed.
 */

import { mapSportsDataFieldEntry } from "@/lib/domain/field/mapper"
import { slugify } from "@/lib/domain/shared/utils"
import { validateFieldEntries } from "@/lib/data-quality"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { SportsDataProvider } from "@/lib/providers/sportsdataio/client"
import type { SdioLeaderboardPlayer, SdioTournament } from "@/lib/providers/sportsdataio/types"
import {
  getFieldRepository,
  type FieldRepository,
  type ResolvedFieldEntry,
} from "@/lib/repositories"

/** Outcome of a field import run, suitable for surfacing in an import report. */
export interface FieldImportSummary {
  /** Tournaments in our DB we attempted to resolve a provider field for. */
  tournamentsConsidered: number
  /** Tournaments that had a published field we imported. */
  tournamentsWithField: number
  /** Raw leaderboard rows seen across all fields. */
  entriesSeen: number
  /** Entries dropped by validation (malformed or duplicate). */
  entriesInvalid: number
  /** Entries skipped because their player is not in our catalog. */
  entriesUnmatchedPlayer: number
  /** Join rows newly created. */
  inserted: number
  /** Existing join rows updated (idempotent re-run). */
  updated: number
  /** Entries whose write failed. */
  failed: number
  /** Human-readable notes on skips/failures (bounded for log hygiene). */
  notes: string[]
}

export interface ImportFieldsOptions {
  prisma?: PrismaClient
  provider?: SportsDataProvider
  repository?: FieldRepository
  /** Max number of notes to retain. */
  maxNotes?: number
}

/** Resolve the calendar year for a raw tournament row: StartDate year. */
function resolveYear(row: SdioTournament): number | undefined {
  if (typeof row.StartDate === "string") {
    const parsed = new Date(row.StartDate)
    if (!Number.isNaN(parsed.getTime())) return parsed.getUTCFullYear()
  }
  return undefined
}

export interface SingleTournamentFieldImportResult extends FieldImportSummary {
  /** Total TournamentField rows found for this tournament before import */
  preImportFieldRowCount: number
  /** Total TournamentField rows after import */
  postImportFieldRowCount: number
  /** sourceRecordId values that were successfully written */
  sourceRecordIdWritten: number
  /** sourceRecordId values that remain NULL after import */
  sourceRecordIdStillNull: number
}

/**
 * Import tournament field for a single, specific tournament. Fetches the latest
 * field from SportsDataIO, updates all TournamentField rows for that tournament,
 * and verifies sourceRecordId was persisted by querying the database immediately
 * after the import.
 */
export async function importSingleTournamentField(
  tournamentId: string,
  options: ImportFieldsOptions = {},
): Promise<SingleTournamentFieldImportResult> {
  const prisma = options.prisma ?? prismaClient
  const provider = options.provider ?? SportsDataProvider.fromEnv()
  const repository = options.repository ?? getFieldRepository()
  const maxNotes = options.maxNotes ?? 25

  const result: SingleTournamentFieldImportResult = {
    tournamentsConsidered: 0,
    tournamentsWithField: 0,
    entriesSeen: 0,
    entriesInvalid: 0,
    entriesUnmatchedPlayer: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    notes: [],
    preImportFieldRowCount: 0,
    postImportFieldRowCount: 0,
    sourceRecordIdWritten: 0,
    sourceRecordIdStillNull: 0,
  }
  const note = (message: string) => {
    if (result.notes.length < maxNotes) result.notes.push(message)
  }

  // Get the tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, slug: true, name: true, startDate: true, externalId: true },
  })

  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`)
  }

  result.tournamentsConsidered = 1

  // Count pre-import field rows
  result.preImportFieldRowCount = await prisma.tournamentField.count({
    where: { tournamentId: tournament.id },
  })

  // Get provider tournament ID from externalId
  const providerId = parseInt(tournament.externalId || '0', 10)
  if (providerId === 0) {
    throw new Error(`Tournament ${tournament.name} has no externalId (SportsDataIO ID)`)
  }

  // Fetch field from provider
  let rawPlayers: SdioLeaderboardPlayer[] = []
  let tournamentIsOver = false
  try {
    const response = await provider.getLeaderboard(String(providerId))
    rawPlayers = response.data.Players ?? []
    tournamentIsOver = response.data.Tournament?.IsOver === true
  } catch (error) {
    throw new Error(
      `Failed to fetch leaderboard for "${tournament.name}" (ID ${providerId}): ${(error as Error).message}`,
    )
  }

  if (rawPlayers.length === 0) {
    throw new Error(`No players returned from provider for tournament "${tournament.name}"`)
  }

  result.tournamentsWithField = 1
  result.entriesSeen = rawPlayers.length

  // Map to domain entries
  const mapped = rawPlayers.map((row) => mapSportsDataFieldEntry(row, { tournamentIsOver }))

  // Validate entries
  const { valid, dropped, duplicates } = validateFieldEntries(mapped)
  result.entriesInvalid = dropped + duplicates

  // Load player slug → id map
  const players = await prisma.player.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  })
  const playerIdBySlug = new Map(players.map((p) => [p.slug, p.id]))

  // Resolve entries
  const resolved: ResolvedFieldEntry[] = []
  for (const entry of valid) {
    const playerId = playerIdBySlug.get(entry.playerSlug)
    if (!playerId) {
      result.entriesUnmatchedPlayer += 1
      note(`Unmatched player "${entry.playerName}"`)
      continue
    }
    resolved.push({ tournamentId: tournament.id, playerId, entry })
  }

  // Persist using fixed repository (now with sourceRecordId)
  const persistResult = await repository.bulkUpsert(resolved)
  result.inserted = persistResult.inserted
  result.updated = persistResult.updated
  result.failed = persistResult.failed
  for (const err of persistResult.errors) {
    note(`Persist failed (${err.reference ?? '?'}): ${err.error.message}`)
  }

  // IMMEDIATELY VERIFY: Query database to check sourceRecordId was persisted
  result.postImportFieldRowCount = await prisma.tournamentField.count({
    where: { tournamentId: tournament.id },
  })

  const verification = await prisma.tournamentField.findMany({
    where: { tournamentId: tournament.id },
    select: { sourceRecordId: true },
  })

  result.sourceRecordIdWritten = verification.filter((f) => f.sourceRecordId !== null).length
  result.sourceRecordIdStillNull = verification.filter((f) => f.sourceRecordId === null).length

  return result
}

/**
 * Import tournament fields for every tournament in our database that can be
 * matched to a provider tournament id (by slug + year). Idempotent: each entry
 * reconciles on `(tournamentId, playerId)`.
 */
export async function importTournamentFields(
  options: ImportFieldsOptions = {},
): Promise<FieldImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const provider = options.provider ?? SportsDataProvider.fromEnv()
  const repository = options.repository ?? getFieldRepository()
  const maxNotes = options.maxNotes ?? 25

  const summary: FieldImportSummary = {
    tournamentsConsidered: 0,
    tournamentsWithField: 0,
    entriesSeen: 0,
    entriesInvalid: 0,
    entriesUnmatchedPlayer: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // Build provider-tournament lookup: slug:year → TournamentID. The feed repeats
  // event names across editions, so the year disambiguates.
  const feed = await provider.listTournaments()
  const providerIdBySlugYear = new Map<string, number>()
  for (const t of feed.data) {
    const name = typeof t.Name === "string" ? t.Name.trim() : ""
    const year = resolveYear(t)
    if (name === "" || year === undefined) continue
    // First edition wins; feed is internally consistent per (slug, year).
    const key = `${slugify(name)}:${year}`
    if (!providerIdBySlugYear.has(key)) providerIdBySlugYear.set(key, t.TournamentID)
  }

  // Our tournaments + a slug → Player.id map (small tables, load once).
  const [tournaments, players] = await Promise.all([
    prisma.tournament.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, name: true, startDate: true },
    }),
    prisma.player.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
  ])
  const playerIdBySlug = new Map(players.map((p) => [p.slug, p.id]))

  for (const tournament of tournaments) {
    summary.tournamentsConsidered += 1

    const year = tournament.startDate
      ? new Date(tournament.startDate).getUTCFullYear()
      : undefined
    if (year === undefined) {
      note(`No start year for tournament "${tournament.name}"`)
      continue
    }

    const providerId = providerIdBySlugYear.get(`${tournament.slug}:${year}`)
    if (providerId === undefined) {
      note(`No provider match for "${tournament.name}" @ ${year}`)
      continue
    }

    // Provider: fetch the field.
    let rawPlayers: SdioLeaderboardPlayer[] = []
    let tournamentIsOver = false
    try {
      const response = await provider.getLeaderboard(String(providerId))
      rawPlayers = response.data.Players ?? []
      tournamentIsOver = response.data.Tournament?.IsOver === true
    } catch (error) {
      note(`Leaderboard fetch failed for "${tournament.name}": ${(error as Error).message}`)
      continue
    }
    if (rawPlayers.length === 0) continue // future/unplayed edition — no field yet
    summary.tournamentsWithField += 1
    summary.entriesSeen += rawPlayers.length

    // Mapper: raw → domain entries.
    const mapped = rawPlayers.map((row) =>
      mapSportsDataFieldEntry(row, { tournamentIsOver }),
    )

    // Validation: drop malformed / intra-field duplicate entries.
    const { valid, dropped, duplicates } = validateFieldEntries(mapped)
    summary.entriesInvalid += dropped + duplicates

    // Repository: resolve each valid entry's player slug → id, then persist.
    const resolved: ResolvedFieldEntry[] = []
    for (const entry of valid) {
      const playerId = playerIdBySlug.get(entry.playerSlug)
      if (!playerId) {
        summary.entriesUnmatchedPlayer += 1
        note(`Unmatched player "${entry.playerName}" in "${tournament.name}"`)
        continue
      }
      resolved.push({ tournamentId: tournament.id, playerId, entry })
    }

    const result = await repository.bulkUpsert(resolved)
    summary.inserted += result.inserted
    summary.updated += result.updated
    summary.failed += result.failed
    for (const err of result.errors) {
      note(`Persist failed (${err.reference ?? "?"}): ${err.error.message}`)
    }
  }

  return summary
}
