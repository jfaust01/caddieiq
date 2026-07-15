import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runPlayerImport } from "@/lib/imports"

/**
 * Player import trigger.
 *
 * This is the wiring that was previously missing: the four import layers
 * (SportsDataIO provider → domain mapper → data quality → repository) were all
 * built and exported via `runPlayerImport()`, but nothing ever invoked them, so
 * no player data ever reached the database. This route is that entry point.
 *
 * A full import fetches the entire player universe and upserts it, so it runs
 * well beyond the default serverless budget — request a long duration.
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
    const result = await runPlayerImport()

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
