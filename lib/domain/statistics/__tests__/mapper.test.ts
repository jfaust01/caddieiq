import { describe, expect, it } from "vitest"

import { mapSportsDataSeasonStat } from "../mapper"
import { UNKNOWN_STAT_PLAYER_NAME } from "../constants"
import type { SdioPlayerSeasonStats } from "@/lib/providers/sportsdataio/types"

/** A representative raw SportsDataIO season-stats row. */
function raw(overrides: Partial<SdioPlayerSeasonStats> = {}): SdioPlayerSeasonStats {
  return {
    PlayerSeasonID: 10833,
    Season: 2025,
    PlayerID: 40000965,
    Name: "Rory McIlroy",
    WorldGolfRank: 1,
    WorldGolfRankLastWeek: 1,
    Events: 31,
    AveragePoints: 3.7,
    TotalPoints: 279.5,
    PointsLost: 0,
    PointsGained: 0,
    ...overrides,
  }
}

describe("mapSportsDataSeasonStat", () => {
  it("translates a full row into a domain stat with a reconciliation slug", () => {
    const stat = mapSportsDataSeasonStat(raw(), 2025)

    expect(stat.playerName).toBe("Rory McIlroy")
    expect(stat.playerSlug).toBe("rory-mcilroy")
    expect(stat.season).toBe(2025)
    expect(stat.worldRanking).toBe(1)
    expect(stat.worldRankingLastWeek).toBe(1)
    expect(stat.events).toBe(31)
    expect(stat.averagePoints).toBe(3.7)
    expect(stat.totalPoints).toBe(279.5)
    expect(stat.externalRef).toEqual({ source: "sportsdataio", externalId: "40000965" })
  })

  it("falls back to the requested season when the row omits one", () => {
    const stat = mapSportsDataSeasonStat(raw({ Season: undefined }), 2023)
    expect(stat.season).toBe(2023)
  })

  it("maps absent metrics to null rather than inventing them", () => {
    const stat = mapSportsDataSeasonStat(
      raw({
        WorldGolfRank: undefined,
        Events: undefined,
        AveragePoints: undefined,
        TotalPoints: undefined,
      }),
      2025,
    )
    expect(stat.worldRanking).toBeNull()
    expect(stat.events).toBeNull()
    expect(stat.averagePoints).toBeNull()
    expect(stat.totalPoints).toBeNull()
  })

  it("uses a placeholder name when the row has no usable name", () => {
    const stat = mapSportsDataSeasonStat(raw({ Name: "   " }), 2025)
    expect(stat.playerName).toBe(UNKNOWN_STAT_PLAYER_NAME)
  })
})
