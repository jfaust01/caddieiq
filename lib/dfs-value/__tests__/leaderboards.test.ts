/**
 * Unit tests for the pure DFS leaderboard builder. These lock the board
 * contract: every board is sorted correctly, contains only rated players,
 * carries an explanatory headline, is capped, and is order-independent — and
 * the salary-tier boards only list players of that tier.
 */
import { describe, expect, it } from "vitest"

import { buildDfsBoards } from "../leaderboards"
import { buildDfsValueField } from "../model"
import type {
  DfsConfidence,
  DfsPlayerInput,
  DfsSignalInput,
  DfsValueResult,
} from "../types"

function sig(score: number | null, confidence: DfsConfidence = "high"): DfsSignalInput {
  return { score, confidence, rating: score == null ? null : "Test" }
}
const MISSING: DfsSignalInput = { score: null, confidence: "none", rating: null }

function player(
  id: string,
  salary: number | null,
  skill: number,
  market: number,
  confidence: DfsConfidence = "high",
): DfsPlayerInput {
  return {
    playerId: id,
    displayName: id,
    salary,
    playerSkill: sig(skill, confidence),
    market: sig(market, confidence),
    courseFit: MISSING,
    form: MISSING,
    weather: MISSING,
  }
}

/** A realistic scored field: spread of salary, strength, and confidence. */
function ratedField(): DfsValueResult[] {
  const out = buildDfsValueField({
    ceiling: "verified",
    players: [
      player("stud", 11200, 97, 95),
      player("stud2", 10600, 90, 88),
      player("mid1", 8200, 70, 72),
      player("mid2", 7800, 60, 58),
      player("val1", 6100, 55, 52),
      player("val2", 5600, 40, 44),
      player("boom", 7000, 85, 80, "low"), // strong but uncertain → GPP
      player("safe", 8600, 65, 66, "high"),
    ],
  })
  return out.players.filter((r): r is DfsValueResult => r.status === "available")
}

describe("buildDfsBoards", () => {
  it("returns the six named boards in a stable order", () => {
    const boards = buildDfsBoards(ratedField())
    expect(boards.map((b) => b.key)).toEqual([
      "topValues",
      "highEndValues",
      "midRangeValues",
      "valuePlays",
      "highestConfidence",
      "riskyGppTargets",
    ])
  })

  it("sorts Top DFS Values by descending value score", () => {
    const top = buildDfsBoards(ratedField()).find((b) => b.key === "topValues")!
    const scores = top.entries.map((e) => e.score ?? -1)
    const sorted = [...scores].sort((a, b) => b - a)
    expect(scores).toEqual(sorted)
    // ranks are 1..n contiguous
    expect(top.entries.map((e) => e.rank)).toEqual(top.entries.map((_, i) => i + 1))
  })

  it("restricts salary-tier boards to their own tier", () => {
    const boards = buildDfsBoards(ratedField())
    const high = boards.find((b) => b.key === "highEndValues")!
    const mid = boards.find((b) => b.key === "midRangeValues")!
    const val = boards.find((b) => b.key === "valuePlays")!
    expect(high.entries.every((e) => e.salaryTier === "high")).toBe(true)
    expect(mid.entries.every((e) => e.salaryTier === "mid")).toBe(true)
    expect(val.entries.every((e) => e.salaryTier === "value")).toBe(true)
  })

  it("orders Highest Confidence by confidence first", () => {
    const conf = buildDfsBoards(ratedField()).find((b) => b.key === "highestConfidence")!
    const rank: Record<DfsConfidence, number> = { none: 0, low: 1, medium: 2, high: 3 }
    const seq = conf.entries.map((e) => rank[e.confidence])
    const sorted = [...seq].sort((a, b) => b - a)
    expect(seq).toEqual(sorted)
  })

  it("only lists lower-certainty plays in Risky GPP Targets", () => {
    const gpp = buildDfsBoards(ratedField()).find((b) => b.key === "riskyGppTargets")!
    expect(gpp.entries.every((e) => e.confidence === "low" || e.confidence === "medium")).toBe(true)
  })

  it("gives every entry a non-empty headline", () => {
    const boards = buildDfsBoards(ratedField())
    for (const board of boards) {
      for (const entry of board.entries) {
        expect(entry.headline.length).toBeGreaterThan(0)
      }
    }
  })

  it("caps each board at eight entries", () => {
    const many = buildDfsValueField({
      ceiling: "verified",
      players: Array.from({ length: 20 }, (_, i) =>
        player(`p${i}`, 6000 + i * 250, 20 + i * 3, 25 + i * 3),
      ),
    }).players.filter((r): r is DfsValueResult => r.status === "available")
    for (const board of buildDfsBoards(many)) {
      expect(board.entries.length).toBeLessThanOrEqual(8)
    }
  })

  it("is order-independent", () => {
    const rated = ratedField()
    const a = buildDfsBoards(rated)
    const b = buildDfsBoards([...rated].reverse())
    const ids = (boards: ReturnType<typeof buildDfsBoards>) =>
      boards.map((board) => board.entries.map((e) => e.playerId))
    expect(ids(a)).toEqual(ids(b))
  })

  it("returns empty boards for an empty field without throwing", () => {
    const boards = buildDfsBoards([])
    expect(boards).toHaveLength(6)
    expect(boards.every((b) => b.entries.length === 0)).toBe(true)
  })
})
