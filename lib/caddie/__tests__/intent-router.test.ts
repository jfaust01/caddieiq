import { describe, expect, it } from "vitest"

import { routeCaddieQuestion as routeCaddie } from "../intent-router"
import type { CaddieIntent } from "../types"

/**
 * The intent router is the front door of the deterministic engine: it must map
 * natural phrasing to the right verified engine, extract player-name fragments
 * for compare/explain, and fall back to `unknown` (not a wrong engine) when it
 * genuinely can't tell.
 */
describe("routeCaddie", () => {
  const cases: ReadonlyArray<readonly [string, CaddieIntent]> = [
    ["Who are the best cash plays this week?", "best_cash_plays"],
    ["give me safe cash game picks", "best_cash_plays"],
    ["best GPP plays for the tournament", "best_gpp_plays"],
    ["who has the highest ceiling for a gpp?", "best_gpp_plays"],
    ["which players are underpriced?", "underpriced"],
    ["show me value plays on the cheap", "underpriced"],
    ["who fits the course best?", "course_fit"],
    ["best course fit for this venue", "course_fit"],
    ["who should I fade this week?", "fades"],
    ["who's in form right now?", "top_form"],
    ["which players are hot lately?", "top_form"],
    ["who are the betting favorites?", "odds_favorites"],
    ["what do the odds say?", "odds_favorites"],
    ["how does the weather affect play?", "weather"],
    ["is it going to be windy?", "weather"],
    ["what can you do?", "capabilities"],
    ["help", "capabilities"],
  ]

  for (const [question, expected] of cases) {
    it(`routes "${question}" → ${expected}`, () => {
      expect(routeCaddie(question).intent).toBe(expected)
    })
  }

  it("classifies a compare question and extracts two name fragments", () => {
    const route = routeCaddie("Compare Scottie Scheffler vs Rory McIlroy")
    expect(route.intent).toBe("compare_players")
    expect(route.params.playerNames.length).toBeGreaterThanOrEqual(2)
  })

  it("classifies an explain-rating question", () => {
    const route = routeCaddie("Why is Xander Schauffele rated so high?")
    expect(route.intent).toBe("explain_rating")
    expect(route.params.playerNames.length).toBeGreaterThanOrEqual(1)
  })

  it("falls back to unknown for off-topic input rather than guessing an engine", () => {
    expect(routeCaddie("what's the capital of France?").intent).toBe("unknown")
  })

  it("is deterministic — same question yields same intent", () => {
    const q = "best cash plays?"
    expect(routeCaddie(q).intent).toBe(routeCaddie(q).intent)
  })
})
