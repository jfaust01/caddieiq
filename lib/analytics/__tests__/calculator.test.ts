import { describe, expect, it } from "vitest"

import {
  buildPopulation,
  computePlayerAnalytics,
  meanOfScores,
  percentile,
  toBand,
  type SeasonStatSample,
} from "../calculator"

/** A representative season-stat sample; override per test. */
function sample(overrides: Partial<SeasonStatSample> = {}): SeasonStatSample {
  return {
    playerId: "p1",
    season: 2025,
    worldRanking: 10,
    worldRankingLastWeek: 12,
    events: 25,
    averagePoints: 3.2,
    totalPoints: 80,
    pointsGained: 90,
    pointsLost: 10,
    ...overrides,
  }
}

describe("percentile", () => {
  it("ranks a value by its position in the ascending distribution", () => {
    const dist = [1, 2, 3, 4]
    // For value 3: below={1,2}=2, equal={3}=1 → (2 + 1/2)/4 * 100 = 62.5.
    expect(percentile(dist, 3)).toBe(62.5)
  })

  it("uses the midpoint convention for ties", () => {
    const dist = [5, 5, 5, 5]
    // All equal → (0 + 4/2)/4 * 100 = 50.
    expect(percentile(dist, 5)).toBe(50)
  })

  it("inverts when lower is better (e.g. world ranking)", () => {
    const dist = [1, 2, 3, 4]
    // Value 1: below=0, equal=1 → ascending (0 + 1/2)/4 * 100 = 12.5;
    // inverted because #1 is best → 100 - 12.5 = 87.5.
    expect(percentile(dist, 1, { higherIsBetter: false })).toBe(87.5)
  })

  it("returns a neutral 50 for a degenerate population", () => {
    expect(percentile([], 5)).toBe(50)
    expect(percentile([42], 42)).toBe(50)
  })
})

describe("toBand", () => {
  it("maps scores to qualitative bands", () => {
    expect(toBand(95)).toBe("ELITE")
    expect(toBand(70)).toBe("STRONG")
    expect(toBand(55)).toBe("SOLID")
    expect(toBand(40)).toBe("AVERAGE")
    expect(toBand(10)).toBe("DEVELOPING")
  })
})

describe("meanOfScores", () => {
  it("averages only the present values", () => {
    expect(meanOfScores([80, null, 40])).toBe(60)
  })

  it("returns null when nothing is present", () => {
    expect(meanOfScores([null, null])).toBeNull()
  })
})

describe("computePlayerAnalytics", () => {
  const population = [
    sample({ playerId: "p1", worldRanking: 1, events: 30, averagePoints: 4, totalPoints: 120 }),
    sample({ playerId: "p2", worldRanking: 50, events: 20, averagePoints: 2, totalPoints: 60 }),
    sample({ playerId: "p3", worldRanking: 100, events: 10, averagePoints: 1, totalPoints: 20 }),
  ]
  const pop = buildPopulation(population, 2025)

  it("computes every tracked analytic for a full sample", () => {
    const result = computePlayerAnalytics(population[0], pop)
    expect(result.isEmpty).toBe(false)
    expect(result.playerId).toBe("p1")
    expect(result.season).toBe(2025)
    expect(result.sampleSize).toBe(3)
    // The top player should score near the top of the field.
    expect(result.overallRating).not.toBeNull()
    expect(result.overallRating!).toBeGreaterThan(70)
    // 5 core weighted metrics + 1 independent signal (rankingMomentum).
    expect(result.scores).toHaveLength(6)
    expect(result.scores.every((s) => s.value !== null)).toBe(true)
  })

  it("treats rankingMomentum as an independent signal excluded from the overall rating", () => {
    const result = computePlayerAnalytics(population[0], pop)
    const momentum = result.scores.find((s) => s.key === "rankingMomentum")
    // It IS surfaced, flagged independent, and never part of the composite.
    expect(momentum).toBeDefined()
    expect(momentum?.independent).toBe(true)

    // The overall rating equals the mean of ONLY the core (non-independent)
    // metrics — proving the new signal did not reweight the composite.
    const coreMean = meanOfScores(
      result.scores.filter((s) => !s.independent).map((s) => s.value),
    )
    expect(result.overallRating).toBe(coreMean)
  })

  it("scores rankingMomentum above 50 for an improving rank and below 50 for a slipping one", () => {
    // p1 improved 12 → 1 last week to this week: strong upward momentum.
    const improving = computePlayerAnalytics(
      sample({ worldRanking: 5, worldRankingLastWeek: 9 }),
      pop,
    )
    const up = improving.scores.find((s) => s.key === "rankingMomentum")
    expect(up?.value).toBeGreaterThan(50)

    // A player who slipped down the rankings scores below the neutral midpoint.
    const slipping = computePlayerAnalytics(
      sample({ worldRanking: 20, worldRankingLastWeek: 15 }),
      pop,
    )
    const down = slipping.scores.find((s) => s.key === "rankingMomentum")
    expect(down?.value).toBeLessThan(50)
  })

  it("emits a null rankingMomentum (never fabricated) without last week's rank", () => {
    const subject = sample({ worldRankingLastWeek: null })
    const result = computePlayerAnalytics(subject, buildPopulation([subject], 2025))
    const momentum = result.scores.find((s) => s.key === "rankingMomentum")
    expect(momentum?.value).toBeNull()
    expect(momentum?.confidence).toBe("none")
  })

  it("derives consistency intrinsically from gained vs. lost points", () => {
    const subject = sample({ playerId: "p1", pointsGained: 75, pointsLost: 25 })
    const result = computePlayerAnalytics(subject, buildPopulation([subject], 2025))
    const consistency = result.scores.find((s) => s.key === "consistency")
    expect(consistency?.value).toBe(75)
    expect(consistency?.confidence).toBe("high")
  })

  it("emits null (not a fabricated value) when inputs are missing", () => {
    const subject = sample({
      playerId: "p1",
      pointsGained: null,
      pointsLost: null,
      averagePoints: null,
    })
    const result = computePlayerAnalytics(subject, buildPopulation(population, 2025))
    const consistency = result.scores.find((s) => s.key === "consistency")
    const production = result.scores.find((s) => s.key === "fantasyProduction")
    expect(consistency?.value).toBeNull()
    expect(consistency?.confidence).toBe("none")
    expect(production?.value).toBeNull()
  })

  it("caps recent-form confidence at medium (world ranking is obfuscated)", () => {
    const result = computePlayerAnalytics(population[0], pop)
    const recentForm = result.scores.find((s) => s.key === "recentForm")
    expect(recentForm?.confidence).toBe("medium")
  })

  it("returns a stable empty profile when the player has no sample", () => {
    const result = computePlayerAnalytics(null, pop)
    expect(result.isEmpty).toBe(true)
    expect(result.overallRating).toBeNull()
    // 5 core weighted metrics + 1 independent signal (rankingMomentum).
    expect(result.scores).toHaveLength(6)
    expect(result.scores.every((s) => s.value === null)).toBe(true)
  })
})
