/**
 * Domain model for betting data (normalized from SportsDataIO BettingEvents).
 *
 * The provider nests markets under events and outcomes under markets, and it
 * scrambles payout VALUES on the trial tier. These domain types preserve the
 * full structure while carrying an explicit `available` flag on every
 * scramble-prone node: when false, the value fields are null and the UI must
 * present the item as "unavailable on the current tier" rather than blank or,
 * worse, fabricated. Real payouts flow automatically once a production key is
 * installed — no code change required.
 */

/** A single selection within a market (typically a player to win outright). */
export interface DomainBettingOutcome {
  /** Provider BettingOutcomeID, the idempotency key. */
  externalId: string
  /** Provider PlayerID this selection is about, or null for non-player bets. */
  playerExternalId: number | null
  /** Deterministic slug derived from the label, used to resolve to a Player. */
  playerSlug: string | null
  label: string | null
  /** American odds; null when scrambled or absent. */
  payoutAmerican: number | null
  /** Decimal odds; null when scrambled or absent. */
  payoutDecimal: number | null
  /** True only when payout values were NOT scrambled. */
  available: boolean
}

/** A market within a betting event (e.g. "Tournament Winner"). */
export interface DomainBettingMarket {
  externalId: string
  betType: string | null
  name: string | null
  /** True only when the market descriptor was NOT scrambled. */
  available: boolean
  outcomes: DomainBettingOutcome[]
}

/** A bookmaker betting event tied to a tournament. */
export interface DomainBettingEvent {
  externalId: string
  /** Provider TournamentID, bridged to a CaddieIQ tournament downstream. */
  tournamentExternalId: number | null
  name: string | null
  startDate: Date | null
  markets: DomainBettingMarket[]
}
