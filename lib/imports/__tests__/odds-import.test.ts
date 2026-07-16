/**
 * Unit tests for the pure odds import helpers, exercised against a *real* The
 * Odds API fixture (The Open Championship outrights, 5 US books). These lock:
 *   - tournament matching is conservative (right link or no link, never wrong),
 *   - quotes are built only from verified prices and derive American/implied,
 *   - player linkage is by deterministic slug.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import type { OddsApiEvent } from "@/lib/providers/odds/types"
import {
  buildQuotesForEvent,
  matchTournament,
  type TournamentMatchCandidate,
} from "../odds-import"

const fixture: OddsApiEvent[] = JSON.parse(
  readFileSync(
    join(__dirname, "../../odds-intelligence/__tests__/fixtures/open-championship-outrights.json"),
    "utf-8",
  ),
)
const event = fixture[0]

describe("matchTournament", () => {
  const open: TournamentMatchCandidate = {
    id: "t-open",
    name: "The Open Championship",
    slug: "the-open-championship",
    startDate: new Date("2026-07-16T00:00:00Z"),
    endDate: new Date("2026-07-19T23:59:59Z"),
  }
  const masters: TournamentMatchCandidate = {
    id: "t-masters",
    name: "Masters Tournament",
    slug: "masters-tournament",
    startDate: new Date("2026-04-09T00:00:00Z"),
    endDate: new Date("2026-04-12T23:59:59Z"),
  }

  it("links the event to the tournament whose name matches", () => {
    expect(matchTournament(event, [masters, open])).toBe("t-open")
  })

  it("returns null when no candidate name matches", () => {
    expect(matchTournament(event, [masters])).toBeNull()
  })

  it("returns null for an empty/blank key and title", () => {
    expect(
      matchTournament({ sport_key: "", sport_title: "", commence_time: "" }, [open]),
    ).toBeNull()
  })

  it("does not match on a single shared short word", () => {
    const genericChampionship: TournamentMatchCandidate = {
      id: "t-x",
      name: "X",
      slug: "champ",
      startDate: null,
      endDate: null,
    }
    expect(matchTournament(event, [genericChampionship])).toBeNull()
  })
})

describe("buildQuotesForEvent", () => {
  it("builds verified quotes across all books and derives fields", () => {
    const { quotes, bookmakers } = buildQuotesForEvent(event, new Map())
    // 5 books in the fixture.
    expect(bookmakers.size).toBe(5)
    expect(quotes.length).toBeGreaterThan(0)
    // Every quote is a real, valid price under the winner market.
    for (const q of quotes) {
      expect(q.market).toBe("TOURNAMENT_WINNER")
      expect(q.decimalOdds).toBeGreaterThan(1)
      expect(Number.isFinite(q.americanOdds)).toBe(true)
      expect(q.impliedProbability).toBeGreaterThan(0)
      expect(q.impliedProbability).toBeLessThanOrEqual(1)
    }
  })

  it("resolves player ids by deterministic name slug", () => {
    const playerIdBySlug = new Map([["scottie-scheffler", "p-scheffler"]])
    const { quotes } = buildQuotesForEvent(event, playerIdBySlug)
    const scheffler = quotes.filter((q) => q.selectionSlug === "scottie-scheffler")
    expect(scheffler.length).toBeGreaterThan(0)
    expect(scheffler.every((q) => q.playerId === "p-scheffler")).toBe(true)
    // Unmatched selections stay null (honest, not dropped).
    const others = quotes.filter((q) => q.selectionSlug !== "scottie-scheffler")
    expect(others.every((q) => q.playerId === null)).toBe(true)
  })
})
