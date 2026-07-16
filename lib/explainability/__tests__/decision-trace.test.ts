import { describe, expect, it } from "vitest"

import type { PlayerAnalytics, AnalyticsScore } from "@/lib/analytics/types"

import { toOverallRatingExplanation } from "../adapters/overall-rating"
import {
  classifyContributor,
  narrateFromTrace,
  toDecisionTrace,
  toNarratedTrace,
  weightToStars,
  TRACE_PIPELINE_ORDER,
} from "../decision-trace"
import type { Contributor, Explanation, ExplanationSubject } from "../types"

const PLAYER_SUBJECT: ExplanationSubject = { kind: "player", id: "p1", label: "Test Player" }

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

function analytics(overrides: Partial<PlayerAnalytics> = {}): PlayerAnalytics {
  return {
    playerId: "p1",
    season: 2025,
    sampleSize: 100,
    overallRating: 75,
    overallBand: "STRONG",
    scores: [
      score({ key: "seasonPerformance", label: "Season Performance", value: 91 }),
      score({ key: "fantasyProduction", label: "Fantasy Production", value: 93 }),
      score({ key: "recentForm", label: "Recent Form", value: 80 }),
      score({ key: "activity", label: "Activity", value: 4, band: "DEVELOPING" }),
    ],
    isEmpty: false,
    ...overrides,
  }
}

/** Minimal hand-built contributor for classifier unit tests. */
function contributor(overrides: Partial<Contributor> & Pick<Contributor, "key" | "label">): Contributor {
  return {
    description: "",
    rawValue: null,
    normalizedValue: null,
    weightPct: null,
    contribution: null,
    direction: "neutral",
    confidence: "medium",
    independent: false,
    ...overrides,
  }
}

describe("classifyContributor", () => {
  it('does not misclassify "Season Performance" as recent-form (the "perFORMance" trap)', () => {
    // Whole-word "form" must not match the substring inside "performance".
    expect(classifyContributor(contributor({ key: "seasonPerformance", label: "Season Performance" }))).toBe(
      "player-skill",
    )
  })

  it("maps the overall-rating metric keys to the right pipeline stages", () => {
    expect(classifyContributor(contributor({ key: "recentForm", label: "Recent Form" }))).toBe("recent-form")
    expect(classifyContributor(contributor({ key: "rankingMomentum", label: "Ranking Momentum" }))).toBe(
      "recent-form",
    )
    expect(classifyContributor(contributor({ key: "fantasyProduction", label: "Fantasy Production" }))).toBe(
      "player-skill",
    )
    expect(classifyContributor(contributor({ key: "activity", label: "Activity" }))).toBe("player-skill")
  })

  it("disambiguates colliding keys by model (approach = skill vs. fit)", () => {
    // The same "approach" key means player-skill in the skill model and
    // course-fit in the course-fit model.
    expect(classifyContributor(contributor({ key: "approach", label: "Approach" }), "player-skill")).toBe(
      "player-skill",
    )
    expect(classifyContributor(contributor({ key: "approach", label: "Approach" }), "course-fit")).toBe(
      "course-fit",
    )
  })

  it("routes weather-model signals to the weather stage", () => {
    expect(classifyContributor(contributor({ key: "wind", label: "Wind" }), "weather-intelligence")).toBe(
      "weather",
    )
  })

  it("falls back to context for signals it cannot place", () => {
    expect(classifyContributor(contributor({ key: "mystery-signal", label: "Mystery" }))).toBe("context")
  })
})

describe("weightToStars", () => {
  it("maps a 0–100 weight onto a banded 0–5 star scale", () => {
    expect(weightToStars(null)).toBeNull()
    expect(weightToStars(0)).toBe(0)
    expect(weightToStars(100)).toBe(5)
    expect(weightToStars(40)).toBe(5)
    expect(weightToStars(30)).toBe(4)
    expect(weightToStars(25)).toBe(3)
    expect(weightToStars(15)).toBe(2)
    expect(weightToStars(5)).toBe(1)
  })

  it("is monotonic — a heavier weight never yields fewer stars", () => {
    let prev = -1
    for (let w = 0; w <= 100; w += 5) {
      const stars = weightToStars(w) ?? 0
      expect(stars).toBeGreaterThanOrEqual(prev)
      prev = stars
    }
  })
})

describe("toDecisionTrace", () => {
  it("orders stages by the canonical pipeline order and appends a final stage", () => {
    const trace = toDecisionTrace(toOverallRatingExplanation(analytics(), PLAYER_SUBJECT))

    const last = trace.stages[trace.stages.length - 1]
    expect(last.category).toBe("final")
    expect(last.influencesOutcome).toBe(true)

    // Non-final stage categories must be non-decreasing in pipeline order.
    const rank = (c: string) => TRACE_PIPELINE_ORDER.indexOf(c as (typeof TRACE_PIPELINE_ORDER)[number])
    const nonFinal = trace.stages.filter((s) => s.category !== "final")
    for (let i = 1; i < nonFinal.length; i++) {
      expect(rank(nonFinal[i].category)).toBeGreaterThanOrEqual(rank(nonFinal[i - 1].category))
    }
  })

  it("carries the headline, confidence, and every limitation through unchanged", () => {
    const explanation = toOverallRatingExplanation(
      analytics({ scores: [score({ key: "seasonPerformance", label: "Season Performance", value: 70 })] }),
      PLAYER_SUBJECT,
    )
    const trace = toDecisionTrace(explanation)

    expect(trace.headlineValue).toBe(explanation.headline.value)
    expect(trace.overallConfidence).toBe(explanation.headline.confidence)
    expect(trace.limitations).toEqual(explanation.limitations)
  })

  it("sets influencesOutcome to the inverse of each contributor's independent flag", () => {
    const explanation = toOverallRatingExplanation(
      analytics({
        scores: [
          score({ key: "seasonPerformance", label: "Season Performance", value: 70 }),
          score({ key: "rankingMomentum", label: "Ranking Momentum", value: 50 }),
        ],
      }),
      PLAYER_SUBJECT,
    )
    const trace = toDecisionTrace(explanation)
    // Every non-final stage must mirror its source contributor's independence:
    // independent (context-only) signals do not influence the outcome.
    for (const c of explanation.contributors) {
      const stage = trace.stages.find((s) => s.id === c.key)
      expect(stage?.influencesOutcome).toBe(!c.independent)
      // An independent signal also carries no weight stars.
      if (c.independent) expect(stage?.weightStars).toBeNull()
    }
  })

  it("maps contributor direction onto stage impact", () => {
    const trace = toDecisionTrace(toOverallRatingExplanation(analytics(), PLAYER_SUBJECT))
    const activity = trace.stages.find((s) => s.id === "activity")
    expect(activity?.impact).toBe("negative")
    const season = trace.stages.find((s) => s.id === "seasonPerformance")
    expect(season?.impact).toBe("positive")
  })

  it("degrades honestly when no score can be produced", () => {
    const emptyExplanation = toOverallRatingExplanation(
      analytics({ overallRating: null, scores: [], isEmpty: true }),
      PLAYER_SUBJECT,
    )
    const trace = toDecisionTrace(emptyExplanation)
    expect(trace.headlineValue).toBeNull()
    const final = trace.stages[trace.stages.length - 1]
    expect(final.category).toBe("final")
    expect(final.evidence).toHaveLength(0)
  })
})

describe("narrateFromTrace", () => {
  function numbersIn(text: string): number[] {
    return (text.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  }

  it("never introduces a number absent from the trace", () => {
    const explanation = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    const trace = toDecisionTrace(explanation)
    const narrative = narrateFromTrace(trace)

    const allowed = new Set<number>()
    if (trace.headlineValue !== null) allowed.add(trace.headlineValue)
    for (const stage of trace.stages) {
      if (stage.weightPct !== null) allowed.add(stage.weightPct)
    }
    // headlineDisplay may contain the /100 denominator.
    for (const n of numbersIn(trace.headlineDisplay)) allowed.add(n)

    const prose = [narrative.summary, ...narrative.steps, narrative.caveat ?? ""].join(" ")
    for (const n of numbersIn(prose)) {
      expect(allowed.has(n)).toBe(true)
    }
  })

  it("only narrates stages that actually influence the outcome", () => {
    const explanation = toOverallRatingExplanation(
      analytics({
        scores: [
          score({ key: "seasonPerformance", label: "Season Performance", value: 70 }),
          score({ key: "rankingMomentum", label: "Ranking Momentum", value: 50 }),
        ],
      }),
      PLAYER_SUBJECT,
    )
    const narrative = narrateFromTrace(toDecisionTrace(explanation))
    // The independent, neutral momentum signal must not appear as a step.
    expect(narrative.steps.some((s) => s.includes("Ranking Momentum"))).toBe(false)
  })

  it("reports unavailability instead of fabricating a walkthrough", () => {
    const explanation = toOverallRatingExplanation(
      analytics({ overallRating: null, scores: [], isEmpty: true }),
      PLAYER_SUBJECT,
    )
    const narrative = narrateFromTrace(toDecisionTrace(explanation))
    expect(narrative.steps).toHaveLength(0)
    expect(narrative.summary.toLowerCase()).toContain("unavailable")
  })

  it("echoes the first limitation as a caveat", () => {
    // Drop consistency so the adapter emits a limitation.
    const explanation = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    const trace = toDecisionTrace(explanation)
    const narrative = narrateFromTrace(trace)
    if (trace.limitations.length > 0) {
      expect(narrative.caveat).toBe(trace.limitations[0].message)
    }
  })

  it("toNarratedTrace bundles the trace and its narrative", () => {
    const explanation = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    const bundle = toNarratedTrace(explanation)
    expect(bundle.trace.stages.length).toBeGreaterThan(0)
    expect(bundle.narrative.summary.length).toBeGreaterThan(0)
  })
})

describe("trace ↔ explanation consistency", () => {
  it("produces exactly one stage per contributor plus the final stage", () => {
    const explanation: Explanation = toOverallRatingExplanation(analytics(), PLAYER_SUBJECT)
    const trace = toDecisionTrace(explanation)
    expect(trace.stages.length).toBe(explanation.contributors.length + 1)
  })
})
