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
import type { WeatherIntelligence, WeatherRawPeriod, WeatherVenue } from "./types"

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
      return unavailableIntelligence(
        [{ code: "tournament-not-found" }],
        "This tournament could not be found, so no weather context is available.",
      )
    }

    const venueMeta = venueDisplay(venue)

    // No linked venue coordinates → we will not fetch or fabricate a location.
    if (venue.latitude === null || venue.longitude === null) {
      return unavailableIntelligence(
        [{ code: venue.courseId ? "course-missing-coordinates" : "no-host-course" }],
        venue.courseId
          ? "The host course has no coordinates yet, so a forecast cannot be located."
          : "No host course is linked to this tournament, so a forecast cannot be located.",
        venueMeta,
      )
    }

    const snapshot = await this.repo.findByTournamentId(tournamentId)

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
        )
      }
      return unavailableIntelligence(
        [{ code: "no-snapshot" }],
        "No forecast has been imported for this tournament yet.",
        venueMeta,
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
}

/**
 * OpenWeather's free 5-day/3-hour forecast reaches ~5 days out. Events beyond
 * this simply have no forecast yet (expected), rather than a missing import.
 * Kept in sync with the importer's selection horizon intent.
 */
const FORECAST_HORIZON_DAYS = 5

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
