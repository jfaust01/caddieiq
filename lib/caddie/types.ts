/**
 * AI Caddie — deterministic conversational engine domain types.
 *
 * AI Caddie answers natural-language golf questions by routing them to
 * CaddieIQ's existing verified intelligence engines (DFS Value, Course Fit,
 * Player Skill, Odds, Weather, Comparison, Explainability) and composing a
 * grounded, cited answer. It is NOT a generative model: every answer is derived
 * deterministically from engine output and names its source, or honestly states
 * the data is unavailable. Same question + same bundle ⇒ same answer.
 *
 * These types are client-safe (no I/O, no Prisma, no providers) so the pure
 * engine, the API route, and the chat UI can all share them.
 */

import type { DfsValueField } from "@/lib/dfs-value/types"
import type { FieldFitBoard } from "@/lib/analytics/course-fit/types"
import type { SkillLeaderboards } from "@/lib/player-skill-intelligence/types"
import type { TournamentOddsView } from "@/lib/odds-intelligence/types"
import type { WeatherIntelligence } from "@/lib/weather-intelligence/types"

/** The distinct questions AI Caddie can answer, each mapped to a real engine. */
export type CaddieIntent =
  | "best_cash_plays"
  | "best_gpp_plays"
  | "underpriced"
  | "course_fit"
  | "fades"
  | "top_form"
  | "odds_favorites"
  | "weather"
  | "compare_players"
  | "explain_rating"
  | "capabilities"
  | "unknown"

/** Platform confidence vocabulary echoed onto every answer. */
export type CaddieConfidence = "high" | "medium" | "low" | "unavailable"

/** A player referenced by an answer, rendered as a chip that links out. */
export interface CaddieEntity {
  readonly playerId: string
  readonly label: string
  /** Href to the player page, or `null` when not linkable. */
  readonly href: string | null
  /** Optional short stat shown on the chip (e.g. "A+ · $9,800"). */
  readonly detail: string | null
}

/** Names the verified engine an answer was composed from — the citation. */
export interface CaddieCitation {
  /** Human-readable engine name, e.g. "DFS Value Engine". */
  readonly engine: string
  /** The engine's own confidence for this answer. */
  readonly confidence: CaddieConfidence
  /** Optional extra provenance, e.g. "6 of 42 players priced". */
  readonly detail: string | null
}

/** One structured, grounded answer. Never contains fabricated numbers. */
export interface CaddieAnswer {
  readonly intent: CaddieIntent
  readonly headline: string
  /** One-line plain summary. */
  readonly summary: string
  /** Ordered supporting points, each already grounded in engine output. */
  readonly bullets: readonly string[]
  /** Players referenced, for chip rendering. */
  readonly entities: readonly CaddieEntity[]
  /** The engine(s) this answer is grounded in. Empty only for capabilities. */
  readonly citations: readonly CaddieCitation[]
  /** Conservative overall confidence for the answer. */
  readonly confidence: CaddieConfidence
  /** Suggested follow-up questions the user can tap. */
  readonly followUps: readonly string[]
  /** True when the engine had no data to answer (honest degradation). */
  readonly isEmpty: boolean
}

/** A single chat turn. */
export interface CaddieMessage {
  readonly id: string
  readonly role: "user" | "caddie"
  readonly text: string
  /** Present on caddie turns that carry a structured answer. */
  readonly answer: CaddieAnswer | null
  readonly createdAt: string
}

/** The result of classifying a raw user question. */
export interface CaddieRouteResult {
  readonly intent: CaddieIntent
  /** Extracted parameters (player-name fragments, board hints, etc.). */
  readonly params: {
    readonly playerNames: readonly string[]
    readonly raw: string
  }
  /** Terms that triggered the classification (for debugging/tests). */
  readonly matchedTerms: readonly string[]
}

/**
 * All verified engine output for one tournament, loaded once per question by the
 * server and handed to the pure engine. Any field may be `null` when the
 * platform holds no signal — answerers degrade honestly.
 */
export interface CaddieDataBundle {
  readonly tournamentId: string
  readonly tournamentName: string
  readonly courseName: string | null
  readonly dfs: DfsValueField | null
  readonly fit: FieldFitBoard | null
  readonly skill: SkillLeaderboards | null
  readonly odds: TournamentOddsView | null
  readonly weather: WeatherIntelligence | null
}
