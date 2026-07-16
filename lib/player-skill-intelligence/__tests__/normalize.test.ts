/**
 * Unit tests for the pure Player Skill normalization + grading helpers. These
 * lock the ranking contract (direction-aware percentiles, insufficient-
 * population refusal), band thresholds, AI labels, trend detection, and the
 * confidence blend — including the honesty guards that return `null`/`none`
 * rather than a fabricated rating.
 */
import { describe, expect, it } from "vitest"

import {
  MIN_POPULATION,
  bandAdjective,
  bandLabel,
  familyLabel,
  gradeProfileConfidence,
  gradeSkillConfidence,
  percentileOf,
  scoreToBand,
  skillExplanationLabel,
  trendDirection,
} from "../normalize"

const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)

describe("percentileOf", () => {
  it("refuses to rank against a population smaller than MIN_POPULATION", () => {
    const tooSmall = sorted([1, 2, 3, 4]) // length 4 < 5
    expect(tooSmall.length).toBeLessThan(MIN_POPULATION)
    expect(percentileOf(3, tooSmall, true)).toBeNull()
  })

  it("ranks higher-is-better values ascending", () => {
    const pop = sorted([-2, -1, 0, 1, 2])
    // top value → ~90 (midpoint of ties at the ceiling)
    expect(percentileOf(2, pop, true)).toBeGreaterThan(80)
    // bottom value → low
    expect(percentileOf(-2, pop, true)).toBeLessThan(20)
    // median value → ~50
    expect(percentileOf(0, pop, true)).toBeCloseTo(50, 0)
  })

  it("inverts ranking for lower-is-better skills", () => {
    const pop = sorted([68, 69, 70, 71, 72]) // e.g. par-3 scoring average
    const best = percentileOf(68, pop, false)
    const worst = percentileOf(72, pop, false)
    expect(best).toBeGreaterThan(worst as number)
    expect(best).toBeGreaterThan(80)
  })

  it("places ties on the midpoint, not the floor or ceiling", () => {
    const pop = sorted([5, 5, 5, 5, 5])
    expect(percentileOf(5, pop, true)).toBeCloseTo(50, 0)
  })

  it("returns null for non-finite input", () => {
    const pop = sorted([1, 2, 3, 4, 5])
    expect(percentileOf(Number.NaN, pop, true)).toBeNull()
    expect(percentileOf(Number.POSITIVE_INFINITY, pop, true)).toBeNull()
  })
})

describe("scoreToBand", () => {
  it("maps the seven bands at their thresholds", () => {
    expect(scoreToBand(97)).toBe("ELITE")
    expect(scoreToBand(85)).toBe("EXCELLENT")
    expect(scoreToBand(70)).toBe("ABOVE_AVERAGE")
    expect(scoreToBand(50)).toBe("AVERAGE")
    expect(scoreToBand(25)).toBe("BELOW_AVERAGE")
    expect(scoreToBand(10)).toBe("POOR")
    expect(scoreToBand(2)).toBe("VERY_POOR")
  })
})

describe("labels", () => {
  it("bandLabel and bandAdjective are total over bands", () => {
    for (const band of ["ELITE", "EXCELLENT", "ABOVE_AVERAGE", "AVERAGE", "BELOW_AVERAGE", "POOR", "VERY_POOR"] as const) {
      expect(bandLabel(band).length).toBeGreaterThan(0)
      expect(bandAdjective(band).length).toBeGreaterThan(0)
    }
  })

  it("skillExplanationLabel joins adjective + noun with no prose", () => {
    expect(skillExplanationLabel("ELITE", "Iron Player")).toBe("Elite Iron Player")
    expect(skillExplanationLabel("POOR", "Driver Accuracy")).toBe("Weak Driver Accuracy")
  })

  it("familyLabel is total over families", () => {
    for (const fam of ["offTheTee", "approach", "aroundGreen", "putting", "teeToGreen", "scoring"] as const) {
      expect(familyLabel(fam).length).toBeGreaterThan(0)
    }
  })
})

describe("gradeSkillConfidence", () => {
  it("is none with no samples, regardless of ranking", () => {
    expect(gradeSkillConfidence(0, true)).toBe("none")
    expect(gradeSkillConfidence(0, false)).toBe("none")
  })
  it("is low when it could not be ranked against a population", () => {
    expect(gradeSkillConfidence(40, false)).toBe("low")
  })
  it("scales with sample size once ranked", () => {
    expect(gradeSkillConfidence(3, true)).toBe("low")
    expect(gradeSkillConfidence(8, true)).toBe("medium")
    expect(gradeSkillConfidence(20, true)).toBe("high")
  })
})

describe("gradeProfileConfidence", () => {
  it("is none when nothing is known or there are no rounds", () => {
    expect(gradeProfileConfidence({ knownSourceable: 0, sourceableTotal: 12, rounds: 10, ageDays: 5 })).toBe("none")
    expect(gradeProfileConfidence({ knownSourceable: 8, sourceableTotal: 12, rounds: 0, ageDays: 5 })).toBe("none")
  })

  it("rewards full coverage, high volume, and fresh data", () => {
    expect(
      gradeProfileConfidence({ knownSourceable: 12, sourceableTotal: 12, rounds: 30, ageDays: 5 }),
    ).toBe("high")
  })

  it("stays low for thin, stale coverage", () => {
    expect(
      gradeProfileConfidence({ knownSourceable: 2, sourceableTotal: 12, rounds: 2, ageDays: 800 }),
    ).toBe("low")
  })

  it("treats unknown freshness conservatively", () => {
    const known = gradeProfileConfidence({ knownSourceable: 6, sourceableTotal: 12, rounds: 8, ageDays: 5 })
    const unknownAge = gradeProfileConfidence({ knownSourceable: 6, sourceableTotal: 12, rounds: 8, ageDays: null })
    // Unknown freshness should never grade higher than a known-fresh equivalent.
    const rank = { none: 0, low: 1, medium: 2, high: 3 } as const
    expect(rank[unknownAge]).toBeLessThanOrEqual(rank[known])
  })
})

describe("trendDirection", () => {
  it("is unknown when either side is missing", () => {
    expect(trendDirection(null, 1, true)).toBe("unknown")
    expect(trendDirection(1, null, true)).toBe("unknown")
  })
  it("detects improvement respecting direction", () => {
    expect(trendDirection(1.0, 0.2, true)).toBe("improving")
    // lower-is-better: a smaller recent value is improvement (>5% of baseline)
    expect(trendDirection(64, 71, false)).toBe("improving")
  })
  it("detects decline respecting direction", () => {
    expect(trendDirection(0.1, 0.9, true)).toBe("declining")
    // lower-is-better: a clearly larger recent value is decline (>5% of baseline)
    expect(trendDirection(78, 70, false)).toBe("declining")
  })
  it("treats sub-threshold movement as stable", () => {
    expect(trendDirection(1.01, 1.0, true)).toBe("stable")
  })
})
