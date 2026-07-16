/**
 * Unit tests for the pure DFS Value Model core. These lock the contract that
 * makes the flagship composite trustworthy:
 *
 *   - Value = strength-percentile minus salary-percentile, so a mid-priced
 *     player who outperforms their price beats an equally strong stud.
 *   - Missing families renormalize over what is present — never a neutral-50
 *     stand-in — and a player with no quality family scores `null`, not a guess.
 *   - An unpriced player is `unavailable` (value needs a denominator).
 *   - The Tournament Context ceiling caps confidence and nothing exceeds it.
 *   - NaN/Infinity inputs are treated as missing; the function never throws.
 *   - Output is deterministic and independent of input ordering.
 */
import { describe, expect, it } from "vitest"

import { buildDfsValueField, DFS_FAMILY_CONFIG, TIER_LABEL } from "../model"
import type {
  DfsConfidence,
  DfsContextCeiling,
  DfsPlayerInput,
  DfsSignalInput,
  DfsValueFieldInput,
  DfsValueResult,
} from "../types"

/* ------------------------------------------------------------------ */
/* Builders                                                           */
/* ------------------------------------------------------------------ */

function sig(score: number | null, confidence: DfsConfidence = "high"): DfsSignalInput {
  return { score, confidence, rating: score == null ? null : "Test" }
}

const MISSING: DfsSignalInput = { score: null, confidence: "none", rating: null }

function player(
  overrides: Partial<DfsPlayerInput> & Pick<DfsPlayerInput, "playerId" | "salary">,
): DfsPlayerInput {
  return {
    displayName: overrides.playerId,
    playerSkill: MISSING,
    courseFit: MISSING,
    market: MISSING,
    form: MISSING,
    weather: MISSING,
    ...overrides,
  }
}

function field(
  players: readonly DfsPlayerInput[],
  ceiling: DfsContextCeiling = "verified",
): DfsValueFieldInput {
  return { players, ceiling }
}

const byId = (result: DfsValueField["players"], id: string): DfsValueResult => {
  const found = result.find((r) => r.playerId === id)
  if (!found) throw new Error(`missing player ${id}`)
  return found
}

type DfsValueField = ReturnType<typeof buildDfsValueField>

/* ------------------------------------------------------------------ */
/* Honesty guards                                                     */
/* ------------------------------------------------------------------ */

describe("buildDfsValueField — honesty guards", () => {
  it("marks an unpriced player unavailable (value needs a salary denominator)", () => {
    const out = buildDfsValueField(
      field([
        player({ playerId: "a", salary: null, playerSkill: sig(90) }),
        player({ playerId: "b", salary: 8000, playerSkill: sig(50) }),
        player({ playerId: "c", salary: 7000, playerSkill: sig(60) }),
      ]),
    )
    const a = byId(out.players, "a")
    expect(a.status).toBe("unavailable")
    expect(a.score).toBeNull()
    expect(a.tier).toBeNull()
    expect(a.salary).toBeNull()
  })

  it("returns null strength (not 50) when no quality family is present", () => {
    const out = buildDfsValueField(
      field([
        player({ playerId: "a", salary: 8000 }),
        player({ playerId: "b", salary: 7000 }),
      ]),
    )
    const a = byId(out.players, "a")
    expect(a.strength).toBeNull()
    expect(a.score).toBeNull()
    expect(a.status).toBe("unavailable")
    expect(out.ratedPlayers).toBe(0)
  })

  it("treats NaN / Infinity family scores as missing and never throws", () => {
    const out = buildDfsValueField(
      field([
        player({ playerId: "a", salary: 8000, playerSkill: sig(Number.NaN), market: sig(70) }),
        player({ playerId: "b", salary: 7000, playerSkill: sig(Number.POSITIVE_INFINITY), market: sig(40) }),
        player({ playerId: "c", salary: 6000, market: sig(55) }),
      ]),
    )
    const a = byId(out.players, "a")
    // playerSkill was NaN → missing; only market scored it.
    expect(a.missing).toContain("playerSkill")
    expect(a.contributions.find((c) => c.key === "market")?.status).toBe("scored")
    expect(a.strength).not.toBeNull()
  })

  it("never assigns a score above 100 or below 0", () => {
    const out = buildDfsValueField(
      field([
        player({ playerId: "a", salary: 12000, playerSkill: sig(100), market: sig(100) }),
        player({ playerId: "b", salary: 5000, playerSkill: sig(0), market: sig(0) }),
        player({ playerId: "c", salary: 8000, playerSkill: sig(50), market: sig(50) }),
      ]),
    )
    for (const r of out.players) {
      if (r.score != null) {
        expect(r.score).toBeGreaterThanOrEqual(0)
        expect(r.score).toBeLessThanOrEqual(100)
      }
    }
  })
})

/* ------------------------------------------------------------------ */
/* Value = strength vs price                                          */
/* ------------------------------------------------------------------ */

describe("buildDfsValueField — value is quality-per-dollar", () => {
  it("rewards the underpriced player over an equally strong stud", () => {
    const out = buildDfsValueField(
      field([
        // Stud priced like a stud.
        player({ playerId: "stud", salary: 11000, playerSkill: sig(95), market: sig(95) }),
        // Equal strength, far cheaper → the value.
        player({ playerId: "value", salary: 7000, playerSkill: sig(95), market: sig(95) }),
        // Filler to give the field a salary + strength spread.
        player({ playerId: "mid", salary: 8500, playerSkill: sig(55), market: sig(55) }),
        player({ playerId: "cheapbad", salary: 5000, playerSkill: sig(20), market: sig(20) }),
      ]),
    )
    const value = byId(out.players, "value")
    const stud = byId(out.players, "stud")
    expect(value.score).not.toBeNull()
    expect(stud.score).not.toBeNull()
    expect(value.score as number).toBeGreaterThan(stud.score as number)
    // Same underlying strength percentile, different price → value has the edge.
    expect(value.strength).toBe(stud.strength)
  })

  it("does not let a cheap weak player outrank a fairly-priced strong one", () => {
    // A wider field so salary/strength percentiles differentiate cleanly: the
    // strong player is only mid-priced (a strong value edge), while the weak
    // player is only slightly below-median priced (a small edge on weak quality).
    const out = buildDfsValueField(
      field([
        player({ playerId: "strong", salary: 8000, playerSkill: sig(92), market: sig(90) }),
        player({ playerId: "weakcheap", salary: 6500, playerSkill: sig(22), market: sig(26) }),
        player({ playerId: "topstud", salary: 11500, playerSkill: sig(98), market: sig(96) }),
        player({ playerId: "mid", salary: 9000, playerSkill: sig(60), market: sig(58) }),
        player({ playerId: "floor", salary: 5000, playerSkill: sig(10), market: sig(12) }),
      ]),
    )
    const strong = byId(out.players, "strong")
    const weak = byId(out.players, "weakcheap")
    expect(strong.score as number).toBeGreaterThan(weak.score as number)
  })
})

/* ------------------------------------------------------------------ */
/* Renormalization over present families                              */
/* ------------------------------------------------------------------ */

describe("buildDfsValueField — family renormalization", () => {
  it("splits a missing family's weight across the present families", () => {
    const out = buildDfsValueField(
      field([
        // Only playerSkill present — strength should equal that family's score.
        player({ playerId: "solo", salary: 8000, playerSkill: sig(80) }),
        player({ playerId: "other", salary: 7000, playerSkill: sig(40) }),
        player({ playerId: "third", salary: 6000, playerSkill: sig(60) }),
      ]),
    )
    const solo = byId(out.players, "solo")
    // With a single scored family, strength is that family's reading.
    expect(solo.strength).toBe(80)
    const present = solo.contributions.filter((c) => c.status === "scored")
    expect(present).toHaveLength(1)
    expect(present[0]?.weight).toBeCloseTo(1, 5)
  })

  it("weights present families proportionally to their configured share", () => {
    const out = buildDfsValueField(
      field([
        player({ playerId: "a", salary: 8000, playerSkill: sig(100), market: sig(0) }),
        player({ playerId: "b", salary: 7000, playerSkill: sig(50), market: sig(50) }),
      ]),
    )
    const a = byId(out.players, "a")
    // playerSkill weight 0.30, market 0.25 → renormalized 0.545 / 0.455.
    // strength = 100*0.545 + 0*0.455 ≈ 54.5, tilted toward the heavier family.
    expect(a.strength as number).toBeGreaterThan(50)
    expect(a.strength as number).toBeLessThan(60)
  })
})

/* ------------------------------------------------------------------ */
/* Confidence ceiling                                                 */
/* ------------------------------------------------------------------ */

describe("buildDfsValueField — context ceiling", () => {
  const strongField = [
    player({ playerId: "a", salary: 8000, playerSkill: sig(90, "high"), market: sig(88, "high") }),
    player({ playerId: "b", salary: 7000, playerSkill: sig(50, "high"), market: sig(50, "high") }),
    player({ playerId: "c", salary: 6000, playerSkill: sig(30, "high"), market: sig(30, "high") }),
  ]

  it("caps confidence at the tournament context ceiling", () => {
    const partial = buildDfsValueField(field(strongField, "partial"))
    for (const r of partial.players) {
      if (r.status === "available") expect(r.confidence).not.toBe("high")
    }
  })

  it("forces every pick unavailable when there is no context", () => {
    const none = buildDfsValueField(field(strongField, "unavailable"))
    for (const r of none.players) {
      expect(r.status).toBe("unavailable")
      expect(r.score).toBeNull()
    }
    expect(none.ratedPlayers).toBe(0)
    expect(none.ceiling).toBe("unavailable")
  })

  it("allows high confidence only under a verified ceiling with strong inputs", () => {
    const verified = buildDfsValueField(field(strongField, "verified"))
    expect(verified.players.some((r) => r.confidence === "high")).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/* Tiers, determinism, field aggregates                               */
/* ------------------------------------------------------------------ */

describe("buildDfsValueField — tiers, determinism, aggregates", () => {
  const roster = [
    player({ playerId: "a", salary: 11000, playerSkill: sig(96), market: sig(94) }),
    player({ playerId: "b", salary: 7000, playerSkill: sig(92), market: sig(90) }),
    player({ playerId: "c", salary: 8000, playerSkill: sig(55), market: sig(58) }),
    player({ playerId: "d", salary: 6000, playerSkill: sig(30), market: sig(28) }),
    player({ playerId: "e", salary: 6500, playerSkill: sig(15), market: sig(20) }),
  ]

  it("assigns every rated player a tier with a known label", () => {
    const out = buildDfsValueField(field(roster))
    for (const r of out.players) {
      if (r.score != null) {
        expect(r.tier).not.toBeNull()
        expect(TIER_LABEL[r.tier!]).toBeTypeOf("string")
      }
    }
  })

  it("is deterministic and order-independent", () => {
    const forward = buildDfsValueField(field(roster))
    const reversed = buildDfsValueField(field([...roster].reverse()))
    const norm = (f: DfsValueField) =>
      [...f.players]
        .sort((x, y) => x.playerId.localeCompare(y.playerId))
        .map((r) => ({ id: r.playerId, score: r.score, strength: r.strength, tier: r.tier }))
    expect(norm(forward)).toEqual(norm(reversed))
  })

  it("counts rated and priced players honestly", () => {
    const out = buildDfsValueField(
      field([
        ...roster,
        player({ playerId: "unpriced", salary: null, playerSkill: sig(80) }),
        player({ playerId: "noquality", salary: 7500 }),
      ]),
    )
    expect(out.totalPlayers).toBe(7)
    expect(out.pricedPlayers).toBe(6) // all but the unpriced one
    expect(out.ratedPlayers).toBe(roster.length) // unpriced + noquality can't be rated
  })

  it("exposes exactly the five configured families in each contribution list", () => {
    const out = buildDfsValueField(field(roster))
    const keys = out.players[0]?.contributions.map((c) => c.key).sort()
    expect(keys).toEqual(DFS_FAMILY_CONFIG.map((f) => f.key).sort())
  })
})
