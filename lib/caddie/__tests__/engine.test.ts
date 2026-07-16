import { describe, expect, it } from "vitest"

import { askCaddie } from "../engine"
import type { CaddieDataBundle } from "../types"
import type { DfsValueField } from "@/lib/dfs-value/types"

/**
 * End-to-end engine tests. Two regimes matter:
 *  1. Grounding — with real board data, answers cite the engine and surface the
 *     actual players (never fabricated numbers).
 *  2. Honest degradation — with an empty bundle, every intent returns
 *     `isEmpty: true` and confidence "unavailable" rather than making things up.
 */

const dfsWithCash = {
  totalPlayers: 40,
  ratedPlayers: 40,
  pricedPlayers: 40,
  averageConfidence: "high",
  players: [],
  boards: [
    {
      key: "highestConfidence",
      title: "Safest Value",
      description: "The most stable, highest-confidence value plays",
      entries: [
        {
          rank: 1,
          playerId: "p-scheffler",
          displayName: "Scottie Scheffler",
          score: 92,
          tier: "elite",
          confidence: "high",
          strength: 95,
          salary: 11800,
          salaryTier: "premium",
          headline: "Elite ball-striking at a fair price",
        },
        {
          rank: 2,
          playerId: "p-morikawa",
          displayName: "Collin Morikawa",
          score: 88,
          tier: "strong",
          confidence: "high",
          strength: 89,
          salary: 10200,
          salaryTier: "premium",
          headline: "Top-tier approach play",
        },
      ],
    },
  ],
} as unknown as DfsValueField

const groundedBundle: CaddieDataBundle = {
  tournamentId: "t-1",
  tournamentName: "The Masters",
  courseName: "Augusta National",
  dfs: dfsWithCash,
  fit: null,
  skill: null,
  odds: null,
  weather: null,
}

const emptyBundle: CaddieDataBundle = {
  tournamentId: "t-empty",
  tournamentName: "Empty Open",
  courseName: null,
  dfs: null,
  fit: null,
  skill: null,
  odds: null,
  weather: null,
}

describe("askCaddie — grounding", () => {
  it("answers cash plays from the DFS board and cites the engine", () => {
    const answer = askCaddie("best cash plays?", groundedBundle)
    expect(answer.intent).toBe("best_cash_plays")
    expect(answer.isEmpty).toBe(false)
    expect(answer.citations[0]?.engine).toBe("DFS Value Engine")
    // Surfaces the real players from the board — nothing invented.
    expect(answer.entities.map((e) => e.playerId)).toContain("p-scheffler")
    expect(answer.bullets.join(" ")).toContain("Scottie Scheffler")
  })

  it("links player chips to their player page", () => {
    const answer = askCaddie("best cash plays?", groundedBundle)
    const chip = answer.entities.find((e) => e.playerId === "p-scheffler")
    expect(chip?.href).toBe("/players/p-scheffler")
  })

  it("names the tournament it reasoned over", () => {
    const answer = askCaddie("best cash plays?", groundedBundle)
    expect(answer.summary).toContain("The Masters")
  })

  it("always answers capabilities, even with no data", () => {
    const answer = askCaddie("what can you do?", emptyBundle)
    expect(answer.intent).toBe("capabilities")
    expect(answer.bullets.length).toBeGreaterThan(0)
  })
})

describe("askCaddie — honest degradation", () => {
  const questions = [
    "best cash plays?",
    "best gpp plays?",
    "who's underpriced?",
    "who fits the course?",
    "who should I fade?",
    "who's in form?",
    "who are the favorites?",
    "how's the weather?",
  ]

  for (const q of questions) {
    it(`"${q}" degrades to an honest empty answer with no data`, () => {
      const answer = askCaddie(q, emptyBundle)
      expect(answer.isEmpty).toBe(true)
      expect(answer.confidence).toBe("unavailable")
      // Degraded answers must not invent supporting bullets.
      expect(answer.bullets.length).toBe(0)
    })
  }

  it("is deterministic — identical question + bundle yields identical answer", () => {
    const a = askCaddie("best cash plays?", groundedBundle)
    const b = askCaddie("best cash plays?", groundedBundle)
    expect(a).toEqual(b)
  })
})
