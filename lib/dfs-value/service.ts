/**
 * DFS Value service (server-only).
 *
 * The composition root of the flagship model. It resolves a tournament's field
 * and, for that field, gathers every Signal Family through its own canonical
 * service — Player Skill, Course Fit, Form & Production (Analytics), Market
 * (Odds), and Weather — plus the real DraftKings salary, maps each into the pure
 * model's 0–100 signal shape, and runs {@link buildDfsValueField}. It performs
 * no fabrication: a family that has no verified data for a player contributes a
 * `null` signal (which the model treats as "unknown", never a neutral guess),
 * and the whole result is confidence-capped by the tournament-context ceiling.
 *
 * Every input engine is consumed through its existing server — there is no
 * parallel data path — so the DFS Value a player shows here is built from the
 * exact same Course Fit / skill / market / form / weather reads rendered on the
 * rest of the platform. See docs/DFS_VALUE_MODEL.md.
 */

import "server-only"

import { cache } from "react"

import { analyticsService } from "@/lib/analytics/service"
import type { PlayerAnalytics } from "@/lib/analytics/types"
import { computeCourseFit } from "@/lib/analytics/course-fit"
import type { CourseFitResult } from "@/lib/analytics/course-fit/types"
import { courseService } from "@/features/courses/services/course-service"
import { getOddsIntelligenceService } from "@/lib/odds-intelligence/service"
import { getPlayerSkillIntelligenceService } from "@/lib/player-skill-intelligence/service"
import type { PlayerSkillProfile } from "@/lib/player-skill-intelligence"
import { getWeatherIntelligenceService } from "@/lib/weather-intelligence/service"
import type { WeatherIntelligence } from "@/lib/weather-intelligence"
import { getFantasyRepository } from "@/lib/repositories"
import { getFieldRepository } from "@/lib/repositories/field-repository"
import { tournamentContextService } from "@/lib/tournament-context/service"
import type { TournamentContext } from "@/lib/tournament-context/types"

import {
  buildDfsValueField,
  type DfsConfidence,
  type DfsContextCeiling,
  type DfsPlayerInput,
  type DfsSignalInput,
  type DfsValueField,
  type DfsValueResult,
} from "."

/** A named field entrant — the minimal roster the model needs. */
export interface DfsFieldEntrant {
  playerId: string
  playerName: string
}

/** An unknown signal: no data, so the model omits it (never a neutral 50). */
const UNKNOWN_SIGNAL: DfsSignalInput = { score: null, confidence: "none", rating: null }

export class DfsValueService {
  constructor(private readonly now: () => Date = () => new Date()) {}

  static create(): DfsValueService {
    return new DfsValueService()
  }

  /**
   * The full DFS Value board for a tournament field. Resolves context, gathers
   * every family for the field in parallel batches, maps them into signals, and
   * runs the pure model. Returns an all-`unavailable` board (never fabricated)
   * when the field is empty or context is unresolved.
   */
  async getFieldValue(
    tournamentId: string,
    entrants: readonly DfsFieldEntrant[],
  ): Promise<DfsValueField> {
    const context = await tournamentContextService.getTournamentContext(tournamentId)
    const ceiling = contextCeiling(context)

    if (entrants.length === 0) {
      return buildDfsValueField({ players: [], ceiling })
    }

    const playerIds = entrants.map((e) => e.playerId)
    const courseId = context.status === "available" ? (context.course?.id ?? null) : null

    const skillService = getPlayerSkillIntelligenceService()

    // Every family in parallel; each read is its own canonical, cached service.
    const [skillByPlayer, fitSkillByPlayer, salaryByPlayer, analytics, odds, weather, courseProfile] =
      await Promise.all([
        skillService.getProfilesForPlayers(playerIds, null),
        // The Course-Fit-shaped skill projection — the SAME canonical bridge the
        // Course Fit surface consumes, so the DFS Course Fit signal matches it.
        skillService.getCourseFitSkillProfilesForPlayers(playerIds),
        getFantasyRepository().findSalariesByTournamentId(tournamentId),
        analyticsService.getAnalyticsForPlayers(playerIds),
        getOddsIntelligenceService().getTournamentOddsView(tournamentId),
        getWeatherIntelligenceService().getForTournament(tournamentId),
        courseId ? courseService.getCourseIntelligence(courseId) : Promise.resolve(null),
      ])

    const analyticsByPlayer = new Map(analytics.map((a) => [a.playerId, a] as const))
    const oddsRankByPlayer = buildOddsRankIndex(odds)
    const weatherSignal = weatherToSignal(weather)

    const players: DfsPlayerInput[] = entrants.map((entrant) => {
      const skill = skillByPlayer.get(entrant.playerId) ?? null
      const analyticsProfile = analyticsByPlayer.get(entrant.playerId) ?? null
      const fitSkills = fitSkillByPlayer.get(entrant.playerId) ?? null
      // Course Fit uses the canonical Course-Fit-shaped skill projection against
      // the host course profile, so the DFS Course Fit signal equals the Course
      // Fit surface's score exactly — no parallel fit logic here.
      const courseFit =
        fitSkills && courseProfile
          ? computeCourseFit({
              playerId: entrant.playerId,
              courseProfile,
              skills: fitSkills,
            })
          : null

      return {
        playerId: entrant.playerId,
        displayName: entrant.playerName,
        salary: salaryByPlayer.get(entrant.playerId)?.salary ?? null,
        playerSkill: skillToSignal(skill),
        courseFit: courseFitToSignal(courseFit),
        form: analyticsToSignal(analyticsProfile),
        market: oddsToSignal(oddsRankByPlayer.get(entrant.playerId) ?? null),
        weather: weatherSignal,
      }
    })

    return buildDfsValueField({ players, ceiling })
  }

  /**
   * A single player's DFS Value, evaluated within their next upcoming event's
   * field (value is inherently field-relative, so it is only meaningful against
   * a real field). Returns null when the player is in no upcoming field.
   */
  async getPlayerValue(playerId: string): Promise<PlayerDfsValue | null> {
    const context = await tournamentContextService.getPlayerActiveContext(playerId)
    if (context.status !== "available") return null

    const entrants = await this.resolveFieldEntrants(context.tournament.id)
    if (entrants.length === 0) return null

    const field = await this.getFieldValue(context.tournament.id, entrants)
    const result = field.players.find((p) => p.playerId === playerId)
    if (!result) return null

    return {
      tournamentId: context.tournament.id,
      tournamentName: context.tournament.name,
      courseName: context.course?.name ?? null,
      ceiling: field.ceiling,
      fieldSize: field.totalPlayers,
      ratedPlayers: field.ratedPlayers,
      result,
    }
  }

  /** Resolve a tournament's confirmed field as model entrants. */
  private async resolveFieldEntrants(tournamentId: string): Promise<DfsFieldEntrant[]> {
    const rows = await getFieldRepository().listByTournament(tournamentId)
    return rows.map((row) => ({ playerId: row.playerId, playerName: row.playerName }))
  }
}

/** A player's DFS Value in the context of their upcoming event. */
export interface PlayerDfsValue {
  tournamentId: string
  tournamentName: string
  courseName: string | null
  ceiling: DfsContextCeiling
  fieldSize: number
  ratedPlayers: number
  result: DfsValueResult
}

/* ------------------------------------------------------------------ */
/* Signal mappers — engine output → DFS 0–100 signal                  */
/* ------------------------------------------------------------------ */

/** The context ceiling: how much verified context backs the whole board. */
function contextCeiling(context: TournamentContext): DfsContextCeiling {
  if (context.status !== "available") return "unavailable"
  // A resolved host course is full context (Course Fit + weather can ground the
  // score); a tournament with no linked course is partial — value still ranks on
  // skill/form/market/salary, but the ceiling caps confidence at `medium`.
  return context.course ? "verified" : "partial"
}

/**
 * Player Skill → signal. The profile exposes per-skill 0–100 ratings (no single
 * composite), so the skill strength is the mean of the player's RATED skills —
 * the same values the skill surface ranks. Unknown skills are excluded rather
 * than counted as zero, so a thin profile is low-confidence, not low-scored.
 */
function skillToSignal(profile: PlayerSkillProfile | null): DfsSignalInput {
  if (!profile || profile.status !== "available") return UNKNOWN_SIGNAL
  const rated = profile.skills.map((s) => s.value).filter((v): v is number => v != null)
  if (rated.length === 0) return UNKNOWN_SIGNAL
  const score = Math.round(rated.reduce((sum, v) => sum + v, 0) / rated.length)
  return { score, confidence: skillConfidence(profile.confidence), rating: bandLabel(score) }
}

/** Course Fit → signal: the 0–100 fit score + its own confidence. */
function courseFitToSignal(fit: CourseFitResult | null): DfsSignalInput {
  if (!fit || fit.score == null) return UNKNOWN_SIGNAL
  return { score: fit.score, confidence: fitConfidence(fit.confidence), rating: fit.band ?? null }
}

/** Form & Production → signal: the Analytics overall rating (season+form). */
function analyticsToSignal(analytics: PlayerAnalytics | null): DfsSignalInput {
  if (!analytics || analytics.isEmpty || analytics.overallRating == null) return UNKNOWN_SIGNAL
  return {
    score: analytics.overallRating,
    confidence: analyticsConfidence(analytics),
    rating: analytics.overallBand ?? null,
  }
}

/** Market → signal: invert field rank into a 0–100 (shorter price ⇒ stronger). */
function oddsToSignal(rank: OddsRank | null): DfsSignalInput {
  if (!rank || rank.fieldSize <= 1) return UNKNOWN_SIGNAL
  // Rank 1 (favourite) ⇒ ~100; last ⇒ ~0. Linear over the field.
  const score = Math.round(100 * (1 - (rank.rank - 1) / (rank.fieldSize - 1)))
  return {
    score,
    confidence: rank.confidence === "verified" ? "high" : rank.confidence === "partial" ? "medium" : "low",
    rating: null,
  }
}

/**
 * Weather → signal: identical across the field, a small shared context nudge.
 * The profile carries a playability BAND (not a 0–100), so map the band to a
 * representative score. Weather confidence is capped at `medium` because it is a
 * forecast, and it never carries the strongest weight in the composite.
 */
function weatherToSignal(weather: WeatherIntelligence): DfsSignalInput {
  const playability = weather.family.playability
  if (weather.status !== "available" || weather.confidence === "unavailable" || playability == null) {
    return UNKNOWN_SIGNAL
  }
  const score = PLAYABILITY_SCORE[playability]
  return {
    score,
    confidence: weather.confidence === "high" ? "medium" : "low",
    rating: playabilityLabel(playability),
  }
}

/** Representative 0–100 for each playability band. */
const PLAYABILITY_SCORE: Record<NonNullable<WeatherIntelligence["family"]["playability"]>, number> = {
  excellent: 88,
  good: 70,
  marginal: 45,
  poor: 22,
}

function playabilityLabel(p: NonNullable<WeatherIntelligence["family"]["playability"]>): string {
  return p.charAt(0).toUpperCase() + p.slice(1)
}

/** A compact band label for a 0–100 skill mean (UI/AI-facing rating text). */
function bandLabel(score: number): string {
  if (score >= 80) return "Elite"
  if (score >= 65) return "Strong"
  if (score >= 50) return "Solid"
  if (score >= 35) return "Average"
  return "Developing"
}

/* ------------------------------------------------------------------ */
/* Confidence adapters                                                */
/* ------------------------------------------------------------------ */

function skillConfidence(c: PlayerSkillProfile["confidence"]): DfsConfidence {
  return c === "high" ? "high" : c === "medium" ? "medium" : c === "low" ? "low" : "none"
}

function fitConfidence(c: CourseFitResult["confidence"]): DfsConfidence {
  return c === "high" ? "high" : c === "medium" ? "medium" : c === "low" ? "low" : "none"
}

function analyticsConfidence(a: PlayerAnalytics): DfsConfidence {
  // Use the strongest confidence among the composite's own scores.
  let best = 0
  const rank: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 }
  for (const s of a.scores) {
    if (s.independent) continue
    best = Math.max(best, rank[s.confidence] ?? 0)
  }
  return (["none", "low", "medium", "high"] as const)[best]
}

/* ------------------------------------------------------------------ */
/* Odds field-rank index                                              */
/* ------------------------------------------------------------------ */

interface OddsRank {
  rank: number
  fieldSize: number
  confidence: "verified" | "partial" | "unavailable"
}

/**
 * Build a playerId → field-rank index from the tournament winner market. Rank is
 * the player's position in the de-vigged consensus (1 = shortest price). Players
 * absent from the book are simply not in the map (⇒ unknown market signal).
 */
function buildOddsRankIndex(
  odds: Awaited<ReturnType<ReturnType<typeof getOddsIntelligenceService>["getTournamentOddsView"]>>,
): Map<string, OddsRank> {
  const out = new Map<string, OddsRank>()
  const winner = odds.markets.find((m) => m.market === "TOURNAMENT_WINNER")
  if (!winner) return out
  const fieldSize = winner.selections.length
  winner.selections.forEach((selection, index) => {
    if (!selection.playerId) return
    out.set(selection.playerId, { rank: index + 1, fieldSize, confidence: odds.confidence })
  })
  return out
}

const getDfsValueServiceCached = cache((): DfsValueService => DfsValueService.create())

/** Convenience for server components / feature services. */
export function getDfsValueService(): DfsValueService {
  return getDfsValueServiceCached()
}
