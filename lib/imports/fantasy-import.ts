/**
 * Fantasy & DFS import.
 *
 * SportsDataIO exposes per-tournament fantasy projections via
 * `/projections/json/PlayerTournamentProjectionStats/{tournamentId}` and DFS
 * slates via `/json/DfsSlatesByTournament/{tournamentId}`. This module drives
 * both pipelines for a set of tournaments:
 *
 *   Provider   → fetch projections + DFS slates per tournament, and the players
 *                catalog (for the id bridge)
 *   Mapper     → map each row; projection VALUES pass the scramble gate, DFS
 *                salaries are real and ungated
 *   Bridge     → provider PlayerID → slug → Player.id (tournament id is known)
 *   Repository → upsert projections + salaries on unique composite externalIds
 *
 * Projection values scrambled by the trial tier are nulled and flagged
 * `available:false`; the rows persist so real values flow once a production key
 * is installed. DFS salaries persist as-is (absent = null).
 */

import {
  mapSportsDataDfsSlate,
  mapSportsDataProjection,
} from "@/lib/domain/fantasy/mapper"
import { mapSportsDataPlayer } from "@/lib/domain/player/mapper"
import { mapSportsDataTournament } from "@/lib/domain/tournament/mapper"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { SportsDataProvider } from "@/lib/providers/sportsdataio/client"
import type { SdioPlayer, SdioTournament } from "@/lib/providers/sportsdataio/types"
import {
  getFantasyRepository,
  type FantasyRepository,
  type ResolvedDfsSalary,
  type ResolvedFantasyProjection,
} from "@/lib/repositories"

/** Outcome of a fantasy/DFS import run, suitable for an import report. */
export interface FantasyImportSummary {
  tournamentsProcessed: number
  projectionsSeen: number
  projectionsInserted: number
  projectionsUpdated: number
  projectionsFailed: number
  /** Projections with real, available values. */
  projectionsAvailable: number
  /** Projections whose values were scrambled (stored unavailable). */
  projectionsScrambled: number
  salariesSeen: number
  salariesInserted: number
  salariesUpdated: number
  salariesFailed: number
  notes: string[]
}

export interface ImportFantasyOptions {
  prisma?: PrismaClient
  provider?: SportsDataProvider
  repository?: FantasyRepository
  /**
   * Provider TournamentIDs to import. When omitted, the importer derives them
   * from tournaments in our catalog that carry a SportsDataIO external ref.
   */
  tournamentExternalIds?: readonly string[]
  maxNotes?: number
}

/**
 * Import fantasy projections and DFS salaries for the given tournaments.
 * Idempotent: each projection/salary reconciles on its composite `externalId`.
 */
export async function importFantasy(
  options: ImportFantasyOptions = {},
): Promise<FantasyImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const provider = options.provider ?? SportsDataProvider.fromEnv()
  const repository = options.repository ?? getFantasyRepository()
  const maxNotes = options.maxNotes ?? 25

  const summary: FantasyImportSummary = {
    tournamentsProcessed: 0,
    projectionsSeen: 0,
    projectionsInserted: 0,
    projectionsUpdated: 0,
    projectionsFailed: 0,
    projectionsAvailable: 0,
    projectionsScrambled: 0,
    salariesSeen: 0,
    salariesInserted: 0,
    salariesUpdated: 0,
    salariesFailed: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // Player bridge: provider PlayerID → slug → Player.id.
  const playerSlugByExternalId = new Map<string, string>()
  try {
    const players = await provider.listPlayers()
    for (const raw of (players.data ?? []) as SdioPlayer[]) {
      const mapped = mapSportsDataPlayer(raw)
      playerSlugByExternalId.set(mapped.externalRef.externalId, mapped.slug)
    }
  } catch (error) {
    note(`Players feed fetch failed (rows may be unlinked): ${(error as Error).message}`)
  }
  const dbPlayers = await prisma.player.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  })
  const playerIdBySlug = new Map(dbPlayers.map((p) => [p.slug, p.id]))
  const resolvePlayerId = (playerExternalId: number | null, fallbackSlug: string | null) => {
    if (playerExternalId == null) return null
    const slug = playerSlugByExternalId.get(String(playerExternalId)) ?? fallbackSlug
    return slug ? playerIdBySlug.get(slug) ?? null : null
  }

  // Tournament bridge: provider TournamentID → slug → CaddieIQ id, built from
  // the Tournaments feed using the exact tournament mapper (same approach as the
  // betting importer, since there is no external-id column).
  const tournamentSlugByExternalId = new Map<string, string>()
  try {
    const tournaments = await provider.listTournaments()
    for (const raw of (tournaments.data ?? []) as SdioTournament[]) {
      const mapped = mapSportsDataTournament(raw)
      tournamentSlugByExternalId.set(mapped.externalRef.externalId, mapped.slug)
    }
  } catch (error) {
    note(`Tournaments feed fetch failed: ${(error as Error).message}`)
  }
  const dbTournaments = await prisma.tournament.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  })
  const tournamentIdBySlug = new Map(dbTournaments.map((t) => [t.slug, t.id]))
  const tournamentIdByExternalId = (externalId: string): string | null => {
    const slug = tournamentSlugByExternalId.get(externalId)
    return slug ? tournamentIdBySlug.get(slug) ?? null : null
  }

  // Determine which tournaments to import. Explicit ids override; otherwise
  // import every catalog tournament we can bridge to a provider id.
  const targets: ImportTarget[] = []
  if (options.tournamentExternalIds && options.tournamentExternalIds.length > 0) {
    for (const externalId of options.tournamentExternalIds) {
      targets.push({ id: tournamentIdByExternalId(externalId), externalId })
    }
  } else {
    for (const [externalId, slug] of tournamentSlugByExternalId) {
      const id = tournamentIdBySlug.get(slug)
      if (id) targets.push({ id, externalId })
    }
  }
  if (targets.length === 0) {
    note("No target tournaments could be resolved from the provider feed.")
    return summary
  }

  for (const target of targets) {
    summary.tournamentsProcessed += 1

    // --- Fantasy projections -------------------------------------------------
    try {
      const response = await provider.listPlayerTournamentProjections(target.externalId)
      const rows = response.data ?? []
      summary.projectionsSeen += rows.length
      const resolved: ResolvedFantasyProjection[] = rows.map((raw) => {
        const projection = mapSportsDataProjection(raw)
        if (projection.available) summary.projectionsAvailable += 1
        else summary.projectionsScrambled += 1
        return {
          tournamentId: target.id,
          playerId: resolvePlayerId(projection.playerExternalId, projection.playerSlug),
          projection,
        }
      })
      const result = await repository.bulkUpsertProjections(resolved)
      summary.projectionsInserted += result.inserted
      summary.projectionsUpdated += result.updated
      summary.projectionsFailed += result.failed
    } catch (error) {
      note(`Projections fetch failed for ${target.externalId}: ${(error as Error).message}`)
    }

    // --- DFS salaries --------------------------------------------------------
    try {
      const response = await provider.listDfsSlatesByTournament(target.externalId)
      const slates = response.data ?? []
      const resolved: ResolvedDfsSalary[] = []
      for (const slate of slates) {
        for (const salary of mapSportsDataDfsSlate(slate)) {
          resolved.push({
            tournamentId: target.id,
            playerId: resolvePlayerId(salary.playerExternalId, salary.playerSlug),
            salary,
          })
        }
      }
      summary.salariesSeen += resolved.length
      const result = await repository.bulkUpsertSalaries(resolved)
      summary.salariesInserted += result.inserted
      summary.salariesUpdated += result.updated
      summary.salariesFailed += result.failed
    } catch (error) {
      note(`DFS fetch failed for ${target.externalId}: ${(error as Error).message}`)
    }
  }

  return summary
}

interface ImportTarget {
  /** CaddieIQ tournament id, or null when the provider id has no local match. */
  id: string | null
  /** Provider TournamentID. */
  externalId: string
}
