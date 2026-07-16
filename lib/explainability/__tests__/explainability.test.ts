import { describe, expect, it } from "vitest"

import type { PlayerAnalytics, AnalyticsScore } from "@/lib/analytics/types"
import type { PlayerOddsView } from "@/lib/odds-intelligence/types"

import { toOverallRatingExplanation } from "../adapters/overall-rating"
import { toBettingValueExplanation } from "../adapters/betting-value"
import { blendConfidence, confidenceLabel, fromGraded, fromVerified } from "../confidence"
import { deterministicNarrator, narrate } from "../narrator"
import { getModelMeta, MODEL_IDS, MODELS, MODEL_REGISTRY } from "../registry"
import type { Explanation, ExplanationSubject } from "../types"

const PLAYER_SUBJECT: ExplanationSubject = { kind: "player", id: "p1", label: "Test Player" }

/** A single analytics score; override per test. */
function score(overrides: Partial<AnalyticsScore> = {}): AnalyticsScore {
  return {
    key: "recentForm",
    label: "Recent Form",
    description: "Current world-ranking standing blended with week-over-week movement.",
    value: 80,
    band: "STRONG",
    confidence: "high",
    ...overrides,
  }
}

/** A PlayerAnalytics fixture; override per test. */
function analytics(overrides: Partial<PlayerAnalytics> = {}): PlayerAnalytics {
  return {
    playerId: "p1",
    season: 2025,
    sampleSize: 100,
    overallRating: 75,
    overallBand: "STRONG",
    scores: [
      score({ key: "recentForm", label: "Recent Form", value: 80 }),
      score({ key: "seasonPerformance", label: "Season Performance", value: 70 }),
    ],
    isEmpty: false,
    ...overrides,
  }
}

describe("registry", () => {
  it("MODEL_IDS covers every registered model exactly once", () => {
    expect(new Set(MODEL_IDS).size).toBe(MODEL_IDS.length)
    expect(MODEL_IDS.length).toBe(Object.keys(MODEL_REGISTRY).length)
    expect(MODELS.length).toBe(MODEL_IDS.length)
  })

  it("every model has a label and a methodology", () => {
    for (const id of MODEL_IDS) {
      const meta = getModelMeta(id)
      expect(meta.label.length).toBeGreaterThan(0)
      expect(meta.methodology.length).toBeGreaterThan(0)
    }
  })
})

describe("confidence mapping", () => {
  it("maps the graded vocabulary conservatively", () => {
    expect(fromGraded("high")).toBe("high")
    expect(fromGraded("medium")).toBe("medium")
    expect(fromGraded("low")).toBe("low")
    expect(fromGraded("none")).toBe("none")
    expect(fromGraded("unavailable")).toBe("none")
    expect(fromGraded(null)).toBe("none")
  })

  it("maps the verified vocabulary conservatively (never upgrades)", () => {
    expect(fromVerified("verified")).toBe("high")
    expect(fromVerified("partial")).toBe("medium")
    expect(fromVerified("unavailable")).toBe("none")
  })

  it("blends to the weakest present grade", () => {
    expect(blendConfidence(["high", "medium", "low"])).toBe("low")
    expect(blendConfidence(["high", "high"])).toBe("high")
    expect(blendConfidence(["none", "none"])).toBe("none")
    // `none` is ignored unless everything is none.
    expect(blendConfidence(["high", "none"])).toBe("high")
  })

  it("labels grades with the UI vocabulary", () => {
    expect(confidenceLabel("none")).toBe("Unavailable")
    expect(confidenceLabel("high")).toBe("High")
  })
})

describe("overall-rating adapter", () => {
  it("maps the score and equal-weights available core metrics", () => {
    const exp = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    expect(exp.headline.value).toBe(75)
    expect(exp.headline.unit).toBe("score-100")
    expect(exp.headline.band).toBe("STRONG")

    const core = exp.contributors.filter((c) => !c.independent)
    expect(core).toHaveLength(2)
    // Two scored metrics → 50% weight each.
    expect(core.every((c) => c.weightPct === 50)).toBe(true)
    // Contributions sum (approximately) to the headline mean.
    const sum = core.reduce((acc, c) => acc + (c.contribution ?? 0), 0)
    expect(sum).toBeCloseTo(75, 0)
  })

  it("turns a missing metric into an explicit limitation, never a fabricated 50", () => {
    const exp = toOverallRatingExplanation(
      analytics({
        overallRating: 80,
        scores: [
          score({ key: "recentForm", label: "Recent Form", value: 80 }),
          score({ key: "consistency", label: "Consistency", value: null, band: null, confidence: "none" }),
        ],
      }),
      PLAYER_SUBJECT,
    )
    // The unavailable metric is NOT a contributor with a 50.
    expect(exp.contributors.some((c) => c.label === "Consistency")).toBe(false)
    expect(exp.limitations.some((l) => l.code === "metric-unavailable:consistency")).toBe(true)
    // The one available metric now carries the full 100% weight.
    const core = exp.contributors.filter((c) => !c.independent)
    expect(core).toHaveLength(1)
    expect(core[0].weightPct).toBe(100)
  })

  it("emits headline.value = null and a no-rating limitation for an empty player", () => {
    const exp = toOverallRatingExplanation(
      analytics({ overallRating: null, overallBand: null, isEmpty: true, scores: [] }),
      PLAYER_SUBJECT,
    )
    expect(exp.headline.value).toBeNull()
    expect(exp.headline.confidence).toBe("none")
    expect(exp.limitations.some((l) => l.code === "no-rating")).toBe(true)
  })

  it("surfaces independent signals as context-only, excluded from the composite", () => {
    const exp = toOverallRatingExplanation(
      analytics({
        scores: [
          score({ key: "recentForm", label: "Recent Form", value: 80 }),
          score({ key: "rankingMomentum", label: "Ranking Momentum", value: 50, independent: true }),
        ],
      }),
      PLAYER_SUBJECT,
    )
    const momentum = exp.contributors.find((c) => c.label === "Ranking Momentum")
    expect(momentum?.independent).toBe(true)
    expect(momentum?.weightPct).toBeNull()
    expect(momentum?.contribution).toBeNull()
    expect(momentum?.direction).toBe("neutral")
  })
})

describe("betting-value adapter (honest degradation)", () => {
  function oddsView(overrides: Partial<PlayerOddsView> = {}): PlayerOddsView {
    return {
      tournamentId: "t1",
      tournamentName: "Test Open",
      sportTitle: "PGA",
      market: "TOURNAMENT_WINNER",
      confidence: "verified",
      consensus: {
        selection: "Test Player",
        selectionSlug: "test-player",
        playerId: "p1",
        bookCount: 6,
        consensusDecimal: 11,
        consensusAmerican: 1000,
        fairProbability: 0.09,
        impliedProbability: 0.1,
        bestPrice: {
          bookmakerKey: "a",
          bookmakerTitle: "Book A",
          decimalOdds: 12,
          americanOdds: 1100,
          lastUpdate: new Date("2026-01-01T00:00:00.000Z"),
        },
        worstPrice: {
          bookmakerKey: "b",
          bookmakerTitle: "Book B",
          decimalOdds: 10,
          americanOdds: 900,
          lastUpdate: new Date("2026-01-01T00:00:00.000Z"),
        },
        priceSpread: 2,
        books: [],
      },
      fieldRank: 5,
      fieldSize: 150,
      capturedAt: new Date("2026-01-01T00:00:00.000Z"),
      ...overrides,
    }
  }

  it("always states that no edge model exists, even with a healthy market", () => {
    const exp = toBettingValueExplanation(oddsView(), PLAYER_SUBJECT)
    expect(exp.limitations.some((l) => l.code === "no-edge-model")).toBe(true)
    // The headline is the market's fair probability, expressed as a probability.
    expect(exp.headline.unit).toBe("probability")
    expect(exp.headline.value).toBe(9)
    expect(exp.headline.confidence).toBe("high")
  })

  it("degrades to null with a no-consensus limitation when the market is empty", () => {
    const exp = toBettingValueExplanation(
      oddsView({ consensus: null, confidence: "unavailable", fieldRank: null }),
      PLAYER_SUBJECT,
    )
    expect(exp.headline.value).toBeNull()
    expect(exp.headline.confidence).toBe("none")
    expect(exp.limitations.some((l) => l.code === "no-consensus")).toBe(true)
    expect(exp.limitations.some((l) => l.code === "no-edge-model")).toBe(true)
  })
})

describe("deterministic narrator (grounding)", () => {
  /** Collect every number that appears in the narrative prose. */
  function numbersIn(text: string): number[] {
    return (text.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  }

  /**
   * Every number the explanation legitimately exposes — across the headline,
   * contributors, and the derived `reasoning`/`limitations` strings the narrator
   * is allowed to restate. If a number in the prose is not in this set, the
   * narrator invented it.
   */
  function allowedNumbers(exp: Explanation): Set<number> {
    const nums = new Set<number>()
    if (exp.headline.value !== null) nums.add(exp.headline.value)
    for (const c of exp.contributors) {
      if (typeof c.rawValue === "number") nums.add(c.rawValue)
      if (c.normalizedValue !== null) nums.add(c.normalizedValue)
      if (c.weightPct !== null) nums.add(c.weightPct)
      if (c.contribution !== null) nums.add(Math.abs(c.contribution))
    }
    // Numbers appearing in the adapter-derived strings the narrator may echo.
    for (const s of [...exp.reasoning, ...exp.limitations.map((l) => l.message)]) {
      for (const n of numbersIn(s)) nums.add(n)
    }
    return nums
  }

  it("never invents a number absent from the explanation", () => {
    const exp = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    const narrated = narrate(exp)
    const allowed = allowedNumbers(exp)
    const text = [narrated.narrative.summary, ...narrated.narrative.bullets].join(" ")
    for (const n of numbersIn(text)) {
      expect(allowed.has(n)).toBe(true)
    }
  })

  it("states unavailability plainly when there is no score", () => {
    const exp = toOverallRatingExplanation(
      analytics({ overallRating: null, overallBand: null, isEmpty: true, scores: [] }),
      PLAYER_SUBJECT,
    )
    const { narrative } = narrate(exp)
    expect(narrative.summary.toLowerCase()).toContain("unavailable")
    expect(narrative.bullets.length).toBeGreaterThan(0)
  })

  it("marks context-only signals as not moving the score", () => {
    const exp = toOverallRatingExplanation(
      analytics({
        scores: [
          score({ key: "recentForm", label: "Recent Form", value: 80 }),
          score({ key: "rankingMomentum", label: "Ranking Momentum", value: 50, independent: true }),
        ],
      }),
      PLAYER_SUBJECT,
    )
    const { narrative } = narrate(exp)
    const contextBullet = narrative.bullets.find((b) => b.includes("Ranking Momentum"))
    expect(contextBullet).toMatch(/context/i)
  })

  it("attaches the narrative without mutating the source explanation", () => {
    const exp = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    const narrated = narrate(exp, deterministicNarrator)
    expect(exp.narrative.summary).toBe("")
    expect(narrated.narrative.summary.length).toBeGreaterThan(0)
    expect(narrated).not.toBe(exp)
  })
})
