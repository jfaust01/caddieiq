/**
 * Weather import & association.
 *
 * OpenWeather exposes a 5-day / 3-hour forecast for a coordinate via
 * `/data/2.5/forecast`. This module drives the full pipeline:
 *
 *   Repository → resolve a tournament's host-course coordinates + schedule
 *   Provider   → fetch the forecast for that coordinate (metric units)
 *   Mapper     → map each raw 3-hour bucket into a normalized WeatherPeriodInput
 *                (all fields nullable — a value is stored only when present)
 *   Repository → atomically replace the tournament's snapshot + periods
 *
 * Honest by construction: a tournament with no host course, or a course with no
 * coordinates, is skipped with a note — never fetched for a fabricated location.
 * If the provider returns no usable periods, no snapshot is written and the
 * Weather Intelligence engine continues to report the event as `unavailable`.
 */

import prismaClient from "@/lib/prisma"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import { OpenWeatherClient } from "@/lib/providers/weather/client"
import type { OwmForecastEntry, OwmForecastResponse } from "@/lib/providers/weather/types"
import {
  getWeatherRepository,
  type WeatherPeriodInput,
  type WeatherRepository,
  type WeatherSnapshotInput,
} from "@/lib/repositories"

/** Outcome of a weather import run, suitable for an import report. */
export interface WeatherImportSummary {
  tournamentsConsidered: number
  fetched: number
  stored: number
  /**
   * Of the `stored` snapshots, how many were fetched against a city-level
   * (APPROXIMATE) course coordinate rather than a course-precise (VERIFIED) one.
   * Surfaced so the forecast's precision is never silently overstated.
   */
  storedCityLevel: number
  skippedNoCourse: number
  skippedNoCoordinates: number
  failed: number
  periodsStored: number
  /**
   * How the run chose its tournaments: `explicit` when the caller passed ids,
   * `auto` when it selected upcoming/in-progress events within the horizon.
   */
  selectionMode: "explicit" | "auto"
  /** The auto-selection forecast horizon in days (0 when explicit ids given). */
  horizonDays: number
  /**
   * Why zero tournaments were considered, when that happens on an auto run —
   * so an empty result is explained, never silent. `null` when ≥1 considered.
   */
  emptyReason: string | null
  notes: string[]
}

export interface ImportWeatherOptions {
  prisma?: PrismaClient
  client?: OpenWeatherClient
  repository?: WeatherRepository
  /** Explicit tournament ids to refresh. Defaults to upcoming/in-progress. */
  tournamentIds?: readonly string[]
  /** Skip a refresh if the stored snapshot is younger than this (ms). */
  minRefreshIntervalMs?: number
  maxNotes?: number
}

/**
 * Auto-selection window. OpenWeather's free forecast reaches ~5 days out; we use
 * 6 to include one buffer day so an event just entering forecast range is picked
 * up on the next daily run. Events beyond this have no usable forecast yet.
 */
const DEFAULT_HORIZON_DAYS = 6

/**
 * Import forecasts for the given (or automatically selected upcoming)
 * tournaments and store one snapshot each. Idempotent: re-running replaces a
 * tournament's snapshot wholesale.
 */
export async function importWeather(
  options: ImportWeatherOptions = {},
): Promise<WeatherImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const client = options.client ?? OpenWeatherClient.fromEnv()
  const repository = options.repository ?? getWeatherRepository()
  const maxNotes = options.maxNotes ?? 25

  const explicit = options.tournamentIds && options.tournamentIds.length > 0
  const summary: WeatherImportSummary = {
    tournamentsConsidered: 0,
    fetched: 0,
    stored: 0,
    storedCityLevel: 0,
    skippedNoCourse: 0,
    skippedNoCoordinates: 0,
    failed: 0,
    periodsStored: 0,
    selectionMode: explicit ? "explicit" : "auto",
    horizonDays: explicit ? 0 : DEFAULT_HORIZON_DAYS,
    emptyReason: null,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  const tournamentIds = await resolveTournamentIds(prisma, options.tournamentIds)
  summary.tournamentsConsidered = tournamentIds.length

  // A zero-consideration auto run must never be silent: explain exactly why the
  // window is empty (and name the nearest event) so operators can distinguish
  // "expected — nothing forecastable yet" from a real misconfiguration.
  if (tournamentIds.length === 0) {
    summary.emptyReason = explicit
      ? "No tournament ids were supplied to import."
      : await describeEmptyWindow(prisma)
    note(summary.emptyReason)
    return summary
  }

  for (const tournamentId of tournamentIds) {
    const venue = await repository.findWeatherVenueById(tournamentId)
    if (!venue) {
      summary.failed += 1
      note(`Tournament ${tournamentId} not found.`)
      continue
    }
    if (!venue.courseId) {
      summary.skippedNoCourse += 1
      note(`${venue.tournamentName}: no host course linked; skipped.`)
      continue
    }
    if (venue.latitude === null || venue.longitude === null) {
      summary.skippedNoCoordinates += 1
      note(`${venue.tournamentName}: host course has no coordinates; skipped.`)
      continue
    }

    // Respect a caller-provided refresh interval to avoid burning quota.
    if (options.minRefreshIntervalMs != null) {
      const capturedAt = await repository.getCapturedAt(tournamentId)
      if (capturedAt && Date.now() - capturedAt.getTime() < options.minRefreshIntervalMs) {
        note(`${venue.tournamentName}: snapshot still fresh; skipped.`)
        continue
      }
    }

    let forecast: OwmForecastResponse
    try {
      forecast = await client.fetchForecast({
        latitude: venue.latitude,
        longitude: venue.longitude,
      })
      summary.fetched += 1
    } catch (error) {
      summary.failed += 1
      note(`${venue.tournamentName}: forecast fetch failed: ${(error as Error).message}`)
      continue
    }

    const snapshot = toSnapshotInput(tournamentId, venue.courseId, venue.latitude, venue.longitude, forecast)
    if (snapshot.periods.length === 0) {
      note(`${venue.tournamentName}: provider returned no usable periods; snapshot not written.`)
      continue
    }

    const result = await repository.replaceSnapshot(snapshot)
    if (result.outcome === "failed") {
      summary.failed += 1
      note(`${venue.tournamentName}: persist failed: ${result.error?.message ?? "unknown error"}`)
    } else {
      summary.stored += 1
      summary.periodsStored += snapshot.periods.length
      // Record when a forecast was fetched against a city-level (APPROXIMATE)
      // coordinate rather than the course itself, so precision is never
      // overstated downstream.
      if (venue.coordinateConfidence === "APPROXIMATE") {
        summary.storedCityLevel += 1
        note(`${venue.tournamentName}: forecast fetched for city-level (APPROXIMATE) coordinate.`)
      }
    }
  }

  return summary
}

/**
 * Resolve which tournaments to refresh: an explicit list, or upcoming and
 * in-progress events within the provider's useful forecast horizon.
 */
async function resolveTournamentIds(
  prisma: PrismaClient,
  explicit?: readonly string[],
): Promise<string[]> {
  if (explicit && explicit.length > 0) return [...explicit]
  const horizon = new Date(Date.now() + DEFAULT_HORIZON_DAYS * 86_400_000)
  const rows = await prisma.tournament.findMany({
    where: {
      deletedAt: null,
      status: { not: "CANCELED" },
      startDate: { not: null, lte: horizon, gte: new Date(Date.now() - 5 * 86_400_000) },
    },
    select: { id: true },
    orderBy: { startDate: "asc" },
  })
  return rows.map((r) => r.id)
}

/**
 * Build a human-readable explanation for why an auto run selected zero
 * tournaments. Names the nearest upcoming event and how far out it is, framing
 * the common, expected case (nothing within OpenWeather's ~5-day forecast reach)
 * as normal rather than a failure.
 */
async function describeEmptyWindow(prisma: PrismaClient): Promise<string> {
  const nearest = await prisma.tournament.findFirst({
    where: { deletedAt: null, status: { not: "CANCELED" }, startDate: { gt: new Date() } },
    select: { name: true, startDate: true },
    orderBy: { startDate: "asc" },
  })
  if (!nearest?.startDate) {
    return `No upcoming tournaments are scheduled, so there is nothing to fetch within the ${DEFAULT_HORIZON_DAYS}-day forecast window.`
  }
  const days = Math.max(0, Math.ceil((nearest.startDate.getTime() - Date.now()) / 86_400_000))
  return (
    `No tournament falls within the ${DEFAULT_HORIZON_DAYS}-day forecast window. ` +
    `The nearest event, "${nearest.name}", starts in ${days} day${days === 1 ? "" : "s"} ` +
    `(${nearest.startDate.toISOString().slice(0, 10)}) — beyond OpenWeather's ~5-day forecast reach. ` +
    `Nothing to import yet; this is expected, not a failure.`
  )
}

/** Result of a lightweight provider health probe. */
export interface WeatherProviderHealth {
  ok: boolean
  /** HTTP status when the probe reached the API; null on a connection error. */
  status: number | null
  /** Round-trip latency of the probe request, in milliseconds. */
  latencyMs: number
  /** Number of forecast periods the probe received (0 on failure). */
  periods: number
  /** Machine-usable failure reason, or null when healthy. */
  error: string | null
}

/** A stable, well-known coordinate for the probe (Trump National Doral). */
const PROBE_COORDINATE = { latitude: 25.8181219, longitude: -80.3467972 } as const

/**
 * Probe OpenWeather with a single real forecast request for a fixed coordinate.
 * Used by the admin System Health page to show provider status without waiting
 * for a scheduled import. Never throws — a failure is returned as `ok: false`
 * with a redacted reason so the page can render it safely.
 */
export async function probeWeatherProvider(
  client?: OpenWeatherClient,
): Promise<WeatherProviderHealth> {
  const startedAt = Date.now()
  try {
    // Construct inside the try: `fromEnv()` throws synchronously when the API
    // key is unset, and that must surface as a health failure, not an exception.
    const owm = client ?? OpenWeatherClient.fromEnv()
    const forecast = await owm.fetchForecast(PROBE_COORDINATE)
    return {
      ok: true,
      status: 200,
      latencyMs: Date.now() - startedAt,
      periods: forecast.list?.length ?? 0,
      error: null,
    }
  } catch (error) {
    const status =
      error && typeof error === "object" && "details" in error
        ? ((error.details as { status?: number } | undefined)?.status ?? null)
        : null
    return {
      ok: false,
      status,
      latencyMs: Date.now() - startedAt,
      periods: 0,
      error: error instanceof Error ? error.message : "Provider probe failed.",
    }
  }
}

/** Map a raw OpenWeather envelope into a snapshot ready for the repository. */
function toSnapshotInput(
  tournamentId: string,
  courseId: string,
  latitude: number,
  longitude: number,
  forecast: OwmForecastResponse,
): WeatherSnapshotInput {
  const entries = forecast.list ?? []
  const periods = entries.map(toPeriodInput)
  const times = periods.map((p) => p.forecastTime.getTime()).filter((t) => Number.isFinite(t))

  return {
    tournamentId,
    courseId,
    source: "openweather",
    latitude,
    longitude,
    utcOffsetSeconds: forecast.city?.timezone ?? 0,
    capturedAt: new Date(),
    forecastStart: times.length ? new Date(Math.min(...times)) : null,
    forecastEnd: times.length ? new Date(Math.max(...times)) : null,
    periods,
  }
}

/** Map one raw 3-hour bucket into a normalized period (values only when present). */
function toPeriodInput(entry: OwmForecastEntry): WeatherPeriodInput {
  const weather = entry.weather?.[0]
  return {
    forecastTime: new Date(entry.dt * 1000),
    temperatureC: numeric(entry.main?.temp),
    feelsLikeC: numeric(entry.main?.feels_like),
    windSpeedMs: numeric(entry.wind?.speed),
    windGustMs: numeric(entry.wind?.gust),
    windDeg: integer(entry.wind?.deg),
    precipProbability: numeric(entry.pop),
    rainMm: numeric(entry.rain?.["3h"]),
    humidity: integer(entry.main?.humidity),
    cloudCover: integer(entry.clouds?.all),
    pressureHpa: integer(entry.main?.pressure),
    visibilityM: integer(entry.visibility),
    conditionCode: integer(weather?.id),
    conditionLabel: weather?.main ?? null,
  }
}

function numeric(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function integer(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null
}
