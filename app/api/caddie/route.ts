import { NextResponse } from "next/server"

import { askCaddie, routeCaddie } from "@/lib/caddie"
import {
  loadCaddieDataBundle,
  resolvePlayersForQuestion,
} from "@/features/caddie/services/caddie-service"

/**
 * AI Caddie query endpoint.
 *
 * Read-only intelligence: given `{ tournamentId, message }`, it loads the
 * verified engine bundle, resolves any named players (for compare/explain), and
 * runs the deterministic engine. It never mutates data, so it is public like
 * the rest of the tournament hub. Every answer is grounded in engine output or
 * honestly reports missing data — nothing is fabricated here.
 */
export const dynamic = "force-dynamic"

interface CaddieRequestBody {
  tournamentId?: unknown
  message?: unknown
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: CaddieRequestBody
  try {
    body = (await request.json()) as CaddieRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId.trim() : ""
  const message = typeof body.message === "string" ? body.message.trim() : ""

  if (!tournamentId) {
    return NextResponse.json({ error: "A tournamentId is required." }, { status: 400 })
  }
  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 })
  }
  if (message.length > 500) {
    return NextResponse.json({ error: "Message is too long (max 500 characters)." }, { status: 400 })
  }

  try {
    const bundle = await loadCaddieDataBundle(tournamentId)
    if (!bundle) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 })
    }

    // Only resolve players when the question actually needs them.
    const route = routeCaddie(message)
    const needsPlayers = route.intent === "compare_players" || route.intent === "explain_rating"
    const resolvedPlayers = needsPlayers
      ? await resolvePlayersForQuestion(tournamentId, message)
      : []

    const answer = askCaddie(message, bundle, { resolvedPlayers })

    return NextResponse.json({ answer }, { status: 200 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error"
    console.log("[v0] AI Caddie query failed:", detail)
    return NextResponse.json({ error: "The Caddie couldn't answer that right now." }, { status: 500 })
  }
}
