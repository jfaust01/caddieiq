import { describe, expect, it } from "vitest"

import {
  cleanUnscrambledString,
  hasScrambledDescriptor,
  isImplausibleProjection,
  isScrambledText,
  SCRAMBLE_SENTINEL,
} from "../shared/scramble"

describe("isScrambledText", () => {
  it("detects the literal sentinel", () => {
    expect(isScrambledText("Scrambled")).toBe(true)
    expect(isScrambledText(SCRAMBLE_SENTINEL)).toBe(true)
  })

  it("is case-insensitive and whitespace-tolerant", () => {
    expect(isScrambledText("  scrambled  ")).toBe(true)
    expect(isScrambledText("SCRAMBLED")).toBe(true)
  })

  it("does not match real values or non-strings", () => {
    expect(isScrambledText("To Win")).toBe(false)
    expect(isScrambledText("")).toBe(false)
    expect(isScrambledText(null)).toBe(false)
    expect(isScrambledText(undefined)).toBe(false)
    expect(isScrambledText(42)).toBe(false)
    // A word that merely contains the sentinel is NOT a scramble.
    expect(isScrambledText("Unscrambled")).toBe(false)
  })
})

describe("cleanUnscrambledString", () => {
  it("returns null for the sentinel instead of the literal word", () => {
    expect(cleanUnscrambledString("Scrambled")).toBeNull()
    expect(cleanUnscrambledString(" scrambled ")).toBeNull()
  })

  it("behaves like cleanString for empty/absent values", () => {
    expect(cleanUnscrambledString(null)).toBeNull()
    expect(cleanUnscrambledString(undefined)).toBeNull()
    expect(cleanUnscrambledString("   ")).toBeNull()
  })

  it("trims and preserves real values", () => {
    expect(cleanUnscrambledString("  Rory McIlroy  ")).toBe("Rory McIlroy")
    expect(cleanUnscrambledString("To Win Outright")).toBe("To Win Outright")
  })
})

describe("hasScrambledDescriptor", () => {
  const fields = ["BettingBetType", "BettingPeriodType"] as const

  it("flags a record when any named descriptor is scrambled", () => {
    expect(
      hasScrambledDescriptor(
        { BettingBetType: "Scrambled", BettingPeriodType: "Event" },
        fields,
      ),
    ).toBe(true)
  })

  it("passes a record whose descriptors are all real", () => {
    expect(
      hasScrambledDescriptor(
        { BettingBetType: "To Win", BettingPeriodType: "Event" },
        fields,
      ),
    ).toBe(false)
  })

  it("only inspects the named fields, ignoring other scrambled columns", () => {
    // A scramble in an un-named field must not trip the gate — the caller
    // decides which fields are the meaningful descriptors.
    expect(
      hasScrambledDescriptor(
        { BettingBetType: "To Win", SomeOtherField: "Scrambled" },
        fields,
      ),
    ).toBe(false)
  })

  it("treats a missing record as not scrambled", () => {
    expect(hasScrambledDescriptor(null, fields)).toBe(false)
    expect(hasScrambledDescriptor(undefined, fields)).toBe(false)
  })
})

describe("isImplausibleProjection", () => {
  const birdieRange = { min: 0, max: 25 }

  it("flags values outside the plausible range (scrambled decimals)", () => {
    // Per the catalog, a scrambled feed reports e.g. Birdies: 37.3.
    expect(isImplausibleProjection(37.3, birdieRange)).toBe(true)
    expect(isImplausibleProjection(-5, birdieRange)).toBe(true)
  })

  it("passes plausible values", () => {
    expect(isImplausibleProjection(12, birdieRange)).toBe(false)
    expect(isImplausibleProjection(0, birdieRange)).toBe(false)
    expect(isImplausibleProjection(25, birdieRange)).toBe(false)
  })

  it("treats absent/non-finite values as absence, not implausibility", () => {
    expect(isImplausibleProjection(null, birdieRange)).toBe(false)
    expect(isImplausibleProjection(undefined, birdieRange)).toBe(false)
    expect(isImplausibleProjection(Number.NaN, birdieRange)).toBe(false)
  })

  it("coerces numeric strings before range-checking", () => {
    expect(isImplausibleProjection("37.3", birdieRange)).toBe(true)
    expect(isImplausibleProjection("12", birdieRange)).toBe(false)
  })
})
