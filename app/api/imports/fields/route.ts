import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runFieldImport } from "@/lib/imports"

/**
 * Tournament field import trigger.
 *
 * Wires the Tournament ↔ Player relationship: for every tournament already in
 * our database it fetches the SportsDataIO leaderboard, maps + validates each
 * entrant, resolves the player by slug, and upserts a `tournament_fields` join
 * row. Run this AFTER the player and tournament imports have populated their
 * tables — entries only link to players that already exist.
 *
 * Unlike the entity imports this drives one pipeline per tournament, so it can
 * be long-running; `maxDuration` is raised accordingly.
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
    const summary = await runFieldImport()
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
