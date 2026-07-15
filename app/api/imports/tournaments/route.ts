import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runTournamentImport } from "@/lib/imports"

/**
 * Tournament import trigger.
 *
 * Mirrors the player import route: the four import layers (SportsDataIO
 * provider → domain mapper → data quality → repository) were built and exported
 * via `runTournamentImport()`, but no entry point invoked them, so no
 * tournament ever reached the database. This route is that entry point.
 *
 * Unlike players, tournaments carry a required `tourId` foreign key that the
 * base mapping does not supply. `runTournamentImport()` resolves that (and the
 * optional season link) from reference data before persisting — see
 * `lib/imports/tournament-relations.ts`.
 */
export const maxDuration = 300
export const dynamic = "force-dynamic"

export async function POST(): Promise<NextResponse> {
  // Importing rewrites shared reference data, so it is a privileged action:
  // require an authenticated session.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runTournamentImport()

    // A run "succeeds" as an operation even when some rows fail; surface both
    // the headline counts and any per-item errors so the caller can act.
    return NextResponse.json(
      {
        ok: result.failed === 0,
        summary: {
          provider: result.provider,
          entity: result.entity,
          durationMs: result.durationMs,
          processed: result.processed,
          mapped: result.mapped,
          validated: result.validated,
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
          failed: result.failed,
          warnings: result.warnings,
          qualityScoreAverage: result.qualityScoreAverage,
        },
        errors: result.errors.slice(0, 50),
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
