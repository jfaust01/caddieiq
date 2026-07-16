import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runWeatherImport } from "@/lib/imports"

/**
 * Weather import trigger — the previously-missing entry point that actually
 * runs the Weather Intelligence pipeline.
 *
 * Before this route existed, `runWeatherImport()` was defined but never invoked
 * by anything (no cron, no route, no action), so `weather_snapshots` /
 * `weather_periods` stayed empty no matter how healthy the pipeline was. This
 * route closes that gap with two authorized callers:
 *
 *   - GET  → the Vercel Cron scheduler (see `vercel.json`), authorized by a
 *            `Bearer ${CRON_SECRET}` header. Runs the auto window (upcoming and
 *            in-progress events within the forecast horizon).
 *   - POST → a manual admin trigger, authorized by an authenticated session.
 *            Accepts an optional `{ tournamentIds: string[] }` body to refresh
 *            specific events on demand.
 *
 * The run is idempotent: each tournament's snapshot is atomically replaced, so
 * triggering repeatedly is safe. The response echoes the full diagnostic
 * summary — including the honest `emptyReason` when nothing was forecastable —
 * so a no-op run is explained rather than looking like a failure.
 */
export const maxDuration = 300
export const dynamic = "force-dynamic"

/** True when the request carries the correct cron bearer token. */
function hasValidCronSecret(headerList: Headers): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authorization = headerList.get("authorization")
  return authorization === `Bearer ${secret}`
}

/** True when the request is either an admin session or the cron scheduler. */
async function isAuthorized(headerList: Headers): Promise<boolean> {
  if (hasValidCronSecret(headerList)) return true
  const session = await auth.api.getSession({ headers: headerList })
  return Boolean(session)
}

/** Shared runner: execute the import and shape the diagnostic response. */
async function runAndRespond(tournamentIds?: string[]): Promise<NextResponse> {
  try {
    const summary = await runWeatherImport(tournamentIds)
    return NextResponse.json(
      {
        // A run with zero failures is "ok" even when it stored nothing (e.g. no
        // forecastable event yet) — the empty case is expected, not an error.
        ok: summary.failed === 0,
        summary: {
          entity: "weather",
          provider: "openweather",
          selectionMode: summary.selectionMode,
          horizonDays: summary.horizonDays,
          tournamentsConsidered: summary.tournamentsConsidered,
          fetched: summary.fetched,
          stored: summary.stored,
          storedCityLevel: summary.storedCityLevel,
          periodsStored: summary.periodsStored,
          skippedNoCourse: summary.skippedNoCourse,
          skippedNoCoordinates: summary.skippedNoCoordinates,
          failed: summary.failed,
          emptyReason: summary.emptyReason,
        },
        notes: summary.notes.slice(0, 50),
      },
      { status: 200 },
    )
  } catch (error) {
    // A throw here means the run could not start (e.g. missing OPENWEATHER_API_KEY),
    // as opposed to a per-tournament skip which is captured in the summary.
    const message = error instanceof Error ? error.message : "Weather import failed to start."
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  const headerList = await headers()
  if (!(await isAuthorized(headerList))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runAndRespond()
}

export async function POST(request: Request): Promise<NextResponse> {
  const headerList = await headers()
  if (!(await isAuthorized(headerList))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Optional explicit-id refresh; ignore a malformed/empty body and auto-select.
  let tournamentIds: string[] | undefined
  try {
    const body = (await request.json()) as { tournamentIds?: unknown }
    if (Array.isArray(body?.tournamentIds)) {
      tournamentIds = body.tournamentIds.filter((id): id is string => typeof id === "string")
    }
  } catch {
    tournamentIds = undefined
  }

  return runAndRespond(tournamentIds && tournamentIds.length > 0 ? tournamentIds : undefined)
}
