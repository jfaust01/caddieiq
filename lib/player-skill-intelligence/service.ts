/**
 * Player Skill Intelligence service (server-only).
 *
 * The read side of the fifth Signal Family: it pulls VERIFIED round-statistic
 * samples from the repository, builds a normalization population, and runs the
 * pure engine to produce player profiles and tournament leaderboards. It never
 * fabricates — when the source table is empty (e.g. strokes-gained is not
 * entitled on the current provider tier) it returns an honest `unavailable`
 * profile / empty leaderboards, exactly like the Weather and Odds services do.
 */

import "server-only"

import {
  getPlayerSkillRepository,
  type PlayerSkillRepository,
} from "@/lib/repositories"
import {
  buildPlayerSkillProfile,
  buildSkillLeaderboards,
  toCourseFitSkillProfile,
  unavailableSkillProfile,
  type PlayerSkillProfile,
  type RankedPlayerSkill,
  type SkillLeaderboards,
} from "@/lib/player-skill-intelligence"
import type { FitSkillKey } from "@/lib/analytics/course-fit/types"

/** A named entrant, the input for a tournament field's leaderboards. */
export interface SkillFieldEntrant {
  playerId: string
  playerName: string
}

export class PlayerSkillIntelligenceService {
  constructor(
    private readonly repository: PlayerSkillRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  static create(): PlayerSkillIntelligenceService {
    return new PlayerSkillIntelligenceService(getPlayerSkillRepository())
  }

  /**
   * A single player's skill profile, normalized against the platform population
   * for the same skills. Returns an honest `unavailable` profile (not an error)
   * when the player has no round statistics.
   */
  async getPlayerProfile(playerId: string): Promise<PlayerSkillProfile> {
    const samples = await this.repository.findSamplesByPlayerId(playerId)
    if (samples.rounds.length === 0) {
      return unavailableSkillProfile(
        playerId,
        [{ code: "no-round-statistics", detail: "No round statistics held for this player." }],
        "No verified round statistics have been captured for this player yet, so skill ratings are unavailable.",
        samples.season,
      )
    }

    // Normalize against everyone we hold samples for (the platform population),
    // so a player's percentile is field-relative and meaningful.
    const population = await this.loadPlatformPopulation()
    return buildPlayerSkillProfile({
      playerId,
      season: samples.season,
      samples,
      population,
      now: this.now(),
    })
  }

  /**
   * The player's skill profile projected to the compact Course Fit skill shape
   * (`Record<FitSkillKey, number | null>`). This is the canonical bridge the
   * Course Fit model consumes so it no longer needs its own skill logic.
   */
  async getCourseFitSkillProfile(playerId: string): Promise<Record<FitSkillKey, number | null>> {
    const profile = await this.getPlayerProfile(playerId)
    return toCourseFitSkillProfile(profile)
  }

  /**
   * Batch variant of {@link getCourseFitSkillProfile}: the Course-Fit-shaped
   * skill profile for many players in one pass (a tournament field), keyed by
   * playerId. Normalized against the same platform population as the profiles
   * and leaderboards, so the Course Fit board and the hub's skill lists agree.
   * Players with no samples map to an all-`null` profile.
   */
  async getCourseFitSkillProfilesForPlayers(
    playerIds: readonly string[],
  ): Promise<Map<string, Record<FitSkillKey, number | null>>> {
    const out = new Map<string, Record<FitSkillKey, number | null>>()
    if (playerIds.length === 0) return out

    const [samplesByPlayer, population] = await Promise.all([
      this.repository.findSamplesByPlayerIds(playerIds),
      this.loadPlatformPopulation(),
    ])
    const now = this.now()

    for (const playerId of playerIds) {
      const samples = samplesByPlayer.get(playerId)
      const profile =
        samples && samples.rounds.length > 0
          ? buildPlayerSkillProfile({
              playerId,
              season: samples.season,
              samples,
              population,
              now,
            })
          : unavailableSkillProfile(playerId, [{ code: "no-round-statistics" }], "No round statistics held.", null)
      out.set(playerId, toCourseFitSkillProfile(profile))
    }
    return out
  }

  /**
   * Skill leaderboards for a tournament field. Normalizes the field's entrants
   * against the platform population, then ranks them. Boards stay empty rather
   * than padded when no entrant has data for a skill.
   */
  async getFieldLeaderboards(
    entrants: readonly SkillFieldEntrant[],
    season: number | null,
  ): Promise<SkillLeaderboards> {
    if (entrants.length === 0) {
      return { season, ratedPlayers: 0, totalPlayers: 0, boards: buildSkillLeaderboards([], season).boards }
    }

    const playerIds = entrants.map((e) => e.playerId)
    const [samplesByPlayer, population] = await Promise.all([
      this.repository.findSamplesByPlayerIds(playerIds),
      this.loadPlatformPopulation(),
    ])
    const now = this.now()

    const ranked: RankedPlayerSkill[] = entrants.map((entrant) => {
      const samples = samplesByPlayer.get(entrant.playerId)
      const profile =
        samples && samples.rounds.length > 0
          ? buildPlayerSkillProfile({
              playerId: entrant.playerId,
              season: samples.season ?? season,
              samples,
              population,
              now,
            })
          : unavailableSkillProfile(
              entrant.playerId,
              [{ code: "no-round-statistics" }],
              "No round statistics held for this player.",
              season,
            )
      return { playerId: entrant.playerId, playerName: entrant.playerName, profile }
    })

    return buildSkillLeaderboards(ranked, season)
  }

  /**
   * The platform-wide normalization population, built in a single repository
   * pass. Percentiles are stable across pages because every profile is ranked
   * against the same distribution. Empty ⇒ everything Unknown.
   */
  private loadPlatformPopulation() {
    return this.repository.loadPlatformPopulation()
  }
}

/** Convenience for server components / feature services. */
export function getPlayerSkillIntelligenceService(): PlayerSkillIntelligenceService {
  return PlayerSkillIntelligenceService.create()
}
