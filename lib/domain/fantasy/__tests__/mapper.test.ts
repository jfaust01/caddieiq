import { describe, expect, it } from "vitest"

import { mapSportsDataDfsSlate, mapSportsDataProjection } from "../mapper"
import type {
  SdioDfsSlate,
  SdioPlayerTournamentProjection,
} from "@/lib/providers/sportsdataio/types"

function projection(
  overrides: Partial<SdioPlayerTournamentProjection> = {},
): SdioPlayerTournamentProjection {
  return {
    PlayerID: 40003252,
    TournamentID: 777,
    Name: "Ludvig Aberg",
    FantasyPointsDraftKings: 82.5,
    FantasyPointsFanDuel: 79.1,
    ...overrides,
  }
}

describe("mapSportsDataProjection", () => {
  it("maps a plausible projection as available", () => {
    const p = mapSportsDataProjection(projection())
    expect(p.available).toBe(true)
    expect(p.fantasyPointsDraftKings).toBe(82.5)
    expect(p.fantasyPointsFanDuel).toBe(79.1)
    expect(p.externalId).toBe("777:40003252")
    expect(p.playerSlug).toBe("ludvig-aberg")
  })

  it("gates an implausible (scrambled) projection: values nulled, unavailable", () => {
    const p = mapSportsDataProjection(
      projection({ FantasyPointsDraftKings: 999999, FantasyPointsFanDuel: -500 }),
    )
    expect(p.available).toBe(false)
    expect(p.fantasyPointsDraftKings).toBeNull()
    expect(p.fantasyPointsFanDuel).toBeNull()
  })

  it("stays available when at least one value is plausible", () => {
    const p = mapSportsDataProjection(
      projection({ FantasyPointsDraftKings: 60, FantasyPointsFanDuel: 999999 }),
    )
    expect(p.available).toBe(true)
    expect(p.fantasyPointsDraftKings).toBe(60)
    expect(p.fantasyPointsFanDuel).toBeNull()
  })

  it("treats absent projections as unavailable, not zero", () => {
    const p = mapSportsDataProjection(
      projection({ FantasyPointsDraftKings: undefined, FantasyPointsFanDuel: undefined }),
    )
    expect(p.available).toBe(false)
    expect(p.fantasyPointsDraftKings).toBeNull()
  })
})

function slate(overrides: Partial<SdioDfsSlate> = {}): SdioDfsSlate {
  return {
    SlateID: 333,
    TournamentID: 777,
    OperatorName: "DraftKings",
    DfsSlatePlayers: [
      {
        SlatePlayerID: 1,
        PlayerID: 40003252,
        OperatorPlayerID: "dk-aberg",
        OperatorPlayerName: "Ludvig Aberg",
        OperatorSalary: 9800,
      },
    ],
    ...overrides,
  }
}

describe("mapSportsDataDfsSlate", () => {
  it("flattens slate players into ungated salary rows (salaries are real)", () => {
    const rows = mapSportsDataDfsSlate(slate())
    expect(rows).toHaveLength(1)
    expect(rows[0].operator).toBe("DraftKings")
    expect(rows[0].salary).toBe(9800)
    expect(rows[0].externalId).toBe("333:dk-aberg")
    expect(rows[0].playerExternalId).toBe(40003252)
    expect(rows[0].playerSlug).toBe("ludvig-aberg")
  })

  it("keeps a player with an absent salary (null, not dropped)", () => {
    const rows = mapSportsDataDfsSlate(
      slate({
        DfsSlatePlayers: [
          {
            SlatePlayerID: 2,
            PlayerID: 1,
            OperatorPlayerID: "dk-x",
            OperatorPlayerName: "Someone",
            OperatorSalary: undefined,
          },
        ],
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].salary).toBeNull()
  })

  it("skips slate players with no operator key", () => {
    const rows = mapSportsDataDfsSlate(
      slate({
        DfsSlatePlayers: [
          { PlayerID: 1, OperatorPlayerName: "No Key" } as never,
        ],
      }),
    )
    expect(rows).toHaveLength(0)
  })
})
