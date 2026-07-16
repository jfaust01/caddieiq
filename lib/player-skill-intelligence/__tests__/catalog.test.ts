/**
 * Unit tests for the skill catalog + raw aggregation. These lock the derivation
 * contract: means where appropriate, pooled made/possible ratios for
 * percentages, tee-to-green summed per round, and — crucially — that a skill is
 * only produced when its inputs actually exist (no zero-filling, no guessing).
 */
import { describe, expect, it } from "vitest"

import {
  SKILL_DEFINITIONS,
  SKILL_KEYS,
  SOURCEABLE_SKILL_KEYS,
  aggregateRawSkills,
  latestPlayedAt,
} from "../catalog"
import type { SkillRoundSample } from "../types"

/**
 * A fully-populated, all-`null` raw round. Every rate field is present so the
 * aggregator only ever "sees" data via explicit overrides — mirroring how the
 * repository always emits a complete row. Overrides layer real values on top.
 */
const BASE_SAMPLE: SkillRoundSample = {
  playedAt: "2024-06-01T00:00:00.000Z",
  season: 2024,
  sgOffTheTee: null,
  sgApproach: null,
  sgAroundGreen: null,
  sgPutting: null,
  sgTotal: null,
  drivingDistance: null,
  drivingAccuracy: null,
  fairwaysHit: null,
  fairwaysPossible: null,
  greensInRegulation: null,
  greensPossible: null,
  putts: null,
  birdies: null,
  eagles: null,
  pars: null,
  bogeys: null,
  doubleBogeys: null,
  scramblingPercentage: null,
  sandSavePercentage: null,
}

function round(overrides: Partial<SkillRoundSample>): SkillRoundSample {
  return { ...BASE_SAMPLE, ...overrides }
}

describe("catalog metadata", () => {
  it("defines fifteen skills with unique keys", () => {
    expect(SKILL_DEFINITIONS).toHaveLength(15)
    expect(new Set(SKILL_KEYS).size).toBe(15)
  })

  it("marks the three par-scoring skills as non-sourceable", () => {
    expect(SOURCEABLE_SKILL_KEYS).toHaveLength(12)
    expect(SOURCEABLE_SKILL_KEYS).not.toContain("par3Scoring")
    expect(SOURCEABLE_SKILL_KEYS).not.toContain("par4Scoring")
    expect(SOURCEABLE_SKILL_KEYS).not.toContain("par5Scoring")
  })
})

describe("aggregateRawSkills", () => {
  it("returns nothing for empty input — never zero-fills", () => {
    const { values, counts } = aggregateRawSkills([])
    expect(Object.keys(values)).toHaveLength(0)
    expect(Object.keys(counts)).toHaveLength(0)
  })

  it("averages strokes-gained across rounds and records the sample count", () => {
    const { values, counts } = aggregateRawSkills([
      round({ sgApproach: 1.0 }),
      round({ sgApproach: 0.0 }),
      round({ sgApproach: -0.5 }),
    ])
    expect(values.sgApproach).toBeCloseTo(0.1667, 3)
    expect(counts.sgApproach).toBe(3)
  })

  it("only sums tee-to-green for rounds with all three components", () => {
    const { values, counts } = aggregateRawSkills([
      round({ sgOffTheTee: 0.5, sgApproach: 0.3, sgAroundGreen: 0.2 }), // complete ⇒ 1.0
      round({ sgOffTheTee: 0.5, sgApproach: 0.3 }), // missing around-green ⇒ excluded
    ])
    expect(values.sgTeeToGreen).toBeCloseTo(1.0, 5)
    expect(counts.sgTeeToGreen).toBe(1)
  })

  it("pools driving accuracy as fairways hit ÷ possible", () => {
    const { values } = aggregateRawSkills([
      round({ fairwaysHit: 7, fairwaysPossible: 14 }),
      round({ fairwaysHit: 14, fairwaysPossible: 14 }),
    ])
    // (7 + 14) / (14 + 14) = 75%
    expect(values.drivingAccuracy).toBeCloseTo(75, 5)
  })

  it("falls back to per-round accuracy percentage when made/possible is absent", () => {
    const { values } = aggregateRawSkills([
      round({ drivingAccuracy: 60 }),
      round({ drivingAccuracy: 70 }),
    ])
    expect(values.drivingAccuracy).toBeCloseTo(65, 5)
  })

  it("pools GIR and computes birdie/bogey rates over total holes", () => {
    const { values } = aggregateRawSkills([
      round({
        greensInRegulation: 12,
        greensPossible: 18,
        birdies: 4,
        eagles: 1,
        pars: 10,
        bogeys: 3,
        doubleBogeys: 0,
      }),
    ])
    expect(values.greensInRegulation).toBeCloseTo((12 / 18) * 100, 5)
    // 18 holes; birdie-or-better = 5 ⇒ 27.78%
    expect(values.birdiePercentage).toBeCloseTo((5 / 18) * 100, 5)
    // bogeys+doubles = 3 ⇒ avoidance = 1 - 3/18 = 83.33%
    expect(values.bogeyAvoidance).toBeCloseTo((1 - 3 / 18) * 100, 5)
  })

  it("never produces the par-scoring skills (no provider field)", () => {
    const { values } = aggregateRawSkills([round({ sgApproach: 1, birdies: 3, pars: 15 })])
    expect(values.par3Scoring).toBeUndefined()
    expect(values.par4Scoring).toBeUndefined()
    expect(values.par5Scoring).toBeUndefined()
  })
})

describe("latestPlayedAt", () => {
  it("returns the most recent ISO timestamp", () => {
    const latest = latestPlayedAt({
      playerId: "p1",
      season: 2024,
      rounds: [
        round({ playedAt: "2024-01-01T00:00:00.000Z" }),
        round({ playedAt: "2024-08-01T00:00:00.000Z" }),
        round({ playedAt: "2024-05-01T00:00:00.000Z" }),
      ],
    })
    expect(latest).toBe("2024-08-01T00:00:00.000Z")
  })

  it("returns null when no round carries a date", () => {
    expect(
      latestPlayedAt({ playerId: "p1", season: null, rounds: [round({ playedAt: null })] }),
    ).toBeNull()
  })
})
