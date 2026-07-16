import { describe, expect, it } from "vitest"

import { buildCourseProfile } from "@/lib/domain/course"
import type { CourseProfileInput } from "@/lib/domain/course"

import {
  buildFieldFitBoard,
  computeCourseFit,
  emptyPlayerSkillProfile,
  fitBand,
} from "../model"
import type { FieldFitEntry, PlayerSkillProfile } from "../types"

/** A course whose demands are fully verified, driving-heavy. */
function drivingCourseProfile() {
  const input: CourseProfileInput = {
    courseId: "course_1",
    par: 72,
    yardage: 7400,
    altitudeFt: null,
    characteristic: {
      style: null,
      fairwayGrass: null,
      roughGrass: null,
      greenGrass: null,
      greenSpeed: null,
      fairwayWidth: null,
      roughLength: null,
      treeLined: null,
      waterHazards: null,
      windExposure: null,
      elevationChange: null,
      drivingImportance: 0.9,
      approachImportance: 0.6,
      shortGameImportance: 0.2,
      puttingImportance: 0.3,
      scramblingDifficulty: 0.5,
      birdieRate: null,
      bogeyRate: null,
      varianceRating: null,
    },
  }
  return buildCourseProfile(input)
}

function skills(partial: Partial<PlayerSkillProfile>): PlayerSkillProfile {
  return { ...emptyPlayerSkillProfile(), ...partial }
}

describe("computeCourseFit", () => {
  it("returns an all-unavailable, null-score result when skills are unknown", () => {
    const result = computeCourseFit({
      playerId: "p1",
      courseProfile: drivingCourseProfile(),
      skills: emptyPlayerSkillProfile(),
    })

    expect(result.score).toBeNull()
    expect(result.band).toBeNull()
    expect(result.confidence).toBe("none")
    expect(result.coverage).toEqual({ scored: 0, total: 5 })
    expect(result.missing).toHaveLength(5)
    // Skills missing but demands present ⇒ reason is player-skill-missing.
    expect(result.missing.every((s) => s.reason === "player-skill-missing")).toBe(true)
    expect(result.summary).toContain("can't be computed yet")
  })

  it("attributes reasons correctly when there is no course profile", () => {
    const result = computeCourseFit({
      playerId: "p1",
      courseProfile: null,
      skills: skills({ driving: 80 }),
    })
    expect(result.score).toBeNull()
    expect(result.confidence).toBe("none")
    // Driving has a skill but no demand ⇒ course-demand-missing; the other four
    // have neither ⇒ both-missing. The model never conflates the two.
    const driving = result.missing.find((s) => s.key === "driving")
    expect(driving?.reason).toBe("course-demand-missing")
    expect(result.missing.filter((s) => s.reason === "both-missing")).toHaveLength(4)
  })

  it("scores only the signals with both demand and skill verified", () => {
    const result = computeCourseFit({
      playerId: "p1",
      courseProfile: drivingCourseProfile(),
      skills: skills({ driving: 90, approach: 50 }),
    })

    expect(result.coverage.scored).toBe(2)
    expect(result.confidence).toBe("low")
    // Weighted by demand: driving 0.9, approach 0.6 ⇒ weights 0.6 / 0.4.
    // score = 0.6*90 + 0.4*50 = 54 + 20 = 74.
    expect(result.score).toBeCloseTo(74, 5)
    expect(result.band).toBe("STRONG")
    // Driving should be the top driver (highest weighted deviation from 50).
    expect(result.drivers[0]?.key).toBe("driving")
    expect(result.drivers[0]?.direction).toBe("positive")
  })

  it("reaches high confidence only when all five signals are scored", () => {
    const result = computeCourseFit({
      playerId: "p1",
      courseProfile: drivingCourseProfile(),
      skills: skills({ driving: 70, approach: 60, shortGame: 55, putting: 50, scrambling: 65 }),
    })
    expect(result.coverage.scored).toBe(5)
    expect(result.confidence).toBe("high")
    expect(result.score).not.toBeNull()
    expect(result.missing).toHaveLength(0)
  })

  it("weights a bomber higher at a driving course than a putting-only skill set", () => {
    const bomber = computeCourseFit({
      playerId: "bomber",
      courseProfile: drivingCourseProfile(),
      skills: skills({ driving: 95, putting: 40 }),
    })
    const putter = computeCourseFit({
      playerId: "putter",
      courseProfile: drivingCourseProfile(),
      skills: skills({ driving: 40, putting: 95 }),
    })
    expect((bomber.score as number) > (putter.score as number)).toBe(true)
  })
})

describe("fitBand", () => {
  it("maps scores to bands at the documented thresholds", () => {
    expect(fitBand(70)).toBe("STRONG")
    expect(fitBand(57)).toBe("ABOVE_AVERAGE")
    expect(fitBand(43)).toBe("AVERAGE")
    expect(fitBand(30)).toBe("BELOW_AVERAGE")
    expect(fitBand(29)).toBe("WEAK")
  })
})

describe("buildFieldFitBoard", () => {
  function entry(id: string, score: number | null, momentum: number | null): FieldFitEntry {
    return {
      playerId: id,
      displayName: id,
      momentum,
      result: computeCourseFit({
        playerId: id,
        courseProfile: score === null ? null : drivingCourseProfile(),
        // A single scored signal is enough to produce a deterministic score.
        skills: score === null ? emptyPlayerSkillProfile() : skills({ driving: score, approach: score }),
      }),
    }
  }

  it("splits scored players into top fits and fades, and orders trending by momentum", () => {
    const entries = [
      entry("high", 90, 40),
      entry("low", 20, 80),
      entry("mid", 55, 60),
      entry("unscored", null, 95),
    ]
    const board = buildFieldFitBoard(entries)

    expect(board.totalPlayers).toBe(4)
    expect(board.scoredPlayers).toBe(3)
    expect(board.topFits[0]?.playerId).toBe("high")
    expect(board.fades[0]?.playerId).toBe("low")
    // Unscored player is excluded from fit lists but can trend on momentum.
    expect(board.topFits.some((e) => e.playerId === "unscored")).toBe(false)
    expect(board.trendingUp[0]?.playerId).toBe("unscored")
    // Most uncertain surfaces the unscored (confidence "none") player first.
    expect(board.mostUncertain[0]?.playerId).toBe("unscored")
  })
})
