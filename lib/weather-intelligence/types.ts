/**
 * Weather Intelligence — domain types.
 *
 * The Weather Intelligence engine turns raw, verified forecast snapshots into an
 * explainable, confidence-graded signal family that every downstream model
 * (Course Fit, DFS, Betting, AI Coach, the Tournament Hub) consumes instead of
 * ever calling OpenWeather. These types are the contract for that family.
 *
 * Honesty rules baked into the shape:
 *  - Every measured signal is nullable. A value is present only when the
 *    provider supplied it; the engine never fabricates a zero.
 *  - Categorical characteristics are `null` when their inputs are missing, never
 *    guessed.
 *  - `confidence` is a first-class output (`high | medium | low | unavailable`)
 *    and is the ceiling for any model built on this family.
 */

/** Forecast confidence grade. `unavailable` means no usable forecast exists. */
export type WeatherConfidence = "high" | "medium" | "low" | "unavailable"

/** Golf-relevant wind severity band. */
export type WindSeverity = "calm" | "moderate" | "strong" | "extreme"

/** Golf-relevant precipitation severity band. */
export type RainSeverity = "none" | "light" | "moderate" | "heavy"

/** Golf-relevant thermal comfort band. */
export type TemperatureComfort = "cold-stress" | "cool" | "comfortable" | "warm" | "heat-stress"

/** Overall course playability band given the conditions. */
export type Playability = "excellent" | "good" | "marginal" | "poor"

/** How steady conditions are across the window. */
export type WeatherStability = "low" | "medium" | "high"

/** Which tee-time wave is favored. `unknown` when a wave can't be compared. */
export type WaveAdvantage = "morning" | "afternoon" | "neutral" | "unknown"

/** A tournament day's role, when it can be mapped from the schedule. */
export type RoundLabel = "practice" | "round-1" | "round-2" | "round-3" | "round-4"

/** A single normalized forecast period (a provider 3-hour bucket). */
export interface WeatherPeriodSignals {
  /** Forecast validity time, ISO UTC. */
  time: string
  /** Local hour at the venue, 0..23 (from the snapshot UTC offset). */
  localHour: number
  /** Local calendar date at the venue, `YYYY-MM-DD`. */
  localDate: string
  temperatureC: number | null
  temperatureF: number | null
  feelsLikeC: number | null
  feelsLikeF: number | null
  windSpeedMs: number | null
  windSpeedMph: number | null
  windGustMph: number | null
  windDeg: number | null
  /** 16-point cardinal the wind blows *from* (e.g. "SW"), when direction known. */
  windCardinal: string | null
  /** Probability of precipitation, 0..1. */
  rainProbability: number | null
  rainMm: number | null
  humidity: number | null
  cloudCover: number | null
  pressureHpa: number | null
  visibilityKm: number | null
  condition: string | null
  windSeverity: WindSeverity | null
  rainSeverity: RainSeverity | null
}

/** Aggregate golf characteristics over a set of periods (day, wave, or window). */
export interface GolfWeatherCharacteristics {
  windSeverity: WindSeverity | null
  rainSeverity: RainSeverity | null
  temperatureComfort: TemperatureComfort | null
  playability: Playability | null
  stability: WeatherStability | null
  avgWindMph: number | null
  maxGustMph: number | null
  maxRainProbability: number | null
  totalRainMm: number | null
  avgTempF: number | null
}

/** Conditions for one tee-time wave within a day. */
export interface WaveConditions {
  wave: "morning" | "afternoon"
  periodCount: number
  avgWindMph: number | null
  maxGustMph: number | null
  avgRainProbability: number | null
  totalRainMm: number | null
  avgTempF: number | null
  characteristics: GolfWeatherCharacteristics
}

/** Morning-vs-afternoon comparison for a day, with the derived advantage. */
export interface WaveAnalysis {
  morning: WaveConditions | null
  afternoon: WaveConditions | null
  /** afternoon avg wind − morning avg wind (mph); null if either missing. */
  windDifferenceMph: number | null
  /** afternoon − morning rain probability (0..1); null if either missing. */
  rainDifference: number | null
  /** afternoon − morning avg temperature (°F); null if either missing. */
  temperatureDifferenceF: number | null
  advantage: WaveAdvantage
  /** Machine-readable codes explaining the advantage (never prose). */
  advantageReasons: string[]
}

/** One local calendar day of forecast, labeled with its tournament role. */
export interface WeatherDay {
  /** Local calendar date at the venue, `YYYY-MM-DD`. */
  date: string
  /** Tournament role when mappable from the schedule, else `null`. */
  round: RoundLabel | null
  periodCount: number
  tempHighF: number | null
  tempLowF: number | null
  characteristics: GolfWeatherCharacteristics
  waves: WaveAnalysis
}

/** A machine-readable gap explaining reduced confidence or coverage. */
export interface WeatherGap {
  code:
    // Resolution-stage gaps (no forecast could be located/loaded)
    | "tournament-not-found"
    | "no-host-course"
    | "course-missing-coordinates"
    | "no-snapshot"
    // Data-stage gaps (a snapshot exists but is thin/old)
    | "no-periods"
    | "forecast-stale"
    | "rounds-uncovered"
    | "signal-missing"
  /** Optional structured context (e.g. which signal, how many rounds). */
  detail?: string
}

/**
 * The compact, AI-ready Weather Signal Family. Purely enums + numbers (no
 * generated prose) so any model or agent can consume it directly. This is what
 * the Tournament Context Engine embeds and what downstream models read.
 */
export interface WeatherSignalFamily {
  status: "available" | "unavailable"
  confidence: WeatherConfidence
  wind: WindSeverity | null
  rain: RainSeverity | null
  temperature: TemperatureComfort | null
  playability: Playability | null
  stability: WeatherStability | null
  waveAdvantage: WaveAdvantage
  avgWindMph: number | null
  maxGustMph: number | null
  maxRainProbability: number | null
  avgTempF: number | null
  /** Hours between forecast capture and evaluation; null when unavailable. */
  forecastAgeHours: number | null
}

/** The host venue a forecast is resolved for. */
export interface WeatherVenue {
  courseId: string | null
  courseName: string | null
  latitude: number | null
  longitude: number | null
}

/** Provenance + coverage for a resolved forecast. */
export interface WeatherProvenance {
  source: string
  capturedAt: string
  forecastStart: string | null
  forecastEnd: string | null
  forecastAgeHours: number
  periodCount: number
  dayCount: number
  roundsCovered: number
  roundsTotal: number
}

/**
 * The full Weather Intelligence profile for a tournament. `status:
 * 'unavailable'` (with a `detail` and `gaps`) when no usable forecast exists —
 * the UI then shows a neutral placeholder rather than fabricated weather.
 */
export interface WeatherIntelligence {
  status: "available" | "unavailable"
  confidence: WeatherConfidence
  /**
   * The host venue the forecast is for. Present (with a course name where
   * linked) even in some `unavailable` states so the UI can name the venue while
   * explaining why conditions are pending. `latitude`/`longitude` are `null`
   * when the course has no coordinates.
   */
  venue: WeatherVenue | null
  provenance: WeatherProvenance | null
  /** Conditions for the period nearest to "now" (or the next future period). */
  current: WeatherPeriodSignals | null
  /** Every local day of forecast, labeled with tournament role where known. */
  days: WeatherDay[]
  /** Flat, time-ordered periods — the source for wind/rain timelines. */
  timeline: WeatherPeriodSignals[]
  /** Aggregate characteristics across the whole covered window. */
  overall: GolfWeatherCharacteristics | null
  /** Overall wave advantage (from the next/first covered round day). */
  waveAdvantage: WaveAdvantage
  /** Compact, AI-ready signal family embedded in Tournament Context. */
  family: WeatherSignalFamily
  gaps: WeatherGap[]
  /** One-line UI copy for partial/unavailable states (not for model input). */
  detail: string | null
}

/** Normalized input the pure engine consumes (repository-shaped, no Prisma). */
export interface WeatherIntelligenceInput {
  /** Geo + local-time offset used for forecast math (bucketing days/waves). */
  venue: { latitude: number; longitude: number; utcOffsetSeconds: number }
  /** Host-venue display info echoed onto the output for the UI. */
  displayVenue: WeatherVenue
  source: string
  capturedAt: Date
  forecastStart: Date | null
  forecastEnd: Date | null
  periods: WeatherRawPeriod[]
  /** Tournament schedule used to label days as practice / round-1..4. */
  schedule: TournamentSchedule
  /** Evaluation clock; defaults to now. Injectable for deterministic tests. */
  now?: Date
}

/** A raw stored period as handed to the engine (metric units, all nullable). */
export interface WeatherRawPeriod {
  forecastTime: Date
  temperatureC: number | null
  feelsLikeC: number | null
  windSpeedMs: number | null
  windGustMs: number | null
  windDeg: number | null
  precipProbability: number | null
  rainMm: number | null
  humidity: number | null
  cloudCover: number | null
  pressureHpa: number | null
  visibilityM: number | null
  conditionCode: number | null
  conditionLabel: string | null
}

/** The round-date scaffolding used to label forecast days. */
export interface TournamentSchedule {
  startDate: Date | null
  endDate: Date | null
  numberOfRounds: number
}
