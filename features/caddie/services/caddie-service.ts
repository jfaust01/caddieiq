/**
 * AI Caddie — server data-access layer.
 *
 * Resolves the active tournament, loads the verified {@link CaddieDataBundle}
 * from the existing tournament service (each getter degrades to a safe empty
 * shape on failure so one missing engine never breaks the Caddie), and resolves
 * player-name fragments to real field members for the compare/explain intents.
 *
 * The service does the I/O; the deterministic engine (`lib/caddie`) does the
 * reasoning. Nothing here fabricates data — a missing engine yields `null`.
 */

import "server-only"

import { tournamentService } from "@/features/tournaments/services/tournament-service"
import type { TournamentSummary } from "@/features/tournaments/types"
import { analyticsService } from "@/lib/analytics/service"
import type { CaddieDataBundle } from "@/lib/caddie"
import { routeCaddie } from "@/lib/caddie"
import type { ResolvedPlayer } from "@/lib/caddie"

/** A tournament the Caddie can reason over, for the switcher. */
export interface CaddieTournamentOption {
  readonly id: string
  readonly name: string
  readonly status: TournamentSummary["status"]
  readonly course: string | null
}

const STATUS_PRIORITY: Record<TournamentSummary["status"], number> = {
  ACTIVE: 0,
  SCHEDULED: 1,
  COMPLETED: 2,
  CANCELED: 3,
}

/** Load a modest page of tournaments to pick from and offer in the switcher. */
async function loadTournamentOptions(): Promise<CaddieTournamentOption[]> {
  const { items } = await tournamentService.getTournaments({
    filters: { search: "", status: "ALL", tour: "ALL", season: "ALL" },
    page: 1,
    pageSize: 50,
  })
  return items.map((t) => ({ id: t.id, name: t.name, status: t.status, course: t.course }))
}

/**
 * Resolve the tournament the Caddie should reason over: prefer `ACTIVE`, then
 * the next `SCHEDULED`, then the most recent otherwise. Returns `null` only when
 * there are no tournaments at all.
 */
export async function resolveActiveTournament(): Promise<CaddieTournamentOption | null> {
  const options = await loadTournamentOptions()
  if (options.length === 0) return null

  const sorted = [...options].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status],
  )
  return sorted[0]
}

/** The switcher list plus the resolved default selection. */
export async function getCaddieTournamentContext(): Promise<{
  options: CaddieTournamentOption[]
  active: CaddieTournamentOption | null
}> {
  const options = await loadTournamentOptions()
  const active =
    [...options].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])[0] ?? null
  return { options, active }
}

/** Swallow a rejected getter into `null` so one missing engine never 500s. */
async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p
  } catch {
    return null
  }
}

/**
 * Load all verified engine output for one tournament in parallel. Any engine
 * that fails or holds no signal comes back `null`; answerers degrade honestly.
 */
export async function loadCaddieDataBundle(tournamentId: string): Promise<CaddieDataBundle | null> {
  const summary = await safe(tournamentService.getTournamentById(tournamentId))
  if (!summary) return null

  const [dfs, fit, skill, odds, weather] = await Promise.all([
    safe(tournamentService.getDfsValueField(tournamentId)),
    safe(tournamentService.getFieldFitBoard(tournamentId)),
    safe(tournamentService.getSkillLeaderboards(tournamentId)),
    safe(tournamentService.getOddsIntelligence(tournamentId)),
    safe(tournamentService.getWeatherIntelligence(tournamentId)),
  ])

  return {
    tournamentId,
    tournamentName: summary.name,
    courseName: summary.course,
    dfs,
    fit,
    skill,
    odds,
    weather,
  }
}

/** Normalize a name for loose matching (lowercase, strip punctuation/accents). */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

/**
 * Match the question's player-name fragments to real field members, then load
 * their analytics. Returns only confident matches (substring on either side),
 * so an unmatched guess yields fewer players and the engine degrades honestly.
 */
export async function resolvePlayersForQuestion(
  tournamentId: string,
  raw: string,
): Promise<ResolvedPlayer[]> {
  const route = routeCaddie(raw)
  const fragments = route.params.playerNames
  if (fragments.length === 0) return []

  const field = await safe(tournamentService.getTournamentField(tournamentId))
  if (!field || field.entrants.length === 0) return []

  const matchedEntrants: { playerId: string; displayName: string }[] = []
  const usedIds = new Set<string>()

  for (const fragment of fragments) {
    const frag = normalizeName(fragment)
    if (frag.length < 3) continue

    const match = field.entrants.find((e) => {
      if (usedIds.has(e.playerId)) return false
      const full = normalizeName(e.playerName)
      return full.includes(frag) || frag.includes(full)
    })
    if (match) {
      usedIds.add(match.playerId)
      matchedEntrants.push({ playerId: match.playerId, displayName: match.playerName })
    }
  }

  if (matchedEntrants.length === 0) return []

  const analytics = await analyticsService.getAnalyticsForPlayers(
    matchedEntrants.map((m) => m.playerId),
  )

  return matchedEntrants
    .map((m) => {
      const a = analytics.find((x) => x.playerId === m.playerId)
      if (!a) return null
      return { playerId: m.playerId, displayName: m.displayName, analytics: a }
    })
    .filter((p): p is ResolvedPlayer => p !== null)
}
