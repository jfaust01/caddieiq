/**
 * Shared, pure helpers for AI Caddie answerers.
 *
 * Centralizes the confidence-vocabulary mapping (each engine speaks a slightly
 * different dialect), player-entity construction, and the honest "no data"
 * answer so every answerer degrades identically. No I/O.
 */

import type { CaddieAnswer, CaddieConfidence, CaddieEntity, CaddieIntent } from "../types"

/** Map the DFS / Skill / Fit `none|low|medium|high` dialect to Caddie's. */
export function fromGradedConfidence(c: "none" | "low" | "medium" | "high"): CaddieConfidence {
  switch (c) {
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "low":
      return "low"
    case "none":
      return "unavailable"
  }
}

/** Map the Odds `verified|partial|unavailable` dialect to Caddie's. */
export function fromOddsConfidence(c: "verified" | "partial" | "unavailable"): CaddieConfidence {
  switch (c) {
    case "verified":
      return "high"
    case "partial":
      return "medium"
    case "unavailable":
      return "unavailable"
  }
}

/** Weather already speaks `high|medium|low|unavailable`. */
export function fromWeatherConfidence(c: "high" | "medium" | "low" | "unavailable"): CaddieConfidence {
  return c
}

/** Build a linkable player entity chip. */
export function playerEntity(
  playerId: string,
  label: string,
  detail: string | null = null,
): CaddieEntity {
  return {
    playerId,
    label,
    href: playerId ? `/players/${playerId}` : null,
    detail,
  }
}

/** The honest "I don't have that for this tournament" answer. */
export function emptyAnswer(
  intent: CaddieIntent,
  tournamentName: string,
  engine: string,
  reason: string,
  followUps: readonly string[] = [],
): CaddieAnswer {
  return {
    intent,
    headline: "Not available yet",
    summary: `${reason} for ${tournamentName}.`,
    bullets: [],
    entities: [],
    citations: [{ engine, confidence: "unavailable", detail: null }],
    confidence: "unavailable",
    followUps,
    isEmpty: true,
  }
}

/** Format a whole-dollar salary as `$9,800`, or `—` when unpriced. */
export function formatSalary(salary: number | null): string {
  if (salary == null) return "—"
  return `$${salary.toLocaleString("en-US")}`
}

/** Round a 0–100 score for display, or `—` when null. */
export function formatScore(score: number | null): string {
  if (score == null) return "—"
  return String(Math.round(score))
}
