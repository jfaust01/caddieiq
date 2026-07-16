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

/** OpenWeather free forecast reaches ~5 days out; only near events are useful. */
const DEFAULT_HORIZON_DAYS = 8

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

  const summary: WeatherImportSummary = {
    tournamentsConsidered: 0,
    fetched: 0,
    stored: 0,
    storedCityLevel: 0,
    skippedNoCourse: 0,
    skippedNoCoordinates: 0,
    failed: 0,
    periodsStored: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  const tournamentIds = await resolveTournamentIds(prisma, options.tournamentIds)
  summary.tournamentsConsidered = tournamentIds.length

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
