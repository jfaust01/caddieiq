/**
 * Weather Intelligence — assembler (pure).
 *
 * The heart of the engine: turns a normalized forecast snapshot + tournament
 * schedule into a confidence-graded {@link WeatherIntelligence} profile. Pure and
 * deterministic (inject `now` for tests). Never fetches, persists, or fabricates
 * — absent data surfaces as `null` values, `gaps`, and lower confidence.
 */

import { characteristicsFor } from "./characteristics"
import { normalizePeriod, toVenueLocal } from "./signals"
import { analyzeWaves } from "./waves"
import type {
  RoundLabel,
  WeatherConfidence,
  WeatherDay,
  WeatherGap,
  WeatherIntelligence,
  WeatherIntelligenceInput,
  WeatherPeriodSignals,
  WeatherSignalFamily,
} from "./types"

const ROUND_LABELS: RoundLabel[] = ["round-1", "round-2", "round-3", "round-4"]

/** Add `n` days to a `YYYY-MM-DD` string (UTC-noon anchored to dodge DST). */
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  dt.setUTCDate(dt.getUTCDate() + n)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
}

/** Map each local date to its tournament role, when the schedule permits. */
function buildRoundMap(
  input: WeatherIntelligenceInput,
): { roundDates: Map<string, RoundLabel>; round1Date: string | null; roundsTotal: number } {
  const roundDates = new Map<string, RoundLabel>()
  const { schedule, venue } = input
  const roundsTotal = Math.min(Math.max(schedule.numberOfRounds || 4, 1), 4)

  if (!schedule.startDate) {
    return { roundDates, round1Date: null, roundsTotal }
  }

  const round1Date = toVenueLocal(schedule.startDate, venue.utcOffsetSeconds).localDate
  for (let i = 0; i < roundsTotal; i += 1) {
    roundDates.set(addDays(round1Date, i), ROUND_LABELS[i])
  }
  return { roundDates, round1Date, roundsTotal }
}

/** Group normalized periods by their venue-local date, preserving order. */
function groupByDay(periods: WeatherPeriodSignals[]): Map<string, WeatherPeriodSignals[]> {
  const byDay = new Map<string, WeatherPeriodSignals[]>()
  for (const p of periods) {
    const bucket = byDay.get(p.localDate)
    if (bucket) bucket.push(p)
    else byDay.set(p.localDate, [p])
  }
  return byDay
}

function tempExtremes(periods: WeatherPeriodSignals[]): { hi: number | null; lo: number | null } {
  const temps = periods.map((p) => p.temperatureF).filter((v): v is number => v != null)
  if (temps.length === 0) return { hi: null, lo: null }
  return { hi: Math.max(...temps), lo: Math.min(...temps) }
}

/** Grade forecast confidence from age, round coverage, and provider quality. */
function gradeConfidence(
  ageHours: number,
  roundsCovered: number,
  roundsTotal: number,
  periodCount: number,
): WeatherConfidence {
  if (periodCount === 0) return "unavailable"

  const ageScore = ageHours < 6 ? 1 : ageHours < 24 ? 0.7 : ageHours < 72 ? 0.45 : 0.25
  const coverageScore =
    roundsTotal > 0 ? roundsCovered / roundsTotal : periodCount > 0 ? 0.5 : 0
  // OpenWeather free tier: reliable but 3-hourly and 5 days out — a solid, not
  // perfect, provider baseline.
  const providerScore = 0.7

  const combined = 0.4 * ageScore + 0.45 * coverageScore + 0.15 * providerScore
  if (combined >= 0.72) return "high"
  if (combined >= 0.48) return "medium"
  return "low"
}

/** Pick the period nearest "now": first future period, else the last past one. */
function pickCurrent(
  periods: WeatherPeriodSignals[],
  now: Date,
): WeatherPeriodSignals | null {
  if (periods.length === 0) return null
  const nowMs = now.getTime()
  const future = periods.find((p) => new Date(p.time).getTime() >= nowMs)
  if (future) return future
  return periods[periods.length - 1]
}

/** Build the compact, AI-ready signal family (enums + numbers only). */
function buildFamily(
  intelligence: Omit<WeatherIntelligence, "family">,
): WeatherSignalFamily {
  const overall = intelligence.overall
  return {
    status: intelligence.status,
    confidence: intelligence.confidence,
    wind: overall?.windSeverity ?? null,
    rain: overall?.rainSeverity ?? null,
    temperature: overall?.temperatureComfort ?? null,
    playability: overall?.playability ?? null,
    stability: overall?.stability ?? null,
    waveAdvantage: intelligence.waveAdvantage,
    avgWindMph: overall?.avgWindMph ?? null,
    maxGustMph: overall?.maxGustMph ?? null,
    maxRainProbability: overall?.maxRainProbability ?? null,
    avgTempF: overall?.avgTempF ?? null,
    forecastAgeHours: intelligence.provenance?.forecastAgeHours ?? null,
  }
}

/** The canonical `unavailable` profile, with machine-readable gaps + UI copy. */
export function unavailableIntelligence(
  gaps: WeatherGap[],
  detail: string,
  venue: WeatherIntelligence["venue"] = null,
): WeatherIntelligence {
  const base: Omit<WeatherIntelligence, "family"> = {
    status: "unavailable",
    confidence: "unavailable",
    venue,
    provenance: null,
    current: null,
    days: [],
    timeline: [],
    overall: null,
    waveAdvantage: "unknown",
    gaps,
    detail,
  }
  return { ...base, family: buildFamily(base) }
}

/**
 * Assemble a full Weather Intelligence profile from a normalized snapshot.
 * Returns an `unavailable` profile when the snapshot carries no periods.
 */
export function buildWeatherIntelligence(
  input: WeatherIntelligenceInput,
): WeatherIntelligence {
  const now = input.now ?? new Date()
  const offset = input.venue.utcOffsetSeconds
  const gaps: WeatherGap[] = []

  const timeline = input.periods
    .map((raw) => normalizePeriod(raw, offset))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  if (timeline.length === 0) {
    return unavailableIntelligence(
      [{ code: "no-periods" }],
      "No forecast periods have been imported for this tournament yet.",
      input.displayVenue,
    )
  }

  const { roundDates, roundsTotal } = buildRoundMap(input)
  const byDay = groupByDay(timeline)

  const days: WeatherDay[] = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, periods]) => {
      const { hi, lo } = tempExtremes(periods)
      return {
        date,
        round: roundDates.get(date) ?? null,
        periodCount: periods.length,
        tempHighF: hi,
        tempLowF: lo,
        characteristics: characteristicsFor(periods),
        waves: analyzeWaves(periods),
      }
    })

  const roundsCovered = [...roundDates.keys()].filter((d) => byDay.has(d)).length
  if (roundsTotal > 0 && roundsCovered < roundsTotal) {
    gaps.push({
      code: "rounds-uncovered",
      detail: `${roundsCovered}/${roundsTotal} rounds within the forecast window`,
    })
  }

  const ageHours = Math.max(0, (now.getTime() - input.capturedAt.getTime()) / 3_600_000)
  const capturedAgeRounded = Math.round(ageHours * 10) / 10
  if (ageHours >= 24) {
    gaps.push({ code: "forecast-stale", detail: `${Math.round(ageHours)}h since capture` })
  }

  const confidence = gradeConfidence(ageHours, roundsCovered, roundsTotal, timeline.length)

  // Overall characteristics across the whole covered window.
  const overall = characteristicsFor(timeline)

  // Overall wave advantage: prefer the next upcoming covered round day, else the
  // first covered round day, else the first day with two waves.
  const todayLocal = toVenueLocal(now, offset).localDate
  const roundDays = days.filter((d) => d.round != null)
  const upcomingRound =
    roundDays.find((d) => d.date >= todayLocal && d.waves.advantage !== "unknown") ??
    roundDays.find((d) => d.waves.advantage !== "unknown") ??
    days.find((d) => d.waves.advantage !== "unknown")
  const waveAdvantage = upcomingRound?.waves.advantage ?? "unknown"

  const base: Omit<WeatherIntelligence, "family"> = {
    status: "available",
    confidence,
    venue: input.displayVenue,
    provenance: {
      source: input.source,
      capturedAt: input.capturedAt.toISOString(),
      forecastStart: input.forecastStart?.toISOString() ?? timeline[0]?.time ?? null,
      forecastEnd:
        input.forecastEnd?.toISOString() ?? timeline[timeline.length - 1]?.time ?? null,
      forecastAgeHours: capturedAgeRounded,
      periodCount: timeline.length,
      dayCount: days.length,
      roundsCovered,
      roundsTotal,
    },
    current: pickCurrent(timeline, now),
    days,
    timeline,
    overall,
    waveAdvantage,
    gaps,
    detail: null,
  }

  return { ...base, family: buildFamily(base) }
}
