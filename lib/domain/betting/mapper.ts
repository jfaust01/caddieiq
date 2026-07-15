import type {
  SdioBettingEvent,
  SdioBettingMarket,
  SdioBettingOutcome,
} from "@/lib/providers/sportsdataio/types"

import {
  cleanUnscrambledString,
  hasScrambledDescriptor,
  isScrambledText,
} from "@/lib/domain/shared"
import { parseDate, slugify } from "@/lib/domain/shared/utils"

import type {
  DomainBettingEvent,
  DomainBettingMarket,
  DomainBettingOutcome,
} from "./types"

/** A numeric payout is trustworthy only when finite and not the text sentinel. */
function cleanPayout(value: number | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return value
}

/**
 * Map one raw outcome. An outcome is `available` only when its label is not
 * scrambled AND at least one payout survived. When unavailable, payouts are
 * nulled so no fabricated odds are ever persisted.
 */
export function mapBettingOutcome(raw: SdioBettingOutcome): DomainBettingOutcome {
  const label = cleanUnscrambledString(raw.Label ?? raw.Value ?? raw.SportsBook)
  const american = cleanPayout(raw.PayoutAmerican)
  const decimal = cleanPayout(raw.PayoutDecimal)

  // The provider marks scrambled payouts either with a text sentinel in the
  // label or by withholding numbers. Available requires a real label + a price.
  const scrambled =
    isScrambledText(raw.Label) ||
    isScrambledText(raw.Value) ||
    (american === null && decimal === null)

  const available = !scrambled
  const playerExternalId =
    typeof raw.PlayerID === "number" && raw.PlayerID > 0 ? raw.PlayerID : null

  return {
    externalId: String(raw.BettingOutcomeID),
    playerExternalId,
    playerSlug: label ? slugify(label) : null,
    label,
    payoutAmerican: available ? american : null,
    payoutDecimal: available ? decimal : null,
    available,
  }
}

/** Map one raw market and its nested outcomes. */
export function mapBettingMarket(raw: SdioBettingMarket): DomainBettingMarket {
  const available = !hasScrambledDescriptor(raw as Record<string, unknown>, [
    "BetType",
    "Name",
  ])
  return {
    externalId: String(raw.BettingMarketID),
    betType: available ? cleanUnscrambledString(raw.BetType) : null,
    name: available ? cleanUnscrambledString(raw.Name) : null,
    available,
    outcomes: (raw.BettingOutcomes ?? []).map(mapBettingOutcome),
  }
}

/**
 * Map a raw SportsDataIO betting event into the domain model, preserving the
 * full event → market → outcome structure. Values scrambled by the trial tier
 * are nulled and flagged `available: false`; the structure is always retained
 * so real payouts flow the moment a production key is installed.
 */
export function mapSportsDataBettingEvent(raw: SdioBettingEvent): DomainBettingEvent {
  return {
    externalId: String(raw.BettingEventID),
    tournamentExternalId:
      typeof raw.TournamentID === "number" ? raw.TournamentID : null,
    name: cleanUnscrambledString(raw.Name),
    startDate: parseDate(raw.StartDate),
    markets: (raw.BettingMarkets ?? []).map(mapBettingMarket),
  }
}
