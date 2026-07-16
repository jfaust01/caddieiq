/**
 * Weather Intelligence — golf characteristics (pure).
 *
 * Aggregates a set of normalized periods into golf-specific characteristics:
 * wind/rain severity, thermal comfort, overall playability, and stability. Every
 * output is `null` when its inputs are absent — the engine never guesses a band
 * from missing data.
 */

import { windSeverity as bandWind, rainSeverity as bandRain } from "./signals"
import type {
  GolfWeatherCharacteristics,
  Playability,
  TemperatureComfort,
  WeatherPeriodSignals,
  WeatherStability,
} from "./types"

const WIND_RANK = { calm: 0, moderate: 1, strong: 2, extreme: 3 } as const
const RAIN_RANK = { none: 0, light: 1, moderate: 2, heavy: 3 } as const

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdDev(values: number[]): number | null {
  if (values.length < 2) return null
  const m = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function round1(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

/** Thermal comfort band from a mean temperature in °F. */
export function temperatureComfort(avgTempF: number | null): TemperatureComfort | null {
  if (avgTempF == null) return null
  if (avgTempF < 45) return "cold-stress"
  if (avgTempF < 60) return "cool"
  if (avgTempF <= 80) return "comfortable"
  if (avgTempF <= 90) return "warm"
  return "heat-stress"
}

/**
 * Overall playability from the dominant wind, rain, and comfort bands. Driven by
 * the worst meaningful factor: extreme wind, heavy rain, or thermal stress each
 * force "poor" regardless of the others.
 */
export function playability(
  wind: GolfWeatherCharacteristics["windSeverity"],
  rain: GolfWeatherCharacteristics["rainSeverity"],
  comfort: TemperatureComfort | null,
): Playability | null {
  if (wind == null && rain == null && comfort == null) return null
  const w = wind ? WIND_RANK[wind] : 0
  const r = rain ? RAIN_RANK[rain] : 0
  const stressed = comfort === "cold-stress" || comfort === "heat-stress"

  if (w >= 3 || r >= 3 || stressed) return "poor"
  if (w >= 2 || r >= 2) return "marginal"
  if (w >= 1 || r >= 1) return "good"
  return "excellent"
}

/**
 * Stability from how much wind and rain probability vary across the window. Low
 * spread → conditions hold steady (high stability); large swings → low.
 */
export function stability(periods: WeatherPeriodSignals[]): WeatherStability | null {
  const winds = periods.map((p) => p.windSpeedMph).filter((v): v is number => v != null)
  const rains = periods.map((p) => p.rainProbability).filter((v): v is number => v != null)
  const windSd = stdDev(winds)
  const rainSd = stdDev(rains)
  if (windSd == null && rainSd == null) return null

  // Normalize each spread to a 0..1 instability contribution, then combine.
  const windInstability = windSd == null ? 0 : Math.min(windSd / 10, 1) // ~10mph swing = fully unstable
  const rainInstability = rainSd == null ? 0 : Math.min(rainSd / 0.4, 1) // ~0.4 prob swing = fully unstable
  const instability = Math.max(windInstability, rainInstability)

  if (instability >= 0.6) return "low"
  if (instability >= 0.3) return "medium"
  return "high"
}

/** Aggregate a set of periods into full golf characteristics. */
export function characteristicsFor(periods: WeatherPeriodSignals[]): GolfWeatherCharacteristics {
  const winds = periods.map((p) => p.windSpeedMph).filter((v): v is number => v != null)
  const gusts = periods.map((p) => p.windGustMph).filter((v): v is number => v != null)
  const rainProbs = periods.map((p) => p.rainProbability).filter((v): v is number => v != null)
  const rainAmounts = periods.map((p) => p.rainMm).filter((v): v is number => v != null)
  const temps = periods.map((p) => p.temperatureF).filter((v): v is number => v != null)

  const avgWindMph = round1(mean(winds))
  const maxGustMph = gusts.length ? round1(Math.max(...gusts)) : null
  const maxRainProbability = rainProbs.length ? Math.round(Math.max(...rainProbs) * 100) / 100 : null
  const totalRainMm = rainAmounts.length
    ? round1(rainAmounts.reduce((a, b) => a + b, 0))
    : null
  const avgTempF = round1(mean(temps))

  const wind = bandWind(avgWindMph, maxGustMph)
  const rain = bandRain(maxRainProbability, totalRainMm)
  const comfort = temperatureComfort(avgTempF)

  return {
    windSeverity: wind,
    rainSeverity: rain,
    temperatureComfort: comfort,
    playability: playability(wind, rain, comfort),
    stability: stability(periods),
    avgWindMph,
    maxGustMph,
    maxRainProbability,
    totalRainMm,
    avgTempF,
  }
}
