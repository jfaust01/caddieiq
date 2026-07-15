/**
 * Weather repository.
 *
 * The only layer permitted to persist and read weather forecast snapshots
 * (tables `weather_snapshots`, `weather_periods`). It accepts already-normalized
 * forecast rows from the weather importer — it never calls OpenWeather, maps raw
 * payloads, or grades confidence. One snapshot per tournament: re-importing
 * atomically replaces the snapshot and its periods so a tournament never carries
 * two competing forecasts.
 */

import type { PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type RepositoryResult } from "./repository-result"

/** A single normalized forecast period to persist (all optional but time). */
export interface WeatherPeriodInput {
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

/** A full snapshot to persist for one tournament. */
export interface WeatherSnapshotInput {
  tournamentId: string
  courseId: string | null
  source: string
  latitude: number
  longitude: number
  utcOffsetSeconds: number
  capturedAt: Date
  forecastStart: Date | null
  forecastEnd: Date | null
  periods: WeatherPeriodInput[]
}

/** A stored period row as read back for the intelligence engine. */
export interface WeatherPeriodRow {
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

/** A stored snapshot with its ordered periods. */
export interface WeatherSnapshotRow {
  tournamentId: string
  courseId: string | null
  source: string
  latitude: number
  longitude: number
  utcOffsetSeconds: number
  capturedAt: Date
  forecastStart: Date | null
  forecastEnd: Date | null
  periodCount: number
  periods: WeatherPeriodRow[]
}

const PERIOD_SELECT = {
  forecastTime: true,
  temperatureC: true,
  feelsLikeC: true,
  windSpeedMs: true,
  windGustMs: true,
  windDeg: true,
  precipProbability: true,
  rainMm: true,
  humidity: true,
  cloudCover: true,
  pressureHpa: true,
  visibilityM: true,
  conditionCode: true,
  conditionLabel: true,
} as const

export class WeatherRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "weather", sink)
  }

  /**
   * The latest forecast snapshot for a tournament with its periods ordered by
   * forecast time, or `null` when none has been imported. Read-only — the
   * caller (Weather Intelligence engine) grades and normalizes it.
   */
  async findByTournamentId(tournamentId: string): Promise<WeatherSnapshotRow | null> {
    const snapshot = await this.prisma.weatherSnapshot.findUnique({
      where: { tournamentId },
      select: {
        tournamentId: true,
        courseId: true,
        source: true,
        latitude: true,
        longitude: true,
        utcOffsetSeconds: true,
        capturedAt: true,
        forecastStart: true,
        forecastEnd: true,
        periodCount: true,
        periods: {
          orderBy: { forecastTime: "asc" },
          select: PERIOD_SELECT,
        },
      },
    })
    return snapshot as WeatherSnapshotRow | null
  }

  /**
   * When a tournament's forecast was last captured, or `null` if never. Cheap
   * probe the importer uses to decide whether a refresh is due, without reading
   * the full period set.
   */
  async getCapturedAt(tournamentId: string): Promise<Date | null> {
    const row = await this.prisma.weatherSnapshot.findUnique({
      where: { tournamentId },
      select: { capturedAt: true },
    })
    return row?.capturedAt ?? null
  }

  /**
   * Atomically replace a tournament's forecast: upsert the snapshot and swap in
   * a fresh set of periods in a single transaction. Guarantees a tournament
   * never has a partially-updated forecast or two competing snapshots.
   */
  async replaceSnapshot(input: WeatherSnapshotInput): Promise<RepositoryResult<WeatherSnapshotRow>> {
    const reference = input.tournamentId
    try {
      await this.prisma.$transaction(async (tx) => {
        const snapshot = await tx.weatherSnapshot.upsert({
          where: { tournamentId: input.tournamentId },
          create: {
            tournamentId: input.tournamentId,
            courseId: input.courseId,
            source: input.source,
            latitude: input.latitude,
            longitude: input.longitude,
            utcOffsetSeconds: input.utcOffsetSeconds,
            capturedAt: input.capturedAt,
            forecastStart: input.forecastStart,
            forecastEnd: input.forecastEnd,
            periodCount: input.periods.length,
          },
          update: {
            courseId: input.courseId,
            source: input.source,
            latitude: input.latitude,
            longitude: input.longitude,
            utcOffsetSeconds: input.utcOffsetSeconds,
            capturedAt: input.capturedAt,
            forecastStart: input.forecastStart,
            forecastEnd: input.forecastEnd,
            periodCount: input.periods.length,
          },
          select: { id: true },
        })

        // Swap periods wholesale: clear the old set, then insert the new one.
        await tx.weatherPeriod.deleteMany({ where: { snapshotId: snapshot.id } })
        if (input.periods.length > 0) {
          await tx.weatherPeriod.createMany({
            data: input.periods.map((p) => ({ snapshotId: snapshot.id, ...p })),
          })
        }
      })

      this.logger.update(reference)
      const stored = await this.findByTournamentId(input.tournamentId)
      if (!stored) {
        return fail<WeatherSnapshotRow>(
          toRepositoryError(new Error("Snapshot vanished after write"), {
            entity: "weatherSnapshot",
            operation: "replaceSnapshot",
            reference,
          }),
        )
      }
      return ok(stored, "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "weatherSnapshot",
        operation: "replaceSnapshot",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<WeatherSnapshotRow>(repoError)
    }
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _weatherRepository: WeatherRepository | undefined
export function getWeatherRepository(): WeatherRepository {
  return (_weatherRepository ??= new WeatherRepository())
}
