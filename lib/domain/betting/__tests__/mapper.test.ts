import { describe, expect, it } from "vitest"

import { mapSportsDataBettingEvent } from "../mapper"
import type { SdioBettingEvent } from "@/lib/providers/sportsdataio/types"

/** A representative raw betting event with one market and one real outcome. */
function raw(overrides: Partial<SdioBettingEvent> = {}): SdioBettingEvent {
  return {
    BettingEventID: 5001,
    TournamentID: 777,
    Name: "The Open Championship",
    StartDate: "2026-07-16T00:00:00",
    BettingMarkets: [
      {
        BettingMarketID: 9001,
        BetType: "Tournament Winner",
        Name: "Outright Winner",
        BettingOutcomes: [
          {
            BettingOutcomeID: 12001,
            PlayerID: 40003252,
            Label: "Ludvig Aberg",
            PayoutAmerican: 1200,
            PayoutDecimal: 13,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe("mapSportsDataBettingEvent", () => {
  it("translates a full event/market/outcome tree with real payouts", () => {
    const event = mapSportsDataBettingEvent(raw())
    expect(event.externalId).toBe("5001")
    expect(event.tournamentExternalId).toBe(777)
    expect(event.name).toBe("The Open Championship")
    expect(event.startDate).toBeInstanceOf(Date)

    const market = event.markets[0]
    expect(market.available).toBe(true)
    expect(market.betType).toBe("Tournament Winner")

    const outcome = market.outcomes[0]
    expect(outcome.available).toBe(true)
    expect(outcome.payoutAmerican).toBe(1200)
    expect(outcome.payoutDecimal).toBe(13)
    expect(outcome.playerExternalId).toBe(40003252)
    expect(outcome.playerSlug).toBe("ludvig-aberg")
  })

  it("gates a scrambled market descriptor: available false, descriptor nulled", () => {
    const event = mapSportsDataBettingEvent(
      raw({
        BettingMarkets: [
          {
            BettingMarketID: 9002,
            BetType: "Scrambled",
            Name: "Scrambled",
            BettingOutcomes: [],
          },
        ],
      }),
    )
    const market = event.markets[0]
    expect(market.available).toBe(false)
    expect(market.betType).toBeNull()
    expect(market.name).toBeNull()
  })

  it("gates a scrambled outcome: available false, payouts nulled, never fabricated", () => {
    const event = mapSportsDataBettingEvent(
      raw({
        BettingMarkets: [
          {
            BettingMarketID: 9003,
            BetType: "Tournament Winner",
            Name: "Outright Winner",
            BettingOutcomes: [
              {
                BettingOutcomeID: 12002,
                PlayerID: 40003252,
                Label: "Scrambled",
                Value: "Scrambled",
              },
            ],
          },
        ],
      }),
    )
    const outcome = event.markets[0].outcomes[0]
    expect(outcome.available).toBe(false)
    expect(outcome.payoutAmerican).toBeNull()
    expect(outcome.payoutDecimal).toBeNull()
  })

  it("treats a missing payout as unavailable rather than zero odds", () => {
    const event = mapSportsDataBettingEvent(
      raw({
        BettingMarkets: [
          {
            BettingMarketID: 9004,
            BetType: "Tournament Winner",
            BettingOutcomes: [
              { BettingOutcomeID: 12003, PlayerID: 1, Label: "Someone" },
            ],
          },
        ],
      }),
    )
    const outcome = event.markets[0].outcomes[0]
    expect(outcome.available).toBe(false)
    expect(outcome.payoutAmerican).toBeNull()
  })

  it("normalizes a non-player outcome id to null", () => {
    const event = mapSportsDataBettingEvent(
      raw({
        BettingMarkets: [
          {
            BettingMarketID: 9005,
            BetType: "Top 5 Finish",
            BettingOutcomes: [
              {
                BettingOutcomeID: 12004,
                PlayerID: 0,
                Label: "The Field",
                PayoutAmerican: -150,
                PayoutDecimal: 1.67,
              },
            ],
          },
        ],
      }),
    )
    const outcome = event.markets[0].outcomes[0]
    expect(outcome.playerExternalId).toBeNull()
    expect(outcome.available).toBe(true)
  })
})
