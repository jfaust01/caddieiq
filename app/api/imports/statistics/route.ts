import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runStatisticsImport } from "@/lib/imports"

/**
 * Player season-statistics import trigger.
 *
 * Attaches season-level performance to existing players: for each requested
 * season it fetches SportsDataIO's `PlayerSeasonStats`, maps + validates each
 * row, resolves the player by slug, and upserts a `player_season_statistics`
 * row keyed on `(playerId, season)`. Run this AFTER the player import has
 * populated the catalog — rows only link to players that already exist.
 *
 * Optional JSON body: `{ "seasons": [2024, 2025] }` to override the default
 * season set. Drives one pipeline per season, so it can be long-running;
 * `maxDuration` is raised accordingly.
 */
export const maxDuration = 300
export const dynamic = "force-dynamic"

/** Parse an optional `seasons` array of plausible year integers from the body. */
async function parseSeasons(request: Request): Promise<number[] | undefined> {
  try {
    const body = (await request.json()) as unknown
    if (body && typeof body === "object" && "seasons" in body) {
      const raw = (body as { seasons: unknown }).seasons
      if (Array.isArray(raw)) {
        const seasons = raw
          .map((v) => Number(v))
          .filter((n) => Number.isInteger(n) && n >= 1990 && n <= 2100)
        if (seasons.length > 0) return seasons
      }
    }
  } catch {
    // No/!JSON body — fall back to the default season set.
  }
  return undefined
}

export async function POST(request: Request): Promise<NextResponse> {
  // Importing rewrites shared reference data, so it is a privileged action:
  // require an authenticated session.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const seasons = await parseSeasons(request)
    const summary = await runStatisticsImport(seasons)
    return NextResponse.json(
      {
        ok: summary.failed === 0,
        summary,
      },
      { status: 200 },
    )
  } catch (error) {
    // A thrown error here means the run could not start (e.g. missing provider
    // credentials) rather than a per-item failure.
    const message = error instanceof Error ? error.message : "Import failed to start."
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
