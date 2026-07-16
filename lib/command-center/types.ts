/**
 * Tournament Command Center — derived summary types (client-safe, no I/O).
 *
 * These types describe the *derived* summaries the Command Center presents on
 * top of the existing intelligence engines: a Morning Brief, an auto-generated
 * Tournament Story, Trending players, and explainable AI Coach picks.
 *
 * Every value here is a pure derivation over engine output that the service
 * layer already produced. Nothing is fabricated: when a source signal is
 * absent, the corresponding item is simply omitted and the surface degrades to
 * an honest empty state.
 */

import type { TournamentField, TournamentFieldReport } from "@/features/tournaments/types"
import type { WeatherIntelligence } from "@/lib/weather-intelligence"
import type { TournamentOddsView } from "@/lib/odds-intelligence"
import type { DfsValueField } from "@/lib/dfs-value"
import type { SkillLeaderboards } from "@/lib/player-skill-intelligence"
import type { FieldFitBoard } from "@/lib/analytics/course-fit"

/** The verified engine outputs every derivation reads from. */
export interface CommandCenterInputs {
  readonly field: TournamentField
  readonly fieldReport: TournamentFieldReport
  readonly weather: WeatherIntelligence
  readonly odds: TournamentOddsView
  readonly dfsField: DfsValueField
  readonly skillLeaderboards: SkillLeaderboards
  readonly fitBoard: FieldFitBoard
}

/** Which engine a derived line traces back to (drives the icon). */
export type BriefIcon = "weather" | "odds" | "dfs" | "field" | "trending" | "course" | "skill"

/** Sentiment of a brief line — never hype, just a factual lean. */
export type BriefTone = "positive" | "neutral" | "caution"

/** One verified headline in the Morning Brief. */
export interface BriefItem {
  readonly id: string
  readonly icon: BriefIcon
  readonly label: string
  readonly detail: string
  readonly tone: BriefTone
}

/** The Morning Brief: the few things worth knowing right now. */
export interface MorningBrief {
  readonly items: readonly BriefItem[]
  /** Human-readable list of engines that contributed, for the empty state. */
  readonly sources: readonly string[]
}

/** One section of the auto-generated Tournament Story. */
export interface StoryParagraph {
  readonly id: string
  readonly heading: string
  readonly body: string
}

/** The narrative overview, assembled only from present values. */
export interface TournamentStory {
  readonly paragraphs: readonly StoryParagraph[]
}

/** A single trending entrant with a verified, pre-formatted value. */
export interface TrendingPlayer {
  readonly playerId: string
  readonly displayName: string
  /** Pre-formatted, verified value (e.g. "A+ · 92", "28% win", "Elite fit"). */
  readonly value: string
  readonly detail: string
}

/** One trending category (top value, best edge, strongest fit, etc.). */
export interface TrendingCategory {
  readonly key: string
  readonly title: string
  readonly icon: BriefIcon
  /** The leader, or `null` when the underlying board holds no scored entrant. */
  readonly player: TrendingPlayer | null
}

/** The Trending widget's full set of categories. */
export interface Trending {
  readonly categories: readonly TrendingCategory[]
}

/** The buckets the AI Coach sorts recommendations into. */
export type CoachBucket = "cashPlays" | "tournamentPlays" | "contrarian" | "monitor"

/** One explainable coach pick — reason always traces to a source board. */
export interface CoachPick {
  readonly playerId: string
  readonly displayName: string
  readonly reason: string
  /** Confidence label echoed from the source engine, or `null`. */
  readonly confidence: string | null
}

/** A titled group of coach picks. */
export interface CoachRecommendationGroup {
  readonly key: CoachBucket
  readonly title: string
  readonly description: string
  readonly picks: readonly CoachPick[]
}

/** The AI Coach's full recommendation set. */
export interface CoachRecommendations {
  readonly groups: readonly CoachRecommendationGroup[]
}
