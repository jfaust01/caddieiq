/**
 * Weather Intelligence — tee-time wave analysis (pure).
 *
 * Splits a day's periods into a morning wave (local 06:00–11:59) and an
 * afternoon wave (12:00–17:59), summarizes each, and derives which wave is
 * favored. The advantage is expressed as an enum plus machine-readable reason
 * codes (never prose), so models and agents can consume it directly.
 */

import { characteristicsFor } from "./characteristics"
import type { WaveAnalysis, WaveConditions, WeatherPeriodSignals } from "./types"

const MORNING_START = 6
const MORNING_END = 12 // exclusive
const AFTERNOON_START = 12
const AFTERNOON_END = 18 // exclusive

/** Meaningful wind gap between waves, in mph, before calling an advantage. */
const WIND_EDGE_MPH = 3
/** Meaningful rain-probability gap between waves before calling an advantage. */
const RAIN_EDGE_PROB = 0.15

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function round1(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

function summarizeWave(
  wave: "morning" | "afternoon",
  periods: WeatherPeriodSignals[],
): WaveConditions | null {
  if (periods.length === 0) return null
  const winds = periods.map((p) => p.windSpeedMph).filter((v): v is number => v != null)
  const gusts = periods.map((p) => p.windGustMph).filter((v): v is number => v != null)
  const rainProbs = periods.map((p) => p.rainProbability).filter((v): v is number => v != null)
  const rainAmounts = periods.map((p) => p.rainMm).filter((v): v is number => v != null)
  const temps = periods.map((p) => p.temperatureF).filter((v): v is number => v != null)

  return {
    wave,
    periodCount: periods.length,
    avgWindMph: round1(mean(winds)),
    maxGustMph: gusts.length ? round1(Math.max(...gusts)) : null,
    avgRainProbability: rainProbs.length ? Math.round((mean(rainProbs) ?? 0) * 100) / 100 : null,
    totalRainMm: rainAmounts.length ? round1(rainAmounts.reduce((a, b) => a + b, 0)) : null,
    avgTempF: round1(mean(temps)),
    characteristics: characteristicsFor(periods),
  }
}

/**
 * Analyze a single day's periods into morning/afternoon waves and derive the
 * advantage. Lower wind and lower rain probability favor a wave; when neither
 * gap clears the meaningful threshold the day is `neutral`. If a wave is missing
 * entirely (e.g. no morning periods forecast), the advantage is `unknown`.
 */
export function analyzeWaves(dayPeriods: WeatherPeriodSignals[]): WaveAnalysis {
  const morningPeriods = dayPeriods.filter(
    (p) => p.localHour >= MORNING_START && p.localHour < MORNING_END,
  )
  const afternoonPeriods = dayPeriods.filter(
    (p) => p.localHour >= AFTERNOON_START && p.localHour < AFTERNOON_END,
  )

  const morning = summarizeWave("morning", morningPeriods)
  const afternoon = summarizeWave("afternoon", afternoonPeriods)

  if (!morning || !afternoon) {
    return {
      morning,
      afternoon,
      windDifferenceMph: null,
      rainDifference: null,
      temperatureDifferenceF: null,
      advantage: "unknown",
      advantageReasons: ["incomplete-wave-coverage"],
    }
  }

  const windDifferenceMph =
    morning.avgWindMph != null && afternoon.avgWindMph != null
      ? round1(afternoon.avgWindMph - morning.avgWindMph)
      : null
  const rainDifference =
    morning.avgRainProbability != null && afternoon.avgRainProbability != null
      ? Math.round((afternoon.avgRainProbability - morning.avgRainProbability) * 100) / 100
      : null
  const temperatureDifferenceF =
    morning.avgTempF != null && afternoon.avgTempF != null
      ? round1(afternoon.avgTempF - morning.avgTempF)
      : null

  // Vote per factor: +1 favors morning, −1 favors afternoon.
  let score = 0
  const reasons: string[] = []

  if (windDifferenceMph != null && Math.abs(windDifferenceMph) >= WIND_EDGE_MPH) {
    if (windDifferenceMph > 0) {
      score += 1
      reasons.push("morning-lighter-wind")
    } else {
      score -= 1
      reasons.push("afternoon-lighter-wind")
    }
  }

  if (rainDifference != null && Math.abs(rainDifference) >= RAIN_EDGE_PROB) {
    if (rainDifference > 0) {
      score += 1
      reasons.push("morning-lower-rain")
    } else {
      score -= 1
      reasons.push("afternoon-lower-rain")
    }
  }

  let advantage: WaveAnalysis["advantage"]
  if (score > 0) advantage = "morning"
  else if (score < 0) advantage = "afternoon"
  else {
    advantage = "neutral"
    if (reasons.length === 0) reasons.push("no-meaningful-difference")
  }

  return {
    morning,
    afternoon,
    windDifferenceMph,
    rainDifference,
    temperatureDifferenceF,
    advantage,
    advantageReasons: reasons,
  }
}
