/**
 * Pure helpers for the Ranking Engine: score math, weight normalization,
 * deterministic mock generation, and a compact ranking-scoped logger.
 *
 * Everything here is side-effect free and deterministic (given the same seed),
 * so mock rankings are stable across runs and safe to snapshot in tests.
 */

import type {
  AnalyticsModuleKey,
  ConfidenceLevel,
  ModuleWeights,
} from "@/lib/analytics/shared/types"
import type { RankingMovement, RankingWeights } from "./types"

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

/** Round to a fixed number of decimal places (default 1). */
export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Normalize a set of relative weights so the values sum to 1. Missing/negative
 * weights are treated as 0; an all-zero set falls back to equal weighting.
 */
export function normalizeWeights(weights: RankingWeights): RankingWeights {
  const keys = Object.keys(weights) as AnalyticsModuleKey[]
  const positives = keys.map((key) => Math.max(0, weights[key] ?? 0))
  const total = positives.reduce((sum, weight) => sum + weight, 0)

  const normalized: ModuleWeights = {}
  if (total === 0) {
    const even = keys.length > 0 ? 1 / keys.length : 0
    for (const key of keys) normalized[key] = roundTo(even, 3)
    return normalized
  }

  for (let i = 0; i < keys.length; i += 1) {
    normalized[keys[i]] = roundTo(positives[i] / total, 3)
  }
  return normalized
}

// ---------------------------------------------------------------------------
// Deterministic mock generation
// ---------------------------------------------------------------------------

/** Cheap 32-bit string hash (FNV-1a) used to seed the mock RNG. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Mulberry32 PRNG factory. Returns a function yielding deterministic floats in
 * [0, 1) for a given numeric seed.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Produce a deterministic mock score in [min, max] from any string seed. Used
 * throughout the placeholder pipeline so a given (player, module) pair always
 * yields the same value.
 */
export function mockScore(seed: string, min = 35, max = 95): number {
  const rng = seededRandom(hashString(seed))
  return roundTo(min + rng() * (max - min), 1)
}

// ---------------------------------------------------------------------------
// Qualitative helpers
// ---------------------------------------------------------------------------

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
}
const CONFIDENCE_BY_RANK: ConfidenceLevel[] = ["low", "medium", "high"]

/** Blend several confidence levels into a single representative level. */
export function blendConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return "low"
  const avg =
    levels.reduce((sum, level) => sum + CONFIDENCE_RANK[level], 0) / levels.length
  return CONFIDENCE_BY_RANK[Math.round(avg)] ?? "medium"
}

/**
 * Map a higher-is-better composite score to a coarse confidence band. This is a
 * structural placeholder; real confidence will derive from data completeness.
 */
export function confidenceFromScore(score: number): ConfidenceLevel {
  if (score >= 70) return "high"
  if (score >= 50) return "medium"
  return "low"
}

/** Derive movement direction from a rank delta (positive = moved up). */
export function movementFromDelta(delta: number): RankingMovement {
  if (delta > 0) return "up"
  if (delta < 0) return "down"
  return "flat"
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export type RankingLogLevel = "debug" | "info" | "warn" | "error"

/** A single structured ranking log record. */
export interface RankingLogEntry {
  scope: "engine" | "pipeline" | "service"
  level: RankingLogLevel
  message: string
  timestamp: string
  meta?: Record<string, unknown>
}

/** Destination for ranking log entries. Swap in a sink to ship logs elsewhere. */
export interface RankingLogSink {
  write(entry: RankingLogEntry): void
}

/** Default console sink with a `[ranking:<scope>]` prefix. */
export const consoleRankingLogSink: RankingLogSink = {
  write(entry) {
    const line = `[ranking:${entry.scope}] ${entry.message}`
    if (entry.level === "error") console.error(line, entry.meta ?? "")
    else if (entry.level === "warn") console.warn(line, entry.meta ?? "")
    else console.log(line, entry.meta ?? "")
  },
}

/** Compact logger mirroring the analytics framework's style. */
export class RankingLogger {
  constructor(
    private readonly scope: RankingLogEntry["scope"],
    private readonly sink: RankingLogSink = consoleRankingLogSink,
  ) {}

  debug(message: string, meta?: Record<string, unknown>) {
    this.emit("debug", message, meta)
  }
  info(message: string, meta?: Record<string, unknown>) {
    this.emit("info", message, meta)
  }
  warn(message: string, meta?: Record<string, unknown>) {
    this.emit("warn", message, meta)
  }
  error(message: string, meta?: Record<string, unknown>) {
    this.emit("error", message, meta)
  }

  private emit(level: RankingLogLevel, message: string, meta?: Record<string, unknown>) {
    this.sink.write({
      scope: this.scope,
      level,
      message,
      timestamp: new Date().toISOString(),
      meta,
    })
  }
}

/** Convenience factory. */
export function createRankingLogger(
  scope: RankingLogEntry["scope"],
  sink?: RankingLogSink,
): RankingLogger {
  return new RankingLogger(scope, sink)
}
