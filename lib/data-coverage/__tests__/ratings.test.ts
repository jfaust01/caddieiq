/**
 * Unit tests for the pure coverage math. These lock in the honesty contract:
 * empty domains are "unknown" (never a flattering 100%), only verified rows
 * count, and the scored bands map exactly to the documented thresholds.
 */
import { describe, expect, it } from "vitest"

import {
  countPresent,
  coveragePercent,
  rateCoverage,
  ratingLabel,
} from "../ratings"

describe("coveragePercent", () => {
  it("returns null when there is nothing to measure", () => {
    expect(coveragePercent(0, 0)).toBeNull()
    expect(coveragePercent(5, 0)).toBeNull()
  })

  it("computes an integer percentage", () => {
    expect(coveragePercent(1, 4)).toBe(25)
    expect(coveragePercent(7, 10)).toBe(70)
    expect(coveragePercent(2, 3)).toBe(67)
  })

  it("clamps a miscount instead of exceeding 100%", () => {
    expect(coveragePercent(12, 10)).toBe(100)
    expect(coveragePercent(-3, 10)).toBe(0)
  })

  it("rejects non-finite input", () => {
    expect(coveragePercent(Number.NaN, 10)).toBeNull()
    expect(coveragePercent(5, Number.POSITIVE_INFINITY)).toBeNull()
  })
})

describe("rateCoverage", () => {
  it("maps percentages to the documented bands", () => {
    expect(rateCoverage(95)).toBe("excellent")
    expect(rateCoverage(90)).toBe("excellent")
    expect(rateCoverage(89)).toBe("good")
    expect(rateCoverage(70)).toBe("good")
    expect(rateCoverage(69)).toBe("partial")
    expect(rateCoverage(40)).toBe("partial")
    expect(rateCoverage(39)).toBe("needs-attention")
    expect(rateCoverage(0)).toBe("needs-attention")
  })

  it("treats an unknown (null) percent as needs-attention, never excellent", () => {
    expect(rateCoverage(null)).toBe("needs-attention")
  })
})

describe("ratingLabel", () => {
  it("humanizes each rating including the restricted state", () => {
    expect(ratingLabel("excellent")).toBe("Excellent")
    expect(ratingLabel("good")).toBe("Good")
    expect(ratingLabel("partial")).toBe("Partial")
    expect(ratingLabel("needs-attention")).toBe("Needs Attention")
    expect(ratingLabel("restricted")).toBe("Provider Restricted")
  })
})

describe("countPresent", () => {
  it("counts only genuinely present values", () => {
    expect(countPresent([1, 0, false, "x", "", null, undefined])).toBe(4)
  })

  it("treats whitespace-only strings as absent", () => {
    expect(countPresent(["  ", "\t", "a"])).toBe(1)
  })

  it("counts falsy-but-real values (0, false) as present", () => {
    expect(countPresent([0, false])).toBe(2)
  })
})
