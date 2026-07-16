/**
 * Pure consensus + signal derivation for the Odds Intelligence engine.
 *
 * Input: verified per-book quotes (real prices only). Output: a de-vigged
 * market view. No I/O, no randomness; the only ambient input is an injectable
 * `now` used solely to grade freshness. Every number traces back to a real
 * bookmaker price — a thin or stale book lowers confidence, it is never
 * back-filled with a guess.
 */

import type { OddsMarket, OddsQuoteRow } from "@/lib/repositories"
import {
  decimalToAmerican,
  devig,
  impliedProbabilityFromDecimal,
  median,
  overround as computeOverround,
} from "./math"
import type {
  BookPrice,
  MarketSignal,
  MarketView,
  OddsConfidence,
  SelectionConsensus,
} from "./types"

/** Books needed for a full-confidence consensus. */
export const VERIFIED_MIN_BOOKS = 3
/** Max capture age (hours) before a market is considered stale → partial. */
export const FRESH_MAX_AGE_HOURS = 24
/** A price is a "value" outlier when its edge over consensus exceeds this. */
export const VALUE_EDGE_THRESHOLD = 0.15
/** Books disagree "notably" when best/worst implied prob differ by this much. */
export const DISAGREEMENT_THRESHOLD = 0.05

const MS_PER_HOUR = 3_600_000

/** Build a {@link BookPrice} from a stored quote. */
function toBookPrice(quote: OddsQuoteRow): BookPrice {
  return {
    bookmakerKey: quote.bookmakerKey,
    bookmakerTitle: quote.bookmakerTitle,
    decimalOdds: quote.decimalOdds,
    americanOdds: quote.americanOdds,
    lastUpdate: quote.lastUpdate,
  }
}

/**
 * Collapse one selection's per-book quotes into a consensus. `fairProbability`
 * is filled in later by {@link computeMarketView} once the whole field is known
 * (de-vigging is a field-level operation); here it is set to the raw implied
 * value as a placeholder.
 */
export function computeSelectionConsensus(
  quotes: readonly OddsQuoteRow[],
): SelectionConsensus | null {
  if (quotes.length === 0) return null

  // One price per bookmaker (guard against accidental dupes; keep the freshest).
  const byBook = new Map<string, OddsQuoteRow>()
  for (const quote of quotes) {
    const existing = byBook.get(quote.bookmakerKey)
    if (!existing || quote.lastUpdate.getTime() > existing.lastUpdate.getTime()) {
      byBook.set(quote.bookmakerKey, quote)
    }
  }
  const deduped = [...byBook.values()]
  const decimals = deduped.map((q) => q.decimalOdds)
  const consensusDecimal = median(decimals)
  if (consensusDecimal == null) return null

  const books = deduped.map(toBookPrice).sort((a, b) => b.decimalOdds - a.decimalOdds)
  const impliedMedian = median(decimals.map(impliedProbabilityFromDecimal)) ?? 0

  const first = quotes[0]
  return {
    selection: first.selection,
    selectionSlug: first.selectionSlug,
    playerId: first.playerId,
    bookCount: deduped.length,
    consensusDecimal,
    consensusAmerican: decimalToAmerican(consensusDecimal),
    fairProbability: impliedMedian, // replaced with de-vigged value at field level
    impliedProbability: impliedMedian,
    bestPrice: books[0],
    worstPrice: books[books.length - 1],
    priceSpread: books[0].decimalOdds - books[books.length - 1].decimalOdds,
    books,
  }
}

/** Grade market confidence from breadth (books) and freshness (capture age). */
export function gradeConfidence(
  bookCount: number,
  capturedAt: Date | null,
  now: Date,
): OddsConfidence {
  if (bookCount === 0) return "unavailable"
  const ageHours = capturedAt ? (now.getTime() - capturedAt.getTime()) / MS_PER_HOUR : Infinity
  const fresh = ageHours <= FRESH_MAX_AGE_HOURS
  if (bookCount >= VERIFIED_MIN_BOOKS && fresh) return "verified"
  return "partial"
}

/** Derive factual market signals from a completed set of selections. */
export function deriveSignals(
  selections: readonly SelectionConsensus[],
): MarketSignal[] {
  if (selections.length === 0) return []
  const signals: MarketSignal[] = []

  // Favourite: highest fair probability.
  const favourite = selections.reduce((best, s) =>
    s.fairProbability > best.fairProbability ? s : best,
  )
  signals.push({
    kind: "favorite",
    selection: favourite.selection,
    playerId: favourite.playerId,
    detail: `Market favourite at ${(favourite.fairProbability * 100).toFixed(1)}% fair win probability (${favourite.bookCount} books).`,
  })

  // Value: best available price implies materially more than consensus.
  for (const s of selections) {
    if (s.bookCount < 2) continue
    const bestImplied = impliedProbabilityFromDecimal(s.bestPrice.decimalOdds)
    const edge = s.fairProbability > 0 ? (s.fairProbability - bestImplied) / s.fairProbability : 0
    if (edge >= VALUE_EDGE_THRESHOLD) {
      signals.push({
        kind: "value",
        selection: s.selection,
        playerId: s.playerId,
        detail: `Best price ${s.bestPrice.decimalOdds.toFixed(2)} at ${s.bestPrice.bookmakerTitle} sits ${(edge * 100).toFixed(0)}% above the field-implied consensus.`,
      })
    }
  }

  // Disagreement: widest best/worst implied gap among multi-book selections.
  const multi = selections.filter((s) => s.bookCount >= 2)
  if (multi.length > 0) {
    const widest = multi.reduce((max, s) => {
      const gap =
        impliedProbabilityFromDecimal(s.worstPrice.decimalOdds) -
        impliedProbabilityFromDecimal(s.bestPrice.decimalOdds)
      const maxGap =
        impliedProbabilityFromDecimal(max.worstPrice.decimalOdds) -
        impliedProbabilityFromDecimal(max.bestPrice.decimalOdds)
      return gap > maxGap ? s : max
    })
    const gap =
      impliedProbabilityFromDecimal(widest.worstPrice.decimalOdds) -
      impliedProbabilityFromDecimal(widest.bestPrice.decimalOdds)
    if (gap >= DISAGREEMENT_THRESHOLD) {
      signals.push({
        kind: "disagreement",
        selection: widest.selection,
        playerId: widest.playerId,
        detail: `Books disagree on ${widest.selection}: prices range ${widest.worstPrice.decimalOdds.toFixed(2)}–${widest.bestPrice.decimalOdds.toFixed(2)}.`,
      })
    }
  }

  return signals
}

/**
 * Build the full market view for one market from all its quotes. De-vigging is
 * applied across the field so fair probabilities sum to ~1.
 */
export function computeMarketView(
  market: OddsMarket,
  quotes: readonly OddsQuoteRow[],
  capturedAt: Date | null,
  now: Date,
): MarketView {
  // Group quotes by selection.
  const bySelection = new Map<string, OddsQuoteRow[]>()
  for (const quote of quotes) {
    const list = bySelection.get(quote.selectionSlug)
    if (list) list.push(quote)
    else bySelection.set(quote.selectionSlug, [quote])
  }

  const selections: SelectionConsensus[] = []
  for (const group of bySelection.values()) {
    const consensus = computeSelectionConsensus(group)
    if (consensus) selections.push(consensus)
  }

  // De-vig across the field: renormalize raw implied probabilities to sum to 1.
  const rawProbs = selections.map((s) => s.impliedProbability)
  const fair = devig(rawProbs)
  selections.forEach((s, i) => {
    s.fairProbability = fair[i]
  })
  selections.sort((a, b) => b.fairProbability - a.fairProbability)

  // Overround is a per-book property: each book's own listed prices imply a
  // total > 100%, the "vig". Summing one representative price per selection
  // across books that list disjoint subsets of the field understates it. So we
  // compute each book's own overround from the prices it actually offered, then
  // report the median across books. Only books that price a meaningful slice of
  // the field (>= 2 selections) contribute; otherwise overround is left null.
  const pricesByBook = new Map<string, number[]>()
  for (const quote of quotes) {
    const list = pricesByBook.get(quote.bookmakerKey)
    if (list) list.push(quote.decimalOdds)
    else pricesByBook.set(quote.bookmakerKey, [quote.decimalOdds])
  }
  const perBookOverrounds: number[] = []
  for (const prices of pricesByBook.values()) {
    if (prices.length < 2) continue
    const ov = computeOverround(prices)
    // `overround` is the margin sum(1/d) - 1. A real book's listed prices always
    // imply > 100%, i.e. a positive margin. A non-positive margin means the book
    // priced only a slice of the field (common for out-of-window futures), so its
    // "overround" is not a meaningful vig — exclude it rather than publish a
    // misleading sub-100% number.
    if (ov != null && ov > 0) perBookOverrounds.push(ov)
  }
  const bookCount = pricesByBook.size
  const overroundValue = median(perBookOverrounds)

  return {
    market,
    confidence: gradeConfidence(bookCount, capturedAt, now),
    bookCount,
    overround: overroundValue,
    capturedAt,
    selections,
    signals: deriveSignals(selections),
  }
}
