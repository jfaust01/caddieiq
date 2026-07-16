import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { runOddsImport } from "@/lib/imports"

/**
 * Odds import trigger.
 *
 * Mirrors the other import routes: the Odds Intelligence pipeline (The Odds API
 * provider → normalizer → repository, plus tournament/player linking) is
 * exposed via `runOddsImport()`, and this route is the privileged entry point
 * that invokes it. Prices are real bookmaker quotes; the run is idempotent and
 * only overwrites a stored quote when the incoming price is newer, so it is
 * safe to trigger on a schedule or on demand.
 */
export const maxDuration = 300
export const dynamic = "force-dynamic"

export async function POST(): Promise<NextResponse> {
  // Importing rewrites shared market data, so it is a privileged action:
  // require an authenticated session.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const summary = await runOddsImport()

    // A run "succeeds" as an operation even when some events fail to parse;
    // surface the headline counts plus any notes so the caller can act.
    return NextResponse.json(
      {
        ok: summary.failed === 0,
        summary: {
          entity: "odds",
          provider: "the-odds-api",
          sportsConsidered: summary.sportsConsidered,
          eventsSeen: summary.eventsSeen,
          inserted: summary.inserted,
          updated: summary.updated,
          failed: summary.failed,
          linkedToTournament: summary.linkedToTournament,
          quotesBuilt: summary.quotesBuilt,
          quotesLinkedToPlayer: summary.quotesLinkedToPlayer,
          distinctBookmakers: summary.distinctBookmakers,
          quota: summary.quota,
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
