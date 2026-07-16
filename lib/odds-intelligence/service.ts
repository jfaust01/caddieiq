/**
 * Odds Intelligence service (server-only).
 *
 * The read side of the engine: it pulls *verified* stored quotes from the
 * repository and runs the pure consensus core to produce tournament- and
 * player-level market views. It performs no fabrication — if there are no
 * verified quotes it returns an `unavailable` view with an honest note, exactly
 * like the Weather Intelligence service does for missing forecasts.
 */

import "server-only"

import {
  getOddsRepository,
  type OddsEventRow,
  type OddsMarket,
  type OddsQuoteRow,
  type OddsRepository,
} from "@/lib/repositories"
import { computeMarketView } from "./consensus"
import type {
  MarketView,
  OddsConfidence,
  PlayerOddsView,
  TournamentOddsView,
} from "./types"

/** Confidence precedence, strongest first. */
const CONFIDENCE_RANK: Record<OddsConfidence, number> = {
  verified: 2,
  partial: 1,
  unavailable: 0,
}

/** The strongest confidence across a set of markets. */
function overallConfidence(markets: readonly MarketView[]): OddsConfidence {
  let best: OddsConfidence = "unavailable"
  for (const m of markets) {
    if (CONFIDENCE_RANK[m.confidence] > CONFIDENCE_RANK[best]) best = m.confidence
  }
  return best
}

export class OddsIntelligenceService {
  constructor(
    private readonly repository: OddsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  static create(): OddsIntelligenceService {
    return new OddsIntelligenceService(getOddsRepository())
  }

  /**
   * Build the market view for a tournament. When several provider events map to
   * the same tournament, the most recently captured event wins (freshest book).
   */
  async getTournamentOddsView(tournamentId: string): Promise<TournamentOddsView> {
    const events = await this.repository.findEventsByTournamentId(tournamentId)
    const now = this.now()

    if (events.length === 0) {
      return {
        tournamentId,
        confidence: "unavailable",
        capturedAt: null,
        markets: [],
        note: "No verified betting market has been captured for this tournament yet.",
      }
    }

    // Freshest event (findEventsByTournamentId already orders desc, but be safe).
    const event = events.reduce((latest, e) =>
      (e.capturedAt?.getTime() ?? 0) > (latest.capturedAt?.getTime() ?? 0) ? e : latest,
    )

    const markets = this.buildMarkets(event.quotes, event.capturedAt, now)
    const confidence = overallConfidence(markets)
    return {
      tournamentId,
      confidence,
      capturedAt: event.capturedAt,
      markets,
      note:
        confidence === "verified"
          ? null
          : confidence === "partial"
            ? "Odds are from a thin book (few sportsbooks) or a stale capture — treat consensus as indicative."
            : "No verified betting market is currently available for this tournament.",
    }
  }

  /** Group an event's quotes by market and compute each market's view. */
  private buildMarkets(
    quotes: readonly OddsQuoteRow[],
    capturedAt: Date | null,
    now: Date,
  ): MarketView[] {
    const byMarket = new Map<OddsMarket, OddsQuoteRow[]>()
    for (const quote of quotes) {
      const list = byMarket.get(quote.market)
      if (list) list.push(quote)
      else byMarket.set(quote.market, [quote])
    }
    const markets: MarketView[] = []
    for (const [market, marketQuotes] of byMarket) {
      markets.push(computeMarketView(market, marketQuotes, capturedAt, now))
    }
    // Winner market first, then by book breadth.
    markets.sort((a, b) => {
      if (a.market === "TOURNAMENT_WINNER") return -1
      if (b.market === "TOURNAMENT_WINNER") return 1
      return b.bookCount - a.bookCount
    })
    return markets
  }

  /**
   * Build a player's standing in the tournament-winner market. Field rank is
   * computed against the full event field so the number is meaningful, not just
   * the player's own price in isolation.
   */
  async getPlayerOddsView(playerId: string): Promise<PlayerOddsView | null> {
    const quotes = await this.repository.findQuotesByPlayerId(playerId)
    if (quotes.length === 0) return null
    const now = this.now()

    // Focus on the most recent event the player appears in.
    const latest = quotes.reduce((a, b) =>
      (b.capturedAt?.getTime() ?? 0) > (a.capturedAt?.getTime() ?? 0) ? b : a,
    )
    // Reconstruct the full event field by id — independent of tournament
    // linkage — so the player's de-vigged probability and rank are computed
    // against the real field, never against their own price in isolation (which
    // would normalize a lone selection to a meaningless 100%).
    const event = await this.repository.findEventById(latest.eventId)
    const field: MarketView | null = event
      ? computeMarketView(
          "TOURNAMENT_WINNER",
          event.quotes.filter((q) => q.market === "TOURNAMENT_WINNER"),
          event.capturedAt,
          now,
        )
      : null

    // The player's consensus is their own row within the field view. If the
    // field can't be reconstructed we have no basis for a fair probability, so
    // there is no consensus to report rather than a fabricated one.
    let consensus: PlayerOddsView["consensus"] = null
    let fieldRank: number | null = null
    let fieldSize: number | null = null
    if (field) {
      fieldSize = field.selections.length
      const idx = field.selections.findIndex((s) => s.selectionSlug === latest.selectionSlug)
      fieldRank = idx >= 0 ? idx + 1 : null
      consensus = idx >= 0 ? field.selections[idx] : null
    }

    return {
      tournamentId: latest.tournamentId,
      tournamentName: latest.tournamentName,
      sportTitle: latest.sportTitle,
      market: "TOURNAMENT_WINNER",
      confidence: field?.confidence ?? "unavailable",
      consensus,
      fieldRank,
      fieldSize,
      capturedAt: latest.capturedAt,
    }
  }
}

/** Convenience for server components / route handlers. */
export function getOddsIntelligenceService(): OddsIntelligenceService {
  return OddsIntelligenceService.create()
}
