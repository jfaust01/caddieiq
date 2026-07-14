/**
 * Deterministic mock helpers for the analytics scaffold.
 *
 * Every module currently returns placeholder values rather than real analysis.
 * These helpers make that output *deterministic* (stable for a given subject +
 * metric) and *realistic* (sensible ranges), so the UI and AI layers can be
 * built against believable data.
 *
 * TODO(sportsdataio): delete or bypass these helpers once modules compute from
 * normalized provider data instead of seeded pseudo-random values.
 */

import type { ConfidenceLevel, MetricTrend } from "./types"

/** FNV-1a hash → unsigned 32-bit int. Stable across runs and platforms. */
export function hashSeed(...parts: Array<string | number>): number {
  const input = parts.join(":")
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mulberry32 PRNG: fast, seedable, good enough for deterministic mock data. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministically map a seed into [min, max]. */
export function seededValue(seed: number, min: number, max: number): number {
  return min + seededRandom(seed)() * (max - min)
}

/** Round to a fixed number of decimals. */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Derive a plausible confidence level from a seed. */
export function seededConfidence(seed: number): ConfidenceLevel {
  const roll = seededRandom(seed)()
  if (roll > 0.66) return "high"
  if (roll > 0.33) return "medium"
  return "low"
}

/** Derive a plausible trend from a seed. */
export function seededTrend(seed: number): MetricTrend {
  const roll = seededRandom(seed)()
  if (roll > 0.6) return "up"
  if (roll > 0.3) return "flat"
  return "down"
}
