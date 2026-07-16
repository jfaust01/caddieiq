/**
 * Odds Intelligence engine types.
 *
 * The engine turns *verified* multi-book quotes into a market view: per-player
 * consensus probability (de-vigged), price dispersion across books, and derived
 * signals (favourite, best available price, book disagreement). It never
 * invents a price or a probability — every output traces to real quotes, and a
 * thin book (few sportsbooks) or stale capture is reported as reduced
 * confidence rather than hidden.
 */

import type { OddsMarket } from "@/lib/repositories"

/**
 * How much we trust a market view, mirroring the honest vocabulary used by the
 * Weather Intelligence engine:
 *   - `verified`: a healthy multi-book consensus (>= 3 books) captured recently.
 *   - `partial`: real but thin (1–2 books) or somewhat stale — usable with care.
 *   - `unavailable`: no verified quotes for this market.
 */
export type OddsConfidence = "verified" | "partial" | "unavailable"

/** One bookmaker's price for a selection, widened for display. */
export interface BookPrice {
  bookmakerKey: string
  bookmakerTitle: string
  decimalOdds: number
  americanOdds: number
  /** Provider last-update for this book's price. */
  lastUpdate: Date
}

/** The consensus view for a single selection (player) in one market. */
export interface SelectionConsensus {
  selection: string
  selectionSlug: string
  playerId: string | null
  /** Number of distinct bookmakers pricing this selection. */
  bookCount: number
  /** Consensus decimal odds (median across books). */
  consensusDecimal: number
  /** Consensus American odds derived from the consensus decimal. */
  consensusAmerican: number
  /** De-vigged (fair) win probability, 0..1, renormalized across the field. */
  fairProbability: number
  /** Raw implied probability (median across books), incl. margin, 0..1. */
  impliedProbability: number
  /** Best (highest) decimal price available and the book offering it. */
  bestPrice: BookPrice
  /** Worst (lowest) decimal price available and the book offering it. */
  worstPrice: BookPrice
  /** Spread between best and worst decimal price (a disagreement measure). */
  priceSpread: number
  /** All book prices, sorted best → worst. */
  books: BookPrice[]
}

/** A derived, human-facing market signal. */
export interface MarketSignal {
  kind: "favorite" | "value" | "disagreement"
  selection: string
  playerId: string | null
  /** Short, factual description (no hype, no fabricated certainty). */
  detail: string
}

/** The full market view for one tournament market. */
export interface MarketView {
  market: OddsMarket
  confidence: OddsConfidence
  /** Distinct bookmakers contributing to this market. */
  bookCount: number
  /** The book's total margin (overround), when computable. */
  overround: number | null
  /** When the underlying quotes were last captured. */
  capturedAt: Date | null
  /** Selections sorted by fair probability, most likely first. */
  selections: SelectionConsensus[]
  /** Derived signals worth surfacing. */
  signals: MarketSignal[]
}

/** The engine's answer for a tournament: markets + an overall confidence. */
export interface TournamentOddsView {
  tournamentId: string
  confidence: OddsConfidence
  capturedAt: Date | null
  markets: MarketView[]
  /** Human-readable reason when confidence is not `verified`. */
  note: string | null
}

/** A single player's market standing within a tournament (player page). */
export interface PlayerOddsView {
  tournamentId: string | null
  tournamentName: string | null
  sportTitle: string | null
  market: OddsMarket
  confidence: OddsConfidence
  consensus: SelectionConsensus | null
  /** Rank by fair probability within the field (1 = favourite), when known. */
  fieldRank: number | null
  fieldSize: number | null
  capturedAt: Date | null
}
