import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runFantasyImport } from "@/lib/imports"

/**
 * Fantasy & DFS import trigger.
 *
 * This is the entry point that was MISSING: every other intelligence feed
 * (players, tournaments, fields, statistics, odds) had a privileged route that
 * invoked its runner, but the fantasy/DFS pipeline had none — so
 * `runFantasyImport()` was never called and both `fantasy_projections` and
 * `dfs_salaries` stayed empty even though the pipeline itself is complete.
 *
 * The runner drives SportsDataIO's per-tournament projections and DFS slates
 * (Provider → Mapper → id bridges → Repository). DFS salaries are REAL provider
 * data and are persisted as-is (a missing salary is null, never fabricated);
 * projection VALUES scrambled by the trial tier are stored `available:false`
 * with null points so nothing fake is surfaced. Run this AFTER the tournament
 * and player imports so the id bridges resolve. Idempotent — each row
 * reconciles on its composite provider `externalId`, so it is safe to trigger
 * on a schedule or on demand.
 *
 * Optional JSON body: `{ "tournamentExternalIds": ["<sdioTournamentId>", …] }`
 * to import a specific set of tournaments; when omitted every catalog
 * tournament that bridges to a provider id is imported.
 */
export const maxDuration = 300
export const dynamic = "force-dynamic"

/** Parse an optional `tournamentExternalIds` array of non-empty strings. */
async function parseTournamentExternalIds(
  request: Request,
): Promise<string[] | undefined> {
  try {
    const body = (await request.json()) as unknown
    if (body && typeof body === "object" && "tournamentExternalIds" in body) {
      const raw = (body as { tournamentExternalIds: unknown }).tournamentExternalIds
      if (Array.isArray(raw)) {
        const ids = raw
          .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
          .filter((s) => s.length > 0)
        if (ids.length > 0) return ids
      }
    }
  } catch {
    // No/!JSON body — fall back to importing every bridgeable tournament.
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
    const tournamentExternalIds = await parseTournamentExternalIds(request)
    const summary = await runFantasyImport(tournamentExternalIds)

    // A run "succeeds" as an operation even when some rows fail to persist;
    // surface the headline counts plus any notes so the caller can act.
    return NextResponse.json(
      {
        ok: summary.projectionsFailed === 0 && summary.salariesFailed === 0,
        summary: {
          entity: "fantasy",
          provider: "sportsdataio",
          tournamentsProcessed: summary.tournamentsProcessed,
          projectionsSeen: summary.projectionsSeen,
          projectionsInserted: summary.projectionsInserted,
          projectionsUpdated: summary.projectionsUpdated,
          projectionsFailed: summary.projectionsFailed,
          projectionsAvailable: summary.projectionsAvailable,
          projectionsScrambled: summary.projectionsScrambled,
          salariesSeen: summary.salariesSeen,
          salariesInserted: summary.salariesInserted,
          salariesUpdated: summary.salariesUpdated,
          salariesFailed: summary.salariesFailed,
        },
        notes: summary.notes.slice(0, 50),
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
