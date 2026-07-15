import { describe, expect, it } from "vitest"

import { validateFieldEntries } from "../field-validator"
import type { TournamentFieldEntry } from "@/lib/domain/field/types"

/** Build a field entry with sensible defaults, overridable per test. */
function entry(overrides: Partial<TournamentFieldEntry> = {}): TournamentFieldEntry {
  return {
    playerName: "Rory McIlroy",
    playerSlug: "rory-mcilroy",
    countryCode: "IRL",
    status: "CONFIRMED",
    withdrawn: false,
    disqualified: false,
    isAlternate: false,
    cutMade: null,
    finalPosition: null,
    earnings: null,
    teeTime: null,
    externalRef: { source: "sportsdataio", externalId: "1" },
    ...overrides,
  }
}

describe("validateFieldEntries", () => {
  it("keeps reconcilable, unique entries", () => {
    const result = validateFieldEntries([
      entry({ playerSlug: "rory-mcilroy" }),
      entry({ playerName: "Scottie Scheffler", playerSlug: "scottie-scheffler" }),
    ])

    expect(result.valid).toHaveLength(2)
    expect(result.dropped).toBe(0)
    expect(result.duplicates).toBe(0)
  })

  it("drops entries with an empty player slug", () => {
    const result = validateFieldEntries([
      entry({ playerSlug: "" }),
      entry({ playerSlug: "   " }),
      entry({ playerSlug: "valid-player" }),
    ])

    expect(result.valid).toHaveLength(1)
    expect(result.dropped).toBe(2)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it("removes duplicate players within one tournament field", () => {
    const result = validateFieldEntries([
      entry({ playerSlug: "rory-mcilroy" }),
      entry({ playerSlug: "rory-mcilroy" }),
      entry({ playerSlug: "rory-mcilroy" }),
    ])

    expect(result.valid).toHaveLength(1)
    expect(result.duplicates).toBe(2)
  })

  it("sanitizes implausible finishing positions to null without dropping the entry", () => {
    const result = validateFieldEntries([
      entry({ playerSlug: "a", finalPosition: 0 }),
      entry({ playerSlug: "b", finalPosition: -4 }),
      entry({ playerSlug: "c", finalPosition: 12.7 }),
    ])

    expect(result.valid).toHaveLength(3)
    expect(result.valid[0].finalPosition).toBeNull()
    expect(result.valid[1].finalPosition).toBeNull()
    expect(result.valid[2].finalPosition).toBe(12)
  })

  it("sanitizes negative earnings to null", () => {
    const result = validateFieldEntries([entry({ playerSlug: "a", earnings: -100 })])
    expect(result.valid[0].earnings).toBeNull()
  })

  it("caps retained issue notes at maxIssues", () => {
    const bad = Array.from({ length: 10 }, () => entry({ playerSlug: "" }))
    const result = validateFieldEntries(bad, 3)
    expect(result.dropped).toBe(10)
    expect(result.issues).toHaveLength(3)
  })
})
