/**
 * Weather Intelligence — signal normalization (pure).
 *
 * Converts a raw metric forecast period into a normalized {@link
 * WeatherPeriodSignals} with dual units, venue-local time, and per-period golf
 * severity bands. No I/O, no persistence, no fabrication: a missing input stays
 * `null` all the way through.
 */

import type { RainSeverity, WeatherPeriodSignals, WeatherRawPeriod, WindSeverity } from "./types"

const MS_TO_MPH = 2.2369362920544
const CARDINALS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
]

/** Round to `digits` decimals, preserving `null`. */
export function round(value: number | null | undefined, digits = 1): number | null {
  if (value == null || !Number.isFinite(value)) return null
  const f = 10 ** digits
  return Math.round(value * f) / f
}

/** Celsius → Fahrenheit, preserving `null`. */
export function cToF(c: number | null): number | null {
  return c == null ? null : round(c * (9 / 5) + 32)
}

/** Metres/second → miles/hour, preserving `null`. */
export function msToMph(ms: number | null): number | null {
  return ms == null ? null : round(ms * MS_TO_MPH)
}

/** Compass degrees → 16-point cardinal the wind blows from. */
export function degToCardinal(deg: number | null): string | null {
  if (deg == null || !Number.isFinite(deg)) return null
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16
  return CARDINALS[idx]
}

/**
 * Golf wind severity from sustained mph, escalated by gusts. Bands are tuned to
 * how wind actually plays for tour-level golf, not generic meteorology.
 */
export function windSeverity(avgMph: number | null, gustMph: number | null): WindSeverity | null {
  if (avgMph == null && gustMph == null) return null
  const base = avgMph ?? 0
  const gust = gustMph ?? base
  // A strong gust promotes a period one band, capturing punchy conditions the
  // sustained average alone would understate.
  const gusty = gust >= base + 10
  if (base > 25 || gust > 35) return "extreme"
  if (base >= 15 || gust >= 25) return gusty && base >= 20 ? "extreme" : "strong"
  if (base >= 8 || gust >= 18) return gusty ? "strong" : "moderate"
  return gusty ? "moderate" : "calm"
}

/** Golf rain severity from probability (0..1) and 3-hour accumulation (mm). */
export function rainSeverity(probability: number | null, mm: number | null): RainSeverity | null {
  if (probability == null && mm == null) return null
  const p = probability ?? 0
  const amount = mm ?? 0
  if (p >= 0.7 || amount >= 7.6) return "heavy"
  if (p >= 0.5 || amount >= 2.5) return "moderate"
  if (p >= 0.2 || amount >= 0.3) return "light"
  return "none"
}

/**
 * Venue-local calendar date + hour for a UTC instant, given the venue's fixed
 * UTC offset (seconds). Avoids any dependency on the server's timezone.
 */
export function toVenueLocal(
  utc: Date,
  offsetSeconds: number,
): { localDate: string; localHour: number } {
  const shifted = new Date(utc.getTime() + offsetSeconds * 1000)
  const yyyy = shifted.getUTCFullYear()
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(shifted.getUTCDate()).padStart(2, "0")
  return { localDate: `${yyyy}-${mm}-${dd}`, localHour: shifted.getUTCHours() }
}

/** Normalize one raw period into a dual-unit, venue-local signal record. */
export function normalizePeriod(
  raw: WeatherRawPeriod,
  offsetSeconds: number,
): WeatherPeriodSignals {
  const { localDate, localHour } = toVenueLocal(raw.forecastTime, offsetSeconds)
  const windSpeedMph = msToMph(raw.windSpeedMs)
  const windGustMph = msToMph(raw.windGustMs)
  const visibilityKm = raw.visibilityM == null ? null : round(raw.visibilityM / 1000)

  return {
    time: raw.forecastTime.toISOString(),
    localHour,
    localDate,
    temperatureC: round(raw.temperatureC),
    temperatureF: cToF(raw.temperatureC),
    feelsLikeC: round(raw.feelsLikeC),
    feelsLikeF: cToF(raw.feelsLikeC),
    windSpeedMs: round(raw.windSpeedMs),
    windSpeedMph,
    windGustMph,
    windDeg: raw.windDeg == null ? null : Math.round(raw.windDeg),
    windCardinal: degToCardinal(raw.windDeg),
    rainProbability: raw.precipProbability == null ? null : round(raw.precipProbability, 2),
    rainMm: round(raw.rainMm, 2),
    humidity: raw.humidity == null ? null : Math.round(raw.humidity),
    cloudCover: raw.cloudCover == null ? null : Math.round(raw.cloudCover),
    pressureHpa: raw.pressureHpa == null ? null : Math.round(raw.pressureHpa),
    visibilityKm,
    condition: raw.conditionLabel,
    windSeverity: windSeverity(windSpeedMph, windGustMph),
    rainSeverity: rainSeverity(raw.precipProbability, raw.rainMm),
  }
}
