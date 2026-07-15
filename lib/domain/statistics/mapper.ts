/**
 * SportsDataIO → CaddieIQ player season-statistics mapper.
 *
 * The isolation boundary for season-statistics data: the only place in the
 * domain layer allowed to reference the SportsDataIO season-stats wire type, via
 * `import type`. Field translation only — no validation, no persistence, and no
 * relationship resolution (reconciling `playerSlug` to an internal id happens in
 * the statistics importer).
 *
 * The mapper copies across only the metrics the provider actually supplies and
 * leaves everything else `null`; it never fabricates an unavailable statistic.
 */

import type { SdioPlayerSeasonStats } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, slugify } from "../shared/utils"
import { UNKNOWN_STAT_PLAYER_NAME } from "./constants"
import type { PlayerSeasonStat } from "./types"

/** Coerce a loose value to an integer, or null. */
function cleanInteger(value: unknown): number | null {
  const n = cleanNumber(value)
  return n == null ? null : Math.trunc(n)
}

/**
 * Coerce a world-ranking value to a positive integer, or null.
 *
 * A valid Official World Golf Ranking position starts at 1, so `0` (and any
 * non-positive value) is never real. On the trial tier the ranking field is a
 * known scramble target — it returns `0` for the actual #1 and ties multiple
 * players at `1` (see docs/DATA_CATALOG.md §7). Mapping non-positive ranks to
 * null keeps a scrambled `0` from being persisted/surfaced as a fake rank; the
 * repository additionally refuses to overwrite a real stored rank with null.
 */
function cleanRanking(value: unknown): number | null {
  const n = cleanInteger(value)
  return n != null && n > 0 ? n : null
}

/**
 * Translate a raw SportsDataIO season-stats row into a CaddieIQ
 * {@link PlayerSeasonStat}.
 *
 * @param raw - The provider's un-normalized season-stats row.
 * @param fallbackSeason - Season to use when the row omits `Season` (the
 *   importer always knows the season it requested).
 */
export function mapSportsDataSeasonStat(
  raw: SdioPlayerSeasonStats,
  fallbackSeason: number,
): PlayerSeasonStat {
  const playerName = cleanString(raw.Name) ?? UNKNOWN_STAT_PLAYER_NAME
  const season = cleanInteger(raw.Season) ?? fallbackSeason

  return {
    playerName,
    playerSlug: slugify(playerName),
    season,
    worldRanking: cleanRanking(raw.WorldGolfRank),
    worldRankingLastWeek: cleanRanking(raw.WorldGolfRankLastWeek),
    events: cleanInteger(raw.Events),
    averagePoints: cleanNumber(raw.AveragePoints),
    totalPoints: cleanNumber(raw.TotalPoints),
    pointsGained: cleanNumber(raw.PointsGained),
    pointsLost: cleanNumber(raw.PointsLost),
    externalRef: {
      source: "sportsdataio",
      externalId: String(raw.PlayerID),
    },
  }
}
