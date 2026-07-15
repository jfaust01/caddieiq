import { describe, expect, it } from "vitest"

import type { AnalyticsBand, AnalyticsScore, PlayerAnalytics } from "@/lib/analytics/types"

import { buildBoardSet, ranksByPlayer, selectPlayerProfile } from "../calculator"

/** Minimal analytics-score factory for a single metric. */
function score(
  key: AnalyticsScore["key"],
  value: number | null,
  band: AnalyticsBand | null,
): AnalyticsScore {
  return { key, label: key, description: "", value, band, confidence: value === null ? "none" : "high" }
}

/** Build a PlayerAnalytics with a chosen overall + recentForm value. */
function player(
  playerId: string,
  overall: number | null,
  form: number | null,
): PlayerAnalytics {
  const band = (v: number | null): AnalyticsBand | null => (v === null ? null : "SOLID")
  return {
    playerId,
    season: 2025,
    sampleSize: 89,
    overallRating: overall,
    overallBand: band(overall),
    scores: [
      score("recentForm", form, band(form)),
      score("consistency", null, null),
      score("activity", null, null),
      score("fantasyProduction", null, null),
      score("seasonPerformance", null, null),
    ],
    isEmpty: overall === null && form === null,
  }
}

describe("buildBoardSet", () => {
  it("orders a category by score descending and assigns ranks", () => {
    const boards = buildBoardSet(
      [player("a", 50, 10), player("b", 90, 20), player("c", 70, 30)],
      "global",
      2025,
    )
    const overall = boards.boards.find((board) => board.category === "overall")!
    expect(overall.rows.map((row) => row.playerId)).toEqual(["b", "c", "a"])
    expect(overall.rows.map((row) => row.rank)).toEqual([1, 2, 3])
    expect(overall.totalRanked).toBe(3)
  })

  it("excludes players with a null value in the category (honesty over coverage)", () => {
    const boards = buildBoardSet(
      [player("a", 50, null), player("b", 90, null), player("c", null, null)],
      "global",
      2025,
    )
    const form = boards.boards.find((board) => board.category === "recentForm")!
    // None have a form score → the form board is empty, not fabricated.
    expect(form.totalRanked).toBe(0)
    expect(form.rows).toEqual([])
    // Overall still ranks the two players that have a rating.
    const overall = boards.boards.find((board) => board.category === "overall")!
    expect(overall.totalRanked).toBe(2)
  })

  it("uses standard competition ranking for ties (1, 2, 2, 4)", () => {
    const boards = buildBoardSet(
      [player("a", 80, 0), player("b", 80, 0), player("c", 90, 0), player("d", 60, 0)],
      "global",
      2025,
    )
    const overall = boards.boards.find((board) => board.category === "overall")!
    // c(90)=1, a(80)=2, b(80)=2, d(60)=4
    const ranks = Object.fromEntries(overall.rows.map((row) => [row.playerId, row.rank]))
    expect(ranks).toEqual({ c: 1, a: 2, b: 2, d: 4 })
  })
})

describe("selectPlayerProfile", () => {
  it("reports a player's placement across categories", () => {
    const boards = buildBoardSet(
      [player("a", 50, 10), player("b", 90, 20), player("c", 70, 30)],
      "global",
      2025,
    )
    const profile = selectPlayerProfile(boards, "b")
    expect(profile.isRanked).toBe(true)
    const overall = profile.entries.find((entry) => entry.category === "overall")!
    expect(overall.rank).toBe(1)
    expect(overall.totalRanked).toBe(3)
    expect(overall.percentile).toBe(100)
  })

  it("returns an unranked profile for a player absent from the population", () => {
    const boards = buildBoardSet([player("a", 50, 10)], "global", 2025)
    const profile = selectPlayerProfile(boards, "missing")
    expect(profile.isRanked).toBe(false)
    expect(profile.entries.every((entry) => entry.rank === null)).toBe(true)
  })
})

describe("ranksByPlayer", () => {
  it("indexes each player's rank per category", () => {
    const boards = buildBoardSet([player("a", 50, 10), player("b", 90, 20)], "field", 2025)
    const index = ranksByPlayer(boards)
    expect(index.get("b")?.overall).toBe(1)
    expect(index.get("a")?.overall).toBe(2)
  })
})
