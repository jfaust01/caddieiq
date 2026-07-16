import "server-only"

import { probeWeatherProvider, type WeatherProviderHealth } from "@/lib/imports/weather-import"
import { prisma } from "@/lib/prisma"

/** OpenWeather's free forecast reach; mirrors the importer/service horizon. */
const FORECAST_HORIZON_DAYS = 5
const DAY_MS = 86_400_000

/** A single recent weather import run, flattened for display. */
export interface WeatherRunSummary {
  id: string
  status: string
  startedAt: string
  durationMs: number
  processed: number
  updated: number
  skipped: number
  failed: number
  summary: string | null
  error: string | null
}

/** Whether the scheduled trigger is wired and able to authorize. */
export interface SchedulerHealth {
  /** A cron entry for the weather route exists in vercel.json. */
  scheduleConfigured: boolean
  /** The cron expression, when configured. */
  cronExpression: string | null
  /** CRON_SECRET is present so scheduled calls can authorize. */
  secretConfigured: boolean
}

/** A forecastable event and whether its host venue is ready for weather. */
export interface ForecastableTournament {
  id: string
  name: string
  startDate: string
  daysOut: number
  hostCourseName: string | null
  coordinateConfidence: "VERIFIED" | "APPROXIMATE" | null
  hasSnapshot: boolean
}

/**
 * Aggregate coverage + throughput stats for the current forecast window. Derived
 * from the forecastable set and the recent per-tournament import logs — every
 * count is real, never a placeholder.
 */
export interface WeatherWindowStats {
  /** Forecast window bounds (inclusive of a small past grace) as ISO strings. */
  windowStart: string
  windowEnd: string
  horizonDays: number
  /** Events inside the window (the total the importer should be covering). */
  eligible: number
  /** Eligible events that currently have a stored forecast snapshot. */
  imported: number
  /** Eligible events skipped last import (unlocated venue, still fresh, etc.). */
  skipped: number
  /** Eligible events with no snapshot yet (imported + uncovered = eligible). */
  uncovered: number
  /**
   * Average wall-clock duration of a *stored* per-tournament import over the
   * recent sample, in milliseconds, or null when nothing has been stored yet.
   */
  avgImportDurationMs: number | null
  /** Number of per-tournament log rows the average was computed over. */
  durationSampleSize: number
}

/** The next scheduled importer execution, computed from the cron expression. */
export interface NextScheduledRun {
  /** ISO timestamp of the next fire time (UTC), or null when unschedulable. */
  at: string | null
  /** Whole hours from now until the next run, or null. */
  inHours: number | null
}

/** The full weather subsystem health snapshot. */
export interface WeatherHealthReport {
  generatedAt: string
  scheduler: SchedulerHealth
  provider: WeatherProviderHealth
  rows: { snapshots: number; periods: number }
  lastRun: WeatherRunSummary | null
  recentRuns: WeatherRunSummary[]
  /** Events within the forecast horizon — the set the importer should cover. */
  forecastable: ForecastableTournament[]
  /** Aggregate coverage + throughput for the current forecast window. */
  windowStats: WeatherWindowStats
  /** The next scheduled importer run, computed from the cron entry. */
  nextRun: NextScheduledRun
  /** Nearest upcoming event, to explain an empty window when off-season. */
  nearestUpcoming: { name: string; startDate: string; daysOut: number } | null
}

function flattenRun(run: {
  id: string
  status: string
  startedAt: Date
  durationMs: number
  processed: number
  updated: number
  skipped: number
  failed: number
  summary: string | null
  error: string | null
}): WeatherRunSummary {
  return {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    durationMs: run.durationMs,
    processed: run.processed,
    updated: run.updated,
    skipped: run.skipped,
    failed: run.failed,
    summary: run.summary,
    error: run.error,
  }
}

/**
 * Read the weather cron entry from vercel.json without importing it (it is not a
 * module). Best-effort: a missing/invalid file simply reads as "not configured".
 */
async function readSchedulerConfig(): Promise<{ configured: boolean; expression: string | null }> {
  try {
    const { readFile } = await import("node:fs/promises")
    const { join } = await import("node:path")
    const raw = await readFile(join(process.cwd(), "vercel.json"), "utf8")
    const parsed = JSON.parse(raw) as { crons?: { path: string; schedule: string }[] }
    const entry = parsed.crons?.find((c) => c.path.startsWith("/api/imports/weather"))
    return { configured: Boolean(entry), expression: entry?.schedule ?? null }
  } catch {
    return { configured: false, expression: null }
  }
}

/**
 * Compute the next fire time for a simple daily cron expression of the form
 * `m h * * *` (the shape used for these imports). Returns null for any other
 * shape rather than guessing — the view then shows the raw expression instead.
 * Kept dependency-free and UTC-based so it matches Vercel Cron semantics.
 */
function nextRunFromCron(expression: string | null, from: Date): Date | null {
  if (!expression) return null
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const [minStr, hourStr, dom, mon, dow] = parts
  // Only handle the daily case (fixed minute + hour, wildcard elsewhere).
  if (dom !== "*" || mon !== "*" || dow !== "*") return null
  const minute = Number(minStr)
  const hour = Number(hourStr)
  if (!Number.isInteger(minute) || !Number.isInteger(hour)) return null
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null

  const next = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hour, minute, 0, 0),
  )
  if (next.getTime() <= from.getTime()) next.setUTCDate(next.getUTCDate() + 1)
  return next
}

/**
 * Collect a live, honest health snapshot for the weather subsystem: whether the
 * scheduler is wired, whether the provider responds, how much data exists, the
 * outcome of recent runs, and which forecastable events are (not) yet covered.
 * Every value is read live; nothing is fabricated.
 */
export async function getWeatherHealthReport(): Promise<WeatherHealthReport> {
  const now = Date.now()
  const horizon = new Date(now + FORECAST_HORIZON_DAYS * DAY_MS)

  const [
    schedulerConfig,
    provider,
    snapshots,
    periods,
    recentRunRows,
    forecastableRows,
    nearestRow,
    storedDurationAgg,
  ] = await Promise.all([
    readSchedulerConfig(),
    probeWeatherProvider(),
    prisma.weatherSnapshot.count(),
    prisma.weatherPeriod.count(),
    prisma.importRun.findMany({
      where: { entity: "weather" },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.tournament.findMany({
      where: {
        deletedAt: null,
        status: { not: "CANCELED" },
        startDate: { not: null, gte: new Date(now - DAY_MS), lte: horizon },
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        weatherSnapshot: { select: { id: true } },
        tournamentCourses: {
          where: { hostCourse: true },
          take: 1,
          select: {
            course: { select: { name: true, coordinateConfidence: true } },
          },
        },
      },
    }),
    prisma.tournament.findFirst({
      where: { deletedAt: null, status: { not: "CANCELED" }, startDate: { gt: new Date() } },
      orderBy: { startDate: "asc" },
      select: { name: true, startDate: true },
    }),
    // Average duration of *stored* per-tournament imports over a recent sample,
    // straight from the audit log — a real throughput signal, not an estimate.
    prisma.weatherImportLog.aggregate({
      where: { result: "STORED", createdAt: { gte: new Date(now - 7 * DAY_MS) } },
      _avg: { durationMs: true },
      _count: true,
    }),
  ])

  const recentRuns = recentRunRows.map(flattenRun)

  const forecastable: ForecastableTournament[] = forecastableRows.map((t) => {
    const host = t.tournamentCourses[0]?.course ?? null
    const startDate = t.startDate as Date
    // UNKNOWN (or no host) means "not located" — collapse both to null so the
    // view treats only VERIFIED/APPROXIMATE as an actual, usable coordinate.
    const confidence =
      host?.coordinateConfidence === "VERIFIED" || host?.coordinateConfidence === "APPROXIMATE"
        ? host.coordinateConfidence
        : null
    return {
      id: t.id,
      name: t.name,
      startDate: startDate.toISOString(),
      daysOut: Math.ceil((startDate.getTime() - now) / DAY_MS),
      hostCourseName: host?.name ?? null,
      coordinateConfidence: confidence,
      hasSnapshot: Boolean(t.weatherSnapshot),
    }
  })

  const nearestUpcoming =
    nearestRow?.startDate != null
      ? {
          name: nearestRow.name,
          startDate: nearestRow.startDate.toISOString(),
          daysOut: Math.ceil((nearestRow.startDate.getTime() - now) / DAY_MS),
        }
      : null

  // Coverage + throughput for the current window, all from real rows.
  const imported = forecastable.filter((t) => t.hasSnapshot).length
  const skipped = forecastable.filter((t) => !t.hasSnapshot && t.coordinateConfidence === null).length
  const avgDuration = storedDurationAgg._avg.durationMs
  const windowStats: WeatherWindowStats = {
    windowStart: new Date(now - DAY_MS).toISOString(),
    windowEnd: horizon.toISOString(),
    horizonDays: FORECAST_HORIZON_DAYS,
    eligible: forecastable.length,
    imported,
    skipped,
    uncovered: forecastable.length - imported,
    avgImportDurationMs: avgDuration != null ? Math.round(avgDuration) : null,
    durationSampleSize: storedDurationAgg._count,
  }

  const nextRunAt = nextRunFromCron(schedulerConfig.expression, new Date(now))
  const nextRun: NextScheduledRun = {
    at: nextRunAt?.toISOString() ?? null,
    inHours: nextRunAt ? Math.round((nextRunAt.getTime() - now) / 3_600_000) : null,
  }

  return {
    generatedAt: new Date().toISOString(),
    scheduler: {
      scheduleConfigured: schedulerConfig.configured,
      cronExpression: schedulerConfig.expression,
      secretConfigured: Boolean(process.env.CRON_SECRET),
    },
    provider,
    rows: { snapshots, periods },
    lastRun: recentRuns[0] ?? null,
    recentRuns,
    forecastable,
    windowStats,
    nextRun,
    nearestUpcoming,
  }
}
