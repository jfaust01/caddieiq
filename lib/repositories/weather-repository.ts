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

import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client"

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

/**
 * A tournament's venue + schedule facts, used to (a) locate a forecast lookup
 * for the importer and (b) label forecast days as practice / round-N for the
 * engine. `latitude`/`longitude` are `null` when the host course has no
 * coordinates — the importer then reports weather as unavailable rather than
 * fetching for a fabricated location.
 */
export interface WeatherVenueRow {
  tournamentId: string
  tournamentName: string
  courseId: string | null
  courseName: string | null
  latitude: number | null
  longitude: number | null
  /**
   * Precision of the exposed coordinate: `VERIFIED` (course-precise) or
   * `APPROXIMATE` (city-level). `null` when no usable coordinate exists. Lets
   * consumers surface a city-level forecast honestly rather than implying
   * course precision.
   */
  coordinateConfidence: "VERIFIED" | "APPROXIMATE" | null
  startDate: Date | null
  endDate: Date | null
  numberOfRounds: number
}

/** Outcome of one tournament's weather import attempt (mirrors the DB enum). */
export type WeatherImportResultCode = "STORED" | "SKIPPED" | "FAILED"

/** A per-tournament weather import log row to persist. */
export interface WeatherImportLogInput {
  importRunId?: string | null
  tournamentId: string
  tournamentName: string
  courseId?: string | null
  courseName?: string | null
  latitude?: number | null
  longitude?: number | null
  forecastEligible: boolean
  providerResponse?: string | null
  rowsInserted?: number
  rowsUpdated?: number
  periodsWritten?: number
  skippedReason?: string | null
  durationMs?: number
  result: WeatherImportResultCode
}

/** A per-tournament weather import log row, flattened for status/health reads. */
export interface WeatherImportLogRow {
  id: string
  tournamentId: string
  tournamentName: string
  courseName: string | null
  forecastEligible: boolean
  result: WeatherImportResultCode
  providerResponse: string | null
  skippedReason: string | null
  durationMs: number
  createdAt: Date
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
   * A tournament's venue coordinates and schedule, resolved from its linked host
   * course. Returns `null` for a missing/soft-deleted tournament.
   *
   * Coordinates are surfaced when the host course has a usable coordinate —
   * `coordinateConfidence IN ('VERIFIED','APPROXIMATE')`. A regional weather
   * forecast is adequate at city precision, so both tiers are accepted; the
   * exposed `coordinateConfidence` tells the caller which it got so a city-level
   * forecast can be labelled honestly. For any other confidence (UNKNOWN, or
   * the reserved ESTIMATED) `latitude`/`longitude`/`coordinateConfidence` come
   * back `null`. This remains the enforcement point for the rule that weather is
   * never fetched from an un-located or fabricated venue — with no coordinate
   * the importer has nothing to fetch and the engine reports the event as
   * awaiting coordinates. The id is bound, never interpolated. Read-only.
   */
  async findWeatherVenueById(tournamentId: string): Promise<WeatherVenueRow | null> {
    const rows = await this.prisma.$queryRaw<WeatherVenueRow[]>(Prisma.sql`
      SELECT
        t.id                AS "tournamentId",
        t.name              AS "tournamentName",
        t."startDate"       AS "startDate",
        t."endDate"         AS "endDate",
        t."numberOfRounds"  AS "numberOfRounds",
        course.id                    AS "courseId",
        course.name                  AS "courseName",
        course.latitude              AS "latitude",
        course.longitude             AS "longitude",
        course."coordinateConfidence" AS "coordinateConfidence"
      FROM tournaments t
      LEFT JOIN LATERAL (
        SELECT
          c.id,
          c.name,
          -- Accept course-precise (VERIFIED) and city-level (APPROXIMATE)
          -- coordinates; expose NULL for anything else so weather degrades to
          -- "awaiting coordinates" instead of using un-located data.
          CASE WHEN c."coordinateConfidence" IN ('VERIFIED','APPROXIMATE') THEN c.latitude END  AS latitude,
          CASE WHEN c."coordinateConfidence" IN ('VERIFIED','APPROXIMATE') THEN c.longitude END AS longitude,
          CASE WHEN c."coordinateConfidence" IN ('VERIFIED','APPROXIMATE') THEN c."coordinateConfidence" END AS "coordinateConfidence"
        FROM tournament_courses tc
        JOIN courses c ON c.id = tc."courseId" AND c."deletedAt" IS NULL
        WHERE tc."tournamentId" = t.id
        -- Prefer the host course, then a course-precise coordinate over a
        -- city-level one, so the best available venue wins.
        ORDER BY tc."hostCourse" DESC,
                 CASE c."coordinateConfidence" WHEN 'VERIFIED' THEN 0 WHEN 'APPROXIMATE' THEN 1 ELSE 2 END,
                 c.name ASC
        LIMIT 1
      ) course ON true
      WHERE t.id = ${tournamentId} AND t."deletedAt" IS NULL
      LIMIT 1
    `)
    return rows[0] ?? null
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
   * Append a per-tournament weather import log row. Best-effort by design: audit
   * logging must never break an import, so a failure here is swallowed (logged
   * to the repository sink) rather than propagated to the pipeline.
   */
  async createImportLog(input: WeatherImportLogInput): Promise<void> {
    try {
      await this.prisma.weatherImportLog.create({
        data: {
          importRunId: input.importRunId ?? null,
          tournamentId: input.tournamentId,
          tournamentName: input.tournamentName,
          courseId: input.courseId ?? null,
          courseName: input.courseName ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          forecastEligible: input.forecastEligible,
          providerResponse: input.providerResponse ?? null,
          rowsInserted: input.rowsInserted ?? 0,
          rowsUpdated: input.rowsUpdated ?? 0,
          periodsWritten: input.periodsWritten ?? 0,
          skippedReason: input.skippedReason ?? null,
          durationMs: input.durationMs ?? 0,
          result: input.result,
        },
      })
    } catch (error) {
      this.logger.failure(input.tournamentId, "weather import log write failed", {
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * The most recent import log for a tournament (any result), or `null` when the
   * event has never been considered by an import. Drives the Weather Status
   * Engine's "did the last attempt fail?" branch and the tournament page's
   * last-attempt summary.
   */
  async findLatestImportLog(tournamentId: string): Promise<WeatherImportLogRow | null> {
    const row = await this.prisma.weatherImportLog.findFirst({
      where: { tournamentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tournamentId: true,
        tournamentName: true,
        courseName: true,
        forecastEligible: true,
        result: true,
        providerResponse: true,
        skippedReason: true,
        durationMs: true,
        createdAt: true,
      },
    })
    return row as WeatherImportLogRow | null
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
