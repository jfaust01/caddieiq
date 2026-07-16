/**
 * Weather Status Engine — pure, testable classification of a tournament's
 * weather state.
 *
 * The Weather Intelligence engine answers "what are the conditions?"; this
 * engine answers the prerequisite question "what state is weather even *in* for
 * this event, and why?" It replaces the old single, misleading "Awaiting import"
 * string with a truthful status computed from the tournament's timing, its
 * venue, whether a forecast has been imported, the outcome of the last import
 * attempt, and the connected provider's capabilities.
 *
 * It is a pure function (no I/O) so it can be unit-tested and reused by the
 * tournament page, the hero chip, and System Health without any surface being
 * able to disagree about the state. Honest by construction: it never claims a
 * forecast exists that wasn't imported, and it never shows completed events as
 * "waiting" — the connected provider (OpenWeather) supplies forecast weather
 * only, so past events are explicitly "historical weather unavailable".
 */

/** Which side of "now" the tournament sits on (day-granular). */
export type WeatherTournamentPhase = "future" | "current" | "past"

/** Visual/semantic tone a surface can map to a badge or accent. */
export type WeatherStatusTone = "positive" | "info" | "warning" | "neutral"

/**
 * The computed weather status. Each code maps 1:1 to a row of the status matrix
 * in docs/WEATHER_INTELLIGENCE.md.
 */
export type WeatherStatusCode =
  /** Future event, still beyond the provider's forecast reach. */
  | "forecast-not-yet-available"
  /** Future/current event inside the window, no forecast imported yet. */
  | "awaiting-forecast-import"
  /** Future event inside the window, forecast imported. */
  | "forecast-available"
  /** Event is currently being played and a forecast is loaded. */
  | "live-forecast"
  /** The most recent import attempt for an eligible event failed. */
  | "weather-import-failed"
  /** Completed event; the connected provider has no historical weather. */
  | "historical-unavailable"
  /** Completed event with historical weather available (future provider). */
  | "historical-available"
  /** Venue has no usable coordinates, so no forecast can be located. */
  | "coordinates-unavailable"
  /** The forecast provider is currently unreachable. */
  | "provider-unavailable"

/** The full, render-ready status report. */
export interface WeatherStatusReport {
  code: WeatherStatusCode
  phase: WeatherTournamentPhase
  /** Short status label, e.g. "Forecast not yet available". */
  label: string
  /** One or two plain-English sentences safe to render directly. */
  description: string
  tone: WeatherStatusTone
  /**
   * Whether a manual "Refresh Weather" action is meaningful for this event —
   * true only when it is forecast-eligible (inside the window, located, and the
   * provider can serve it). Completed, too-far-out, unlocated, or offline
   * events are not refreshable and the UI hides/disables the control.
   */
  refreshEligible: boolean
  /**
   * True ONLY for `awaiting-forecast-import`. The single state where copy may
   * legitimately say the event is "awaiting" a weather import.
   */
  awaitingImport: boolean
}

/** The plain facts the pure engine classifies. No Prisma, no I/O. */
export interface WeatherStatusInput {
  /** Evaluation clock; defaults to now. Injectable for deterministic tests. */
  now?: Date
  startDate: Date | null
  endDate: Date | null
  /** Whether the host venue has a usable (VERIFIED/APPROXIMATE) coordinate. */
  hasCoordinates: boolean
  /** Whether a forecast snapshot with ≥1 period has been imported. */
  hasSnapshot: boolean
  /** Whether the most recent import attempt for this event ended in FAILED. */
  lastImportFailed?: boolean
  /** Provider forecast reach, in days. Defaults to {@link FORECAST_HORIZON_DAYS}. */
  forecastHorizonDays?: number
  /** Whether the connected provider can supply historical weather at all. */
  providerSupportsHistorical?: boolean
  /**
   * Whether the provider is reachable right now. `undefined` = not probed (do
   * not assert an outage); `false` = confirmed unreachable.
   */
  providerOnline?: boolean
}

/**
 * OpenWeather's free 5-day/3-hour forecast reaches ~5 days out. Kept in sync
 * with the importer/service horizon so every surface agrees on the window.
 */
export const FORECAST_HORIZON_DAYS = 5

const DAY_MS = 86_400_000

/** UTC calendar-day index (days since epoch) for day-granular comparisons. */
function dayIndex(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS)
}

/** Whole days from `now` until `date`, rounded up; null when no date. */
function daysUntil(date: Date | null, now: Date): number | null {
  if (!date) return null
  return Math.ceil((date.getTime() - now.getTime()) / DAY_MS)
}

/** Classify the tournament relative to now, at day granularity. */
export function resolvePhase(
  startDate: Date | null,
  endDate: Date | null,
  now: Date,
): WeatherTournamentPhase {
  // With no start date we cannot place the event; treat it as future so we never
  // fabricate a "live"/"historical" claim for an undated event.
  if (!startDate) return "future"
  const today = dayIndex(now)
  const start = dayIndex(startDate)
  // A single-day event (no end date) ends the day it starts.
  const end = dayIndex(endDate ?? startDate)
  if (end < today) return "past"
  if (start > today) return "future"
  return "current"
}

/** Copy + tone for each status code. Centralized so every surface agrees. */
const COPY: Record<WeatherStatusCode, { label: string; description: string; tone: WeatherStatusTone }> = {
  "forecast-not-yet-available": {
    label: "Forecast not yet available",
    description:
      "Forecasts become available automatically approximately 5 days before tournament play begins.",
    tone: "neutral",
  },
  "awaiting-forecast-import": {
    label: "Awaiting forecast import",
    description:
      "The next scheduled Weather Intelligence import will retrieve forecast data for this event.",
    tone: "info",
  },
  "forecast-available": {
    label: "Forecast available",
    description:
      "A forecast has been imported for this event — wind, temperature and rain probability are shown below.",
    tone: "positive",
  },
  "live-forecast": {
    label: "Live forecast",
    description: "This event is underway. Current Weather Intelligence is shown below.",
    tone: "positive",
  },
  "weather-import-failed": {
    label: "Weather import failed",
    description:
      "The most recent forecast import for this event did not complete. An administrator can retry the import.",
    tone: "warning",
  },
  "historical-unavailable": {
    label: "Historical weather unavailable",
    description:
      "The connected weather provider supplies forecast weather only. Historical weather is not available for completed tournaments.",
    tone: "neutral",
  },
  "historical-available": {
    label: "Historical weather available",
    description: "Recorded conditions for this completed event are shown below.",
    tone: "positive",
  },
  "coordinates-unavailable": {
    label: "Course coordinates unavailable",
    description:
      "The host venue has not been located to verified coordinates, so a forecast cannot be requested. No approximate location is ever used.",
    tone: "warning",
  },
  "provider-unavailable": {
    label: "Provider unavailable",
    description:
      "The forecast provider is currently unreachable, so no new conditions can be retrieved right now.",
    tone: "warning",
  },
}

/** Codes for which a manual refresh is meaningful (event is forecast-eligible). */
const REFRESHABLE: ReadonlySet<WeatherStatusCode> = new Set<WeatherStatusCode>([
  "awaiting-forecast-import",
  "forecast-available",
  "live-forecast",
  "weather-import-failed",
])

/** Assemble a report from a code + phase, stamping derived flags. */
function report(code: WeatherStatusCode, phase: WeatherTournamentPhase): WeatherStatusReport {
  const copy = COPY[code]
  return {
    code,
    phase,
    label: copy.label,
    description: copy.description,
    tone: copy.tone,
    refreshEligible: REFRESHABLE.has(code),
    awaitingImport: code === "awaiting-forecast-import",
  }
}

/**
 * Compute the Weather Status for a tournament from plain facts. Pure — the same
 * inputs always yield the same report. See the status matrix in
 * docs/WEATHER_INTELLIGENCE.md for the row-by-row mapping.
 */
export function computeWeatherStatus(input: WeatherStatusInput): WeatherStatusReport {
  const now = input.now ?? new Date()
  const horizon = input.forecastHorizonDays ?? FORECAST_HORIZON_DAYS
  const phase = resolvePhase(input.startDate, input.endDate, now)

  // Completed events: the connected provider is forecast-only, so this is
  // resolved before coordinates/provider checks — a past event is never shown
  // as "waiting for an import" it will never receive.
  if (phase === "past") {
    if (input.providerSupportsHistorical && input.hasSnapshot) {
      return report("historical-available", phase)
    }
    return report("historical-unavailable", phase)
  }

  // Future/current events need a located venue and a reachable provider before
  // any forecast can exist.
  if (!input.hasCoordinates) return report("coordinates-unavailable", phase)
  if (input.providerOnline === false) return report("provider-unavailable", phase)

  if (phase === "current") {
    if (input.hasSnapshot) return report("live-forecast", phase)
    if (input.lastImportFailed) return report("weather-import-failed", phase)
    return report("awaiting-forecast-import", phase)
  }

  // Future event: is it inside the provider's forecast window yet?
  const daysOut = daysUntil(input.startDate, now)
  const insideWindow = daysOut !== null && daysOut <= horizon
  if (!insideWindow) return report("forecast-not-yet-available", phase)
  if (input.hasSnapshot) return report("forecast-available", phase)
  if (input.lastImportFailed) return report("weather-import-failed", phase)
  return report("awaiting-forecast-import", phase)
}
