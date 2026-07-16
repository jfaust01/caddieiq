import "server-only"

import {
  getWeatherRepository,
  type WeatherRepository,
  type WeatherSnapshotRow,
  type WeatherVenueRow,
} from "@/lib/repositories"

import {
  buildWeatherIntelligence,
  unavailableIntelligence,
} from "./intelligence"
import { computeWeatherStatus, FORECAST_HORIZON_DAYS } from "./status"
import type { WeatherIntelligence, WeatherRawPeriod, WeatherVenue } from "./types"

/**
 * A serializable summary of a tournament's weather import history, for admin
 * surfaces (the tournament page's refresh control and metadata line). Dates are
 * ISO strings so it crosses the server/client boundary cleanly. Every field is
 * drawn from real rows — `null` means "never", never a fabricated placeholder.
 */
export interface WeatherImportStatus {
  /** When the most recent import *attempt* (any outcome) ran, or null. */
  lastAttemptAt: string | null
  /** Outcome of that most recent attempt, or null when never attempted. */
  lastResult: "STORED" | "SKIPPED" | "FAILED" | null
  /** When conditions were last successfully stored (the snapshot capture), or null. */
  lastSuccessAt: string | null
  /** Compact provider response / error from the last attempt, when present. */
  providerResponse: string | null
  /** Why the last attempt was skipped, when it was a SKIP. */
  skippedReason: string | null
}

/**
 * Weather Intelligence service — the server-only half of the engine.
 *
 * Loads a tournament's stored forecast snapshot and venue/schedule from the
 * Weather Repository, then runs the pure {@link buildWeatherIntelligence} core.
 * It performs no HTTP and no grading of its own; all judgement lives in the pure
 * layer. Honest by construction: an unknown tournament, a venue with no
 * coordinates, or a tournament with no imported snapshot each yields an
 * `unavailable` intelligence carrying machine-readable gaps — never a fabricated
 * forecast.
 *
 * Mirrors the Course Intelligence service (keyed by courseId): this one is keyed
 * by tournamentId, the natural key for an event's conditions.
 */
export class WeatherIntelligenceService {
  constructor(private readonly repo: WeatherRepository = getWeatherRepository()) {}

  /**
   * The confidence-graded Weather Intelligence for a tournament. Never throws
   * for missing data — returns an `unavailable` profile with the reason instead.
   */
  async getForTournament(tournamentId: string): Promise<WeatherIntelligence> {
    const venue = await this.repo.findWeatherVenueById(tournamentId)

    if (!venue) {
      // A tournament that does not exist has no timing, so the status engine is
      // not meaningful here — the default (coordinates-unavailable) is honest.
      return unavailableIntelligence(
        [{ code: "tournament-not-found" }],
        "This tournament could not be found, so no weather context is available.",
      )
    }

    const venueMeta = venueDisplay(venue)
    const hasCoordinates = venue.latitude !== null && venue.longitude !== null

    // Load the latest per-tournament import log so status can distinguish a
    // *failed* last attempt from one that simply has not run yet.
    const latestLog = await this.repo.findLatestImportLog(tournamentId)
    const snapshot = hasCoordinates ? await this.repo.findByTournamentId(tournamentId) : null
    const hasSnapshot = Boolean(snapshot && snapshot.periods.length > 0)

    // The single source of lifecycle truth, shared by every unavailable branch
    // (and recomputed inside the pure core for the available branch).
    const statusReport = computeWeatherStatus({
      startDate: venue.startDate,
      endDate: venue.endDate,
      hasCoordinates,
      hasSnapshot,
      lastImportFailed: latestLog?.result === "FAILED",
      providerSupportsHistorical: false,
    })

    // No linked venue coordinates → we will not fetch or fabricate a location.
    if (!hasCoordinates) {
      return unavailableIntelligence(
        [{ code: venue.courseId ? "course-missing-coordinates" : "no-host-course" }],
        venue.courseId
          ? "The host course has no coordinates yet, so a forecast cannot be located."
          : "No host course is linked to this tournament, so a forecast cannot be located.",
        venueMeta,
        statusReport,
      )
    }

    if (!snapshot || snapshot.periods.length === 0) {
      // Distinguish "expected — the event is still off in the future" from
      // "the import is missing/late." A located venue with a start date beyond
      // the provider's useful forecast reach simply has no snapshot yet, and
      // that is normal, not a failure.
      const daysOut = daysUntil(venue.startDate)
      if (daysOut !== null && daysOut > FORECAST_HORIZON_DAYS) {
        return unavailableIntelligence(
          [{ code: "beyond-forecast-horizon", detail: String(daysOut) }],
          `This event starts in ${daysOut} days, beyond the ~${FORECAST_HORIZON_DAYS}-day forecast horizon. The forecast will populate automatically as the event approaches.`,
          venueMeta,
          statusReport,
        )
      }
      return unavailableIntelligence(
        [{ code: "no-snapshot" }],
        "No forecast has been imported for this tournament yet.",
        venueMeta,
        statusReport,
      )
    }

    return buildWeatherIntelligence({
      venue: {
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        utcOffsetSeconds: snapshot.utcOffsetSeconds,
      },
      displayVenue: venueMeta,
      source: snapshot.source,
      capturedAt: snapshot.capturedAt,
      forecastStart: snapshot.forecastStart,
      forecastEnd: snapshot.forecastEnd,
      periods: snapshot.periods.map(toRawPeriod),
      schedule: {
        startDate: venue.startDate,
        endDate: venue.endDate,
        numberOfRounds: venue.numberOfRounds,
      },
    })
  }

  /**
   * The tournament's weather import history summary, for admin surfaces. Every
   * field is drawn from real rows — the latest per-tournament log for the last
   * *attempt*, and the stored snapshot's capture time for the last *success*.
   * Returns all-null when the event has never been imported.
   */
  async getWeatherImportStatus(tournamentId: string): Promise<WeatherImportStatus> {
    const [latestLog, lastSuccessAt] = await Promise.all([
      this.repo.findLatestImportLog(tournamentId),
      this.repo.getCapturedAt(tournamentId),
    ])
    return {
      lastAttemptAt: latestLog?.createdAt.toISOString() ?? null,
      lastResult: latestLog?.result ?? null,
      lastSuccessAt: lastSuccessAt?.toISOString() ?? null,
      providerResponse: latestLog?.providerResponse ?? null,
      skippedReason: latestLog?.skippedReason ?? null,
    }
  }
}

/** Whole days from now until `date` (future positive); null when no date. */
function daysUntil(date: Date | null): number | null {
  if (!date) return null
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000)
}

/** Build the display venue block from the tournament's linked course. */
function venueDisplay(venue: WeatherVenueRow): WeatherVenue {
  return {
    courseId: venue.courseId,
    courseName: venue.courseName,
    latitude: venue.latitude,
    longitude: venue.longitude,
  }
}

/** Widen a stored period row to the engine's raw-period input shape. */
function toRawPeriod(p: WeatherSnapshotRow["periods"][number]): WeatherRawPeriod {
  return {
    forecastTime: p.forecastTime,
    temperatureC: p.temperatureC,
    feelsLikeC: p.feelsLikeC,
    windSpeedMs: p.windSpeedMs,
    windGustMs: p.windGustMs,
    windDeg: p.windDeg,
    precipProbability: p.precipProbability,
    rainMm: p.rainMm,
    humidity: p.humidity,
    cloudCover: p.cloudCover,
    pressureHpa: p.pressureHpa,
    visibilityM: p.visibilityM,
    conditionCode: p.conditionCode,
    conditionLabel: p.conditionLabel,
  }
}

/**
 * Shared default instance. Lazily constructed so importing this module never
 * forces a database connection.
 */
let _weatherIntelligenceService: WeatherIntelligenceService | undefined
export function getWeatherIntelligenceService(): WeatherIntelligenceService {
  return (_weatherIntelligenceService ??= new WeatherIntelligenceService())
}
