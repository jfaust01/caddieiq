/**
 * AnalyticsService — the single entry point to the Analytics Engine.
 *
 * This is the server-only orchestration layer that every feature consumes for
 * derived intelligence. It reads the raw population through
 * {@link AnalyticsRepository}, runs the pure {@link computePlayerAnalytics}
 * calculator, and returns the shared analytics shapes. By funnelling every
 * surface (player pages today; rankings, DFS, betting, and the AI coach later)
 * through this one service, analytics stay the platform's single source of
 * truth — no feature recomputes them from raw statistics.
 *
 * The `server-only` import guarantees this module can never be pulled into a
 * client bundle; the UI reaches it through server actions. Reads are wrapped in
 * React `cache` so resolving analytics multiple times in one request (e.g. a
 * field summary and a player profile) hits the database at most once.
 */

import "server-only"

import { cache } from "react"

import {
  buildPopulation,
  computePlayerAnalytics,
  meanOfScores,
  METRIC_ORDER,
  toBand,
  type PopulationContext,
  type SeasonStatSample,
} from "./calculator"
import { getAnalyticsRepository } from "./repository"
import type {
  AnalyticsMetricKey,
  FieldAnalyticsMetric,
  FieldAnalyticsSummary,
  PlayerAnalytics,
} from "./types"

/** Metrics surfaced in the compact tournament-field summary, in display order. */
const FIELD_SUMMARY_METRICS: readonly AnalyticsMetricKey[] = [
  "seasonPerformance",
  "recentForm",
  "consistency",
  "fantasyProduction",
]

const METRIC_LABELS: Record<AnalyticsMetricKey, string> = {
  recentForm: "Recent Form",
  consistency: "Consistency",
  activity: "Activity",
  fantasyProduction: "Fantasy Rating",
  seasonPerformance: "Season Performance",
}

/**
 * Load the season population once per request and index it for O(1) lookup by
 * player id alongside the reusable distribution context. Cached so a page that
 * resolves both a field summary and player profiles shares a single load.
 */
const loadContext = cache(
  async (): Promise<{
    pop: PopulationContext
    byPlayer: Map<string, SeasonStatSample>
  }> => {
    const { season, samples } = await getAnalyticsRepository().loadLatestPopulation()
    const pop = buildPopulation(samples, season)
    const byPlayer = new Map(samples.map((sample) => [sample.playerId, sample]))
    return { pop, byPlayer }
  },
)

export const analyticsService = {
  /**
   * Full analytics profile for one player, normalized against the current
   * season's field. Returns an empty (but stable) profile when the player has
   * no statistics in that season, so the UI can render an honest "not enough
   * data" state rather than fabricated scores.
   */
  async getPlayerAnalytics(playerId: string): Promise<PlayerAnalytics> {
    const { pop, byPlayer } = await loadContext()
    const sample = byPlayer.get(playerId) ?? null
    const analytics = computePlayerAnalytics(sample, pop)
    // `computePlayerAnalytics` leaves `playerId` blank for an absent sample;
    // stamp the requested id so callers always get the right identity back.
    return { ...analytics, playerId }
  },

  /**
   * Analytics for many players at once (e.g. a tournament field), sharing a
   * single population load. Preserves input order.
   */
  async getAnalyticsForPlayers(playerIds: readonly string[]): Promise<PlayerAnalytics[]> {
    const { pop, byPlayer } = await loadContext()
    return playerIds.map((playerId) => {
      const sample = byPlayer.get(playerId) ?? null
      return { ...computePlayerAnalytics(sample, pop), playerId }
    })
  },

  /**
   * Compact, field-level analytics summary for the tournament hub: the average
   * strength, form, and reliability of the assembled field. Built by averaging
   * the SAME per-player analytics every other surface consumes — never a
   * parallel calculation.
   */
  async getFieldAnalyticsSummary(tournamentId: string): Promise<FieldAnalyticsSummary> {
    const repository = getAnalyticsRepository()
    const { pop, byPlayer } = await loadContext()
    const playerIds = await repository.getFieldPlayerIds(tournamentId)

    const profiles = playerIds.map((playerId) => {
      const sample = byPlayer.get(playerId) ?? null
      return computePlayerAnalytics(sample, pop)
    })

    const rated = profiles.filter((profile) => !profile.isEmpty)
    const averageRating = meanOfScores(rated.map((profile) => profile.overallRating))

    const metrics: FieldAnalyticsMetric[] = FIELD_SUMMARY_METRICS.map((key) => {
      const orderIndex = METRIC_ORDER.indexOf(key)
      const values = profiles
        .map((profile) => profile.scores[orderIndex]?.value ?? null)
        .filter((value): value is number => value !== null)
      const average = meanOfScores(values)
      return {
        key,
        label: METRIC_LABELS[key],
        value: average,
        band: average === null ? null : toBand(average),
        sampleSize: values.length,
      }
    })

    return {
      season: pop.season,
      totalPlayers: playerIds.length,
      ratedPlayers: rated.length,
      averageRating,
      averageBand: averageRating === null ? null : toBand(averageRating),
      metrics,
    }
  },
}
