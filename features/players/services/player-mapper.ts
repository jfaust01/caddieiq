/**
 * Maps live database records (Prisma) into the provider-agnostic Player domain
 * shapes the feature UI renders against.
 *
 * These are pure functions — safe to unit-test and to call from any server
 * context. Fields that have no live source yet (recent form, statistics,
 * career history, etc.) map to empty/null so the UI degrades gracefully rather
 * than fabricating values. This is the single seam between the persistence
 * schema and the UI contract.
 */

import type {
  Handedness,
  Player,
  PlayerDetail,
  PlayerRanking,
  PlayerSeasonStat,
  PlayerStatus,
  Nationality,
  RankingSystem,
  Tour,
} from "@/features/players/types"
import type { PlayerWithRelations } from "@/lib/repositories/player-repository"

/** Map the database `TourType` to the UI `Tour` union (unknown tours → null). */
function mapTour(type: string | undefined | null): Tour | null {
  switch (type) {
    case "PGA":
    case "DP_WORLD":
    case "LIV":
    case "KORN_FERRY":
      return type
    default:
      // e.g. LPGA has no directory equivalent yet.
      return null
  }
}

/** Map the database `Handedness` enum to the UI union (`UNKNOWN` → null). */
function mapHandedness(value: string): Handedness | null {
  return value === "RIGHT" || value === "LEFT" ? value : null
}

/** Map the database `PlayerStatus` enum to the UI union (`RETIRED` → inactive). */
function mapStatus(value: string): PlayerStatus {
  switch (value) {
    case "ACTIVE":
    case "INJURED":
    case "INACTIVE":
      return value
    case "RETIRED":
      return "INACTIVE"
    default:
      return "INACTIVE"
  }
}

/** Resolve a nationality relation into the UI descriptor, or null. */
function mapNationality(
  nationality: PlayerWithRelations["nationality"],
  countryCode: string | null,
): Nationality | null {
  if (nationality) {
    return { code: nationality.iso3, name: nationality.name }
  }
  // Fall back to the denormalized country code when there is no linked record.
  if (countryCode) {
    return { code: countryCode, name: countryCode }
  }
  return null
}

/** Whole-year age from a birth date, or null when unknown. */
function computeAge(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDelta = now.getMonth() - birthDate.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return age >= 0 && age < 130 ? age : null
}

/** The player's active tour, taken from the most recent active membership. */
function resolveTour(record: PlayerWithRelations): Tour | null {
  const active = record.tourHistory[0]
  return active ? mapTour(active.tour.type) : null
}

/** Map a database player row (+ relations) into the directory/card `Player`. */
export function mapPlayer(record: PlayerWithRelations): Player {
  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    fullName: record.fullName,
    nationality: mapNationality(record.nationality, record.countryCode),
    tour: resolveTour(record),
    worldRanking: owgrFromSeasonStats(record)?.rank ?? null,
    handedness: mapHandedness(record.handedness),
    status: mapStatus(record.status),
    age: computeAge(record.birthDate),
    turnedPro: record.turnedProYear,
    headshotUrl: record.headshotUrl,
    // No round-level source yet; the UI shows "No recent results".
    recentForm: [],
  }
}

const RANKING_LABELS: Record<RankingSystem, string> = {
  OWGR: "Official World Golf Ranking",
  DATAGOLF: "DataGolf Rank",
  CADDIEIQ: "CaddieIQ Composite",
  MODEL: "Your Model Rank",
}

/**
 * OWGR standing from season statistics — the authoritative source for a
 * player's Official World Golf Ranking (the vestigial `player_rankings` table
 * was removed in the 2026-07 data-integrity audit). Both the rank and last
 * week's rank are real provider data; movement is derived, never fabricated.
 * A LOWER ranking number is better, so `previous - current` is the improvement.
 */
function owgrFromSeasonStats(
  record: PlayerWithRelations,
): { rank: number; movement: PlayerRanking["movement"]; delta: number } | null {
  const season = record.seasonStatistics.find((s) => s.worldRanking !== null)
  if (!season || season.worldRanking === null) return null
  const last = season.worldRankingLastWeek
  const delta = last === null ? 0 : last - season.worldRanking
  const movement: PlayerRanking["movement"] =
    delta === 0 ? "flat" : delta > 0 ? "up" : "down"
  return { rank: season.worldRanking, movement, delta: Math.abs(delta) }
}

/**
 * Build the rankings panel. OWGR is the one system with a live provider source
 * (the newest season's `worldRanking`); its rank and movement are real or null,
 * never fabricated. DataGolf and the CaddieIQ composite have no import feeding
 * this persisted panel — CaddieIQ is derived on demand by the Ranking Engine
 * (`lib/rankings`) rather than stored here — so both are represented with a null
 * rank until ingested, and the user's own model rank stays flagged coming soon.
 */
function buildRankings(record: PlayerWithRelations): PlayerRanking[] {
  const owgr = owgrFromSeasonStats(record)
  return [
    {
      system: "OWGR",
      label: RANKING_LABELS.OWGR,
      rank: owgr?.rank ?? null,
      movement: owgr?.movement ?? "flat",
      delta: owgr?.delta ?? 0,
    },
    {
      system: "DATAGOLF",
      label: RANKING_LABELS.DATAGOLF,
      rank: null,
      movement: "flat",
      delta: 0,
    },
    {
      system: "CADDIEIQ",
      label: RANKING_LABELS.CADDIEIQ,
      rank: null,
      movement: "flat",
      delta: 0,
    },
    {
      system: "MODEL",
      label: RANKING_LABELS.MODEL,
      rank: null,
      movement: "flat",
      delta: 0,
      comingSoon: true,
    },
  ]
}

/**
 * Map live season-statistics rows (newest season first from the repository)
 * into the UI shape. Every provider-supplied field is nullable and passed
 * through verbatim — the mapper never fabricates the metrics the source omits.
 */
function buildSeasonStatistics(record: PlayerWithRelations): PlayerSeasonStat[] {
  return record.seasonStatistics.map((row) => ({
    season: row.season,
    worldRanking: row.worldRanking,
    worldRankingLastWeek: row.worldRankingLastWeek,
    events: row.events,
    averagePoints: row.averagePoints,
    totalPoints: row.totalPoints,
    pointsGained: row.pointsGained,
    pointsLost: row.pointsLost,
  }))
}

/**
 * Map a database player row (+ relations) into the persisted detail payload.
 *
 * `seasonStatistics` is populated live from the season-stats import. The
 * remaining sections without a live source (career summary, the legacy
 * strokes-gained `statistics` grid, course & tournament history, activity)
 * resolve to null/empty so the detail view renders its "not available yet"
 * states instead of placeholder numbers.
 *
 * Note: `analytics`, `rankingProfile`, `news`, and `upcoming` are intentionally
 * NOT produced here — analytics/ranking are derived by their engines, news comes
 * from a separate repository, and `upcoming` is resolved by the Tournament
 * Context Engine (which also carries Course Fit). All are composed onto the
 * payload in the (async) service layer, keeping this mapper pure and free of
 * cross-source computation.
 */
export function mapPlayerDetail(
  record: PlayerWithRelations,
): Omit<PlayerDetail, "analytics" | "rankingProfile" | "news" | "upcoming"> {
  return {
    ...mapPlayer(record),
    careerSummary: null,
    rankings: buildRankings(record),
    statistics: [],
    seasonStatistics: buildSeasonStatistics(record),
    courseHistory: [],
    tournamentHistory: [],
    activity: [],
  }
}
