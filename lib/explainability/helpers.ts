/**
 * Small pure helpers shared by the adapters. Kept separate from `types.ts` so
 * the type contract stays declaration-only.
 */

import { confidenceLabel } from "./confidence"
import type {
  Contributor,
  ContributorDirection,
  ExplanationConfidence,
  ExplanationHeadline,
  ExplanationNarrative,
  HeadlineUnit,
} from "./types"

/** The empty narrative an adapter emits before a narrator runs. */
export function emptyNarrative(): ExplanationNarrative {
  return { summary: "", bullets: [] }
}

/** Round to a whole number, preserving `null`. */
export function roundOrNull(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.round(value)
}

/** Round to one decimal place, preserving `null`. */
export function round1(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.round(value * 10) / 10
}

/**
 * Direction from a 0–100 strength reading against a neutral 50 baseline. Values
 * within `deadband` of 50 are `neutral`. `null` readings are `neutral`.
 */
export function directionFromScore(value: number | null, deadband = 2): ContributorDirection {
  if (value === null) return "neutral"
  if (value >= 50 + deadband) return "positive"
  if (value <= 50 - deadband) return "negative"
  return "neutral"
}

/** Build a headline, deriving the confidence label automatically. */
export function buildHeadline(args: {
  value: number | null
  unit: HeadlineUnit
  band: string | null
  confidence: ExplanationConfidence
}): ExplanationHeadline {
  return {
    value: args.value,
    unit: args.unit,
    band: args.band,
    confidence: args.confidence,
    confidenceLabel: confidenceLabel(args.confidence),
  }
}

/** Order contributors by absolute contribution (then normalized value), desc. */
export function byContribution(a: Contributor, b: Contributor): number {
  const ac = a.contribution === null ? -Infinity : Math.abs(a.contribution)
  const bc = b.contribution === null ? -Infinity : Math.abs(b.contribution)
  if (bc !== ac) return bc - ac
  const av = a.normalizedValue ?? -Infinity
  const bv = b.normalizedValue ?? -Infinity
  return bv - av
}
