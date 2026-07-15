import { describe, expect, it } from "vitest"

import { validateSeasonStats } from "../statistics-validator"
import type { PlayerSeasonStat } from "@/lib/domain/statistics/types"

/** Build a season-stat row with sensible defaults, overridable per test. */
function stat(overrides: Partial<PlayerSeasonStat> = {}): PlayerSeasonStat {
  return {
    playerName: "Rory McIlroy",
    playerSlug: "rory-mcilroy",
    season: 2025,
    worldRanking: 1,
    worldRankingLastWeek: 1,
    events: 31,
    averagePoints: 3.7,
    totalPoints: 279.5,
    pointsGained: 0,
    pointsLost: 0,
    externalRef: { source: "sportsdataio", externalId: "40000965" },
    ...overrides,
  }
}

describe("validateSeasonStats", () => {
  it("keeps reconcilable, unique rows", () => {
    const result = validateSeasonStats([
      stat({ playerSlug: "rory-mcilroy" }),
      stat({ playerName: "Scottie Scheffler", playerSlug: "scottie-scheffler" }),
    ])

    expect(result.valid).toHaveLength(2)
    expect(result.dropped).toBe(0)
    expect(result.duplicates).toBe(0)
  })

  it("drops rows with an empty player slug", () => {
    const result = validateSeasonStats([
      stat({ playerSlug: "" }),
      stat({ playerSlug: "   " }),
      stat({ playerSlug: "valid-player" }),
    ])

    expect(result.valid).toHaveLength(1)
    expect(result.dropped).toBe(2)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it("removes duplicate players within one season", () => {
    const result = validateSeasonStats([
      stat({ playerSlug: "rory-mcilroy" }),
      stat({ playerSlug: "rory-mcilroy" }),
    ])

    expect(result.valid).toHaveLength(1)
    expect(result.duplicates).toBe(1)
  })

  it("sanitizes implausible rankings to null without dropping the row", () => {
    const result = validateSeasonStats([
      stat({ playerSlug: "a", worldRanking: 0 }),
      stat({ playerSlug: "b", worldRanking: -3 }),
      stat({ playerSlug: "c", worldRanking: 12.9 }),
    ])

    expect(result.valid).toHaveLength(3)
    expect(result.valid[0].worldRanking).toBeNull()
    expect(result.valid[1].worldRanking).toBeNull()
    expect(result.valid[2].worldRanking).toBe(12)
  })

  it("sanitizes negative event counts to null but preserves points (which may be negative)", () => {
    const result = validateSeasonStats([
      stat({ playerSlug: "a", events: -1, pointsGained: -10, totalPoints: -5 }),
    ])
    expect(result.valid[0].events).toBeNull()
    expect(result.valid[0].pointsGained).toBe(-10)
    expect(result.valid[0].totalPoints).toBe(-5)
  })

  it("caps retained issue notes at maxIssues", () => {
    const bad = Array.from({ length: 10 }, () => stat({ playerSlug: "" }))
    const result = validateSeasonStats(bad, 3)
    expect(result.dropped).toBe(10)
    expect(result.issues).toHaveLength(3)
  })
})
