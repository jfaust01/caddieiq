/**
 * Integration tests for the profile assembler, leaderboards, and the Course Fit
 * adapter. These lock the end-to-end honesty contract: unknown skills stay
 * unknown, thin populations are not ranked, empty profiles are `unavailable`,
 * leaderboards never pad, and the Course Fit projection maps only sourced
 * skills (Unknown ⇒ null).
 */
import { describe, expect, it } from "vitest"

import {
  buildPlayerSkillProfile,
  buildSkillLeaderboards,
  toCourseFitSkillProfile,
  unavailableSkillProfile,
  type RankedPlayerSkill,
} from "../profile"
import { SOURCEABLE_SKILL_KEYS } from "../catalog"
import type { PlayerSkillSamples, SkillPopulation, SkillRoundSample } from "../types"

function mkRounds(base: number, n = 6): SkillRoundSample[] {
  return Array.from({ length: n }, (_, i) => ({
    playedAt: new Date(2024, i, 1).toISOString(),
    season: 2024,
    sgOffTheTee: base * 0.4,
    sgApproach: base * 0.5 + 0.1,
    sgAroundGreen: base * 0.3,
    sgPutting: base * 0.4 - 0.05,
    sgTotal: base * 1.6,
    drivingDistance: 285 + base * 20,
    drivingAccuracy: 55 + base * 8,
    fairwaysHit: 8,
    fairwaysPossible: 14,
    greensInRegulation: 11,
    greensPossible: 18,
    putts: 29,
    birdies: 4,
    eagles: 0,
    pars: 11,
    bogeys: 3,
    doubleBogeys: 0,
    scramblingPercentage: 50 + base * 10,
    sandSavePercentage: 50,
  }))
}

function samplesFor(playerId: string, base: number): PlayerSkillSamples {
  return { playerId, season: 2024, rounds: mkRounds(base) }
}

/** A population comfortably above MIN_POPULATION for every sourceable skill. */
function population(): SkillPopulation {
  const spread = [-1.2, -0.5, 0, 0.3, 0.8, 1.2]
  const pop: SkillPopulation = {}
  for (const key of SOURCEABLE_SKILL_KEYS) {
    pop[key] =
      key === "drivingDistance"
        ? [285, 295, 300, 305, 315, 325]
        : key === "drivingAccuracy" || key === "scrambling"
          ? [45, 52, 58, 63, 70, 78]
          : [...spread]
  }
  return pop
}

describe("unavailableSkillProfile", () => {
  it("marks every skill unknown with none confidence", () => {
    const p = unavailableSkillProfile("p1", [{ code: "no-round-statistics" }], "No data.", 2024)
    expect(p.status).toBe("unavailable")
    expect(p.confidence).toBe("none")
    expect(p.unknownSkills).toHaveLength(15)
    expect(p.strengths).toHaveLength(0)
    expect(p.skills.every((s) => s.value === null && s.band === null)).toBe(true)
  })
})

describe("buildPlayerSkillProfile", () => {
  it("returns unavailable when there are no rounds", () => {
    const p = buildPlayerSkillProfile({
      playerId: "p1",
      season: 2024,
      samples: { playerId: "p1", season: 2024, rounds: [] },
      population: population(),
    })
    expect(p.status).toBe("unavailable")
    expect(p.confidence).toBe("none")
  })

  it("rates sourceable skills against a sufficient population and leaves par-scoring unknown", () => {
    const p = buildPlayerSkillProfile({
      playerId: "p1",
      season: 2024,
      samples: samplesFor("p1", 1.2),
      population: population(),
      now: new Date("2024-07-01T00:00:00.000Z"),
    })
    expect(p.status).toBe("available")
    expect(p.coverage.sourceable).toBe(12)
    expect(p.coverage.known).toBeGreaterThan(0)
    // The three par-scoring skills can never be rated (no provider field).
    expect(p.unknownSkills).toContain("par3Scoring")
    expect(p.unknownSkills).toContain("par4Scoring")
    expect(p.unknownSkills).toContain("par5Scoring")
    // A strong player should surface at least one strength.
    expect(p.strengths.length).toBeGreaterThan(0)
    // sgTotal is not a tracked skill — the twelve sourceable ones are the max.
    expect(p.coverage.known).toBeLessThanOrEqual(12)
  })

  it("refuses to rank when the population is too small — rated values stay null", () => {
    const thin: SkillPopulation = { sgApproach: [0.1, 0.2, 0.3] } // 3 < MIN_POPULATION
    const p = buildPlayerSkillProfile({
      playerId: "p1",
      season: 2024,
      samples: samplesFor("p1", 1.0),
      population: thin,
    })
    const approach = p.skills.find((s) => s.key === "sgApproach")!
    // Raw value is computed, but no percentile/band without a real population.
    expect(approach.rawValue).not.toBeNull()
    expect(approach.value).toBeNull()
    expect(approach.band).toBeNull()
  })

  it("is deterministic given an injected now", () => {
    const input = {
      playerId: "p1",
      season: 2024,
      samples: samplesFor("p1", 0.8),
      population: population(),
      now: new Date("2024-07-01T00:00:00.000Z"),
    }
    expect(buildPlayerSkillProfile(input)).toEqual(buildPlayerSkillProfile(input))
  })
})

describe("buildSkillLeaderboards", () => {
  const pop = population()
  const ranked: RankedPlayerSkill[] = [1.2, 0.6, -0.2, -1.0].map((base, i) => ({
    playerId: `p${i}`,
    playerName: `Player ${i}`,
    profile: buildPlayerSkillProfile({
      playerId: `p${i}`,
      season: 2024,
      samples: samplesFor(`p${i}`, base),
      population: pop,
      now: new Date("2024-07-01T00:00:00.000Z"),
    }),
  }))

  it("ranks the field descending by rating and assigns sequential ranks", () => {
    const boards = buildSkillLeaderboards(ranked, 2024)
    const iron = boards.boards.find((b) => b.key === "bestIronPlayers")!
    expect(iron.entries.length).toBeGreaterThan(1)
    expect(iron.entries[0].rank).toBe(1)
    // Strictly non-increasing rating down the board.
    for (let i = 1; i < iron.entries.length; i++) {
      expect((iron.entries[i - 1].value ?? 0)).toBeGreaterThanOrEqual(iron.entries[i].value ?? 0)
    }
    expect(boards.totalPlayers).toBe(4)
    expect(boards.ratedPlayers).toBeGreaterThan(0)
  })

  it("surfaces native units on the driving boards", () => {
    const boards = buildSkillLeaderboards(ranked, 2024)
    const drive = boards.boards.find((b) => b.key === "longestDrivers")!
    expect(drive.entries[0].unit).toBe("yards")
    expect(drive.entries[0].rawValue).not.toBeNull()
  })

  it("returns empty boards (never padded) when no player has data", () => {
    const empty: RankedPlayerSkill[] = [
      { playerId: "x", playerName: "X", profile: unavailableSkillProfile("x", [], "none") },
    ]
    const boards = buildSkillLeaderboards(empty, 2024)
    expect(boards.ratedPlayers).toBe(0)
    for (const board of boards.boards) {
      expect(board.entries).toHaveLength(0)
    }
  })
})

describe("toCourseFitSkillProfile", () => {
  it("maps the five Fit families from sourced skills", () => {
    const p = buildPlayerSkillProfile({
      playerId: "p1",
      season: 2024,
      samples: samplesFor("p1", 1.0),
      population: population(),
      now: new Date("2024-07-01T00:00:00.000Z"),
    })
    const fit = toCourseFitSkillProfile(p)
    expect(Object.keys(fit).sort()).toEqual(
      ["approach", "driving", "putting", "scrambling", "shortGame"].sort(),
    )
    // Every mapped family should carry a 0–100 score for a fully-rated player.
    for (const v of Object.values(fit)) {
      expect(v === null || (v >= 0 && v <= 100)).toBe(true)
    }
  })

  it("maps unknown skills to null rather than a guess", () => {
    const fit = toCourseFitSkillProfile(unavailableSkillProfile("p1", [], "none"))
    expect(fit.driving).toBeNull()
    expect(fit.approach).toBeNull()
    expect(fit.shortGame).toBeNull()
    expect(fit.putting).toBeNull()
    expect(fit.scrambling).toBeNull()
  })
})
