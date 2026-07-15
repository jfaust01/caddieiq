/**
 * Player season-statistics domain model.
 *
 * A `PlayerSeasonStat` is the CaddieIQ representation of one player's aggregate
 * performance for a single season — the season-scoped companion to the player
 * record, independent of any provider. It mirrors the persistence model
 * (`PlayerSeasonStatistic`) so a repository can map it 1:1, but imports nothing
 * from Prisma or a provider.
 *
 * Like the other domain models it carries NO internal ids: it emits the
 * reconciliation key `playerSlug` (a deterministic slug of the player's name)
 * plus provenance (`externalRef`). Resolving that key to a real `Player.id` is
 * a persistence concern handled by the statistics importer, so a stat row links
 * only to a player that already exists.
 *
 * Coverage: every metric field is nullable and means "not reported by the
 * source". At the current SportsDataIO tier only world ranking, events played,
 * and fantasy-points aggregates are provided; money, FedEx points, wins,
 * scoring average, and strokes-gained are absent and therefore never appear
 * here. The mapper never invents an unavailable metric.
 */

import type { HasExternalReference } from "../shared/types"

/**
 * One player's statistics for one season.
 *
 * Nullable fields represent "not supplied by the source". `playerSlug` is the
 * reconciliation key against `Player.slug`; `season` completes the natural key
 * `(playerSlug, season)` used to keep re-imports idempotent.
 */
export interface PlayerSeasonStat extends HasExternalReference {
  /** Display name as reported by the source (for logs/diagnostics). */
  playerName: string
  /** Deterministic slug of the player name — reconciled to `Player.slug`. */
  playerSlug: string
  /** Season year (e.g. 2025). */
  season: number
  /**
   * Official World Golf Ranking position; `null` when unreported. Stored
   * verbatim — the current tier obfuscates its precision (ties), so treat it as
   * indicative rather than authoritative.
   */
  worldRanking: number | null
  /** World ranking from the previous week (movement context). */
  worldRankingLastWeek: number | null
  /** Events played in the season. */
  events: number | null
  /** Average fantasy points per event. */
  averagePoints: number | null
  /** Total fantasy points across the season. */
  totalPoints: number | null
  /** Fantasy points gained (positive contributions). */
  pointsGained: number | null
  /** Fantasy points lost (negative contributions). */
  pointsLost: number | null
}
