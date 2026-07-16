/**
 * Unit tests for the pure odds mathematics. These lock the conversion contract
 * (decimal ↔ American, implied probability) and the de-vig/consensus helpers,
 * including the honesty guards that reject non-prices instead of coercing them.
 */
import { describe, expect, it } from "vitest"

import {
  clamp,
  decimalToAmerican,
  devig,
  impliedProbabilityFromDecimal,
  isValidDecimalOdds,
  mean,
  median,
  overround,
  priceRange,
  stddev,
} from "../math"

describe("isValidDecimalOdds", () => {
  it("accepts prices strictly greater than 1", () => {
    expect(isValidDecimalOdds(1.5)).toBe(true)
    expect(isValidDecimalOdds(9)).toBe(true)
  })
  it("rejects non-prices", () => {
    expect(isValidDecimalOdds(1)).toBe(false)
    expect(isValidDecimalOdds(0)).toBe(false)
    expect(isValidDecimalOdds(-2)).toBe(false)
    expect(isValidDecimalOdds(Number.NaN)).toBe(false)
    expect(isValidDecimalOdds(Number.POSITIVE_INFINITY)).toBe(false)
  })
})

describe("decimalToAmerican", () => {
  it("converts underdogs (d >= 2) to positive American odds", () => {
    expect(decimalToAmerican(2)).toBe(100)
    expect(decimalToAmerican(9)).toBe(800)
    expect(decimalToAmerican(3.5)).toBe(250)
  })
  it("converts favourites (d < 2) to negative American odds", () => {
    expect(decimalToAmerican(1.5)).toBe(-200)
    expect(decimalToAmerican(1.91)).toBe(-110)
  })
  it("throws on invalid input rather than inventing a price", () => {
    expect(() => decimalToAmerican(1)).toThrow(RangeError)
    expect(() => decimalToAmerican(Number.NaN)).toThrow(RangeError)
  })
})

describe("impliedProbabilityFromDecimal", () => {
  it("is 1/d", () => {
    expect(impliedProbabilityFromDecimal(2)).toBeCloseTo(0.5, 10)
    expect(impliedProbabilityFromDecimal(4)).toBeCloseTo(0.25, 10)
  })
  it("throws on invalid odds", () => {
    expect(() => impliedProbabilityFromDecimal(0.5)).toThrow(RangeError)
  })
})

describe("devig", () => {
  it("renormalizes a margined field to sum to 1", () => {
    // Two-way market priced at 1.91/1.91 → implied 0.5236 each, sum 1.047.
    const raw = [1 / 1.91, 1 / 1.91]
    const fair = devig(raw)
    expect(fair[0] + fair[1]).toBeCloseTo(1, 10)
    expect(fair[0]).toBeCloseTo(0.5, 10)
  })
  it("is safe on empty / zero input", () => {
    expect(devig([])).toEqual([])
    expect(devig([0, 0])).toEqual([0, 0])
  })
})

describe("overround", () => {
  it("reports the bookmaker margin of a field", () => {
    expect(overround([1.91, 1.91])!).toBeCloseTo(0.0471, 3)
  })
  it("is null for an empty field", () => {
    expect(overround([])).toBeNull()
  })
})

describe("summary statistics", () => {
  it("mean/median/stddev handle empties as null", () => {
    expect(mean([])).toBeNull()
    expect(median([])).toBeNull()
    expect(stddev([])).toBeNull()
  })
  it("median does not mutate its input and handles even counts", () => {
    const input = [3, 1, 2, 4]
    expect(median(input)).toBe(2.5)
    expect(input).toEqual([3, 1, 2, 4])
  })
  it("computes mean and population stddev", () => {
    expect(mean([2, 4, 6])).toBe(4)
    expect(stddev([2, 4, 6])).toBeCloseTo(1.632993, 5)
  })
})

describe("priceRange", () => {
  it("returns best (max) and worst (min)", () => {
    expect(priceRange([9, 8.5, 10, 9.5])).toEqual({ best: 10, worst: 8.5 })
  })
  it("is null when empty", () => {
    expect(priceRange([])).toBeNull()
  })
})

describe("clamp", () => {
  it("bounds a value", () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })
})
