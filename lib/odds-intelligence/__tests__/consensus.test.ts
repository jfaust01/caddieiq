/**
 * Unit tests for the pure consensus + signal engine. These lock the honesty
 * contract: consensus is the median across real books, fair probabilities are
 * de-vigged to sum to ~1, thin/stale books degrade confidence rather than being
 * hidden, and every signal traces to a real price.
 */
import { describe, expect, it } from "vitest"

import type { OddsQuoteRow } from "@/lib/repositories"
import {
  computeMarketView,
  computeSelectionConsensus,
  deriveSignals,
  gradeConfidence,
  VERIFIED_MIN_BOOKS,
} from "../consensus"

const NOW = new Date("2026-07-15T12:00:00Z")

function quote(overrides: Partial<OddsQuoteRow> & { decimalOdds: number }): OddsQuoteRow {
  const decimal = overrides.decimalOdds
  return {
    market: "TOURNAMENT_WINNER",
    bookmakerKey: overrides.bookmakerKey ?? "book",
    bookmakerTitle: overrides.bookmakerTitle ?? "Book",
    selection: overrides.selection ?? "Scottie Scheffler",
    selectionSlug: overrides.selectionSlug ?? "scottie-scheffler",
    playerId: overrides.playerId ?? null,
    decimalOdds: decimal,
    americanOdds: overrides.americanOdds ?? Math.round((decimal - 1) * 100),
    impliedProbability: overrides.impliedProbability ?? 1 / decimal,
    lastUpdate: overrides.lastUpdate ?? NOW,
  }
}

describe("computeSelectionConsensus", () => {
  it("returns null for an empty group", () => {
    expect(computeSelectionConsensus([])).toBeNull()
  })

  it("takes the median price across books and the best/worst range", () => {
    const c = computeSelectionConsensus([
      quote({ bookmakerKey: "a", bookmakerTitle: "A", decimalOdds: 8 }),
      quote({ bookmakerKey: "b", bookmakerTitle: "B", decimalOdds: 9 }),
      quote({ bookmakerKey: "c", bookmakerTitle: "C", decimalOdds: 10 }),
    ])!
    expect(c.bookCount).toBe(3)
    expect(c.consensusDecimal).toBe(9)
    expect(c.bestPrice.decimalOdds).toBe(10)
    expect(c.worstPrice.decimalOdds).toBe(8)
    expect(c.priceSpread).toBe(2)
    expect(c.books).toHaveLength(3)
  })

  it("dedupes multiple prices from the same book, keeping the freshest", () => {
    const c = computeSelectionConsensus([
      quote({ bookmakerKey: "a", decimalOdds: 8, lastUpdate: new Date("2026-07-15T10:00:00Z") }),
      quote({ bookmakerKey: "a", decimalOdds: 12, lastUpdate: new Date("2026-07-15T11:00:00Z") }),
    ])!
    expect(c.bookCount).toBe(1)
    expect(c.consensusDecimal).toBe(12)
  })
})

describe("gradeConfidence", () => {
  it("is unavailable with no books", () => {
    expect(gradeConfidence(0, NOW, NOW)).toBe("unavailable")
  })
  it("is verified with enough fresh books", () => {
    expect(gradeConfidence(VERIFIED_MIN_BOOKS, NOW, NOW)).toBe("verified")
  })
  it("is partial when the book is thin", () => {
    expect(gradeConfidence(1, NOW, NOW)).toBe("partial")
    expect(gradeConfidence(2, NOW, NOW)).toBe("partial")
  })
  it("is partial when the capture is stale even with many books", () => {
    const stale = new Date(NOW.getTime() - 48 * 3_600_000)
    expect(gradeConfidence(5, stale, NOW)).toBe("partial")
  })
})

describe("computeMarketView", () => {
  const quotes: OddsQuoteRow[] = [
    // Favourite ~ consensus 4.0 → implied 0.25
    quote({ selection: "A", selectionSlug: "a", bookmakerKey: "b1", decimalOdds: 4 }),
    quote({ selection: "A", selectionSlug: "a", bookmakerKey: "b2", decimalOdds: 4 }),
    quote({ selection: "A", selectionSlug: "a", bookmakerKey: "b3", decimalOdds: 4 }),
    // Mid ~ consensus 5.0 → implied 0.20
    quote({ selection: "B", selectionSlug: "b", bookmakerKey: "b1", decimalOdds: 5 }),
    quote({ selection: "B", selectionSlug: "b", bookmakerKey: "b2", decimalOdds: 5 }),
    quote({ selection: "B", selectionSlug: "b", bookmakerKey: "b3", decimalOdds: 5 }),
    // Longshot ~ consensus 10 → implied 0.10
    quote({ selection: "C", selectionSlug: "c", bookmakerKey: "b1", decimalOdds: 10 }),
    quote({ selection: "C", selectionSlug: "c", bookmakerKey: "b2", decimalOdds: 10 }),
    quote({ selection: "C", selectionSlug: "c", bookmakerKey: "b3", decimalOdds: 10 }),
  ]

  it("sorts selections by fair probability and de-vigs to sum ~1", () => {
    const view = computeMarketView("TOURNAMENT_WINNER", quotes, NOW, NOW)
    expect(view.confidence).toBe("verified")
    expect(view.bookCount).toBe(3)
    expect(view.selections.map((s) => s.selectionSlug)).toEqual(["a", "b", "c"])
    const sum = view.selections.reduce((acc, s) => acc + s.fairProbability, 0)
    expect(sum).toBeCloseTo(1, 6)
    // Favourite fair prob = 0.25 / (0.25+0.2+0.1) = 0.4545
    expect(view.selections[0].fairProbability).toBeCloseTo(0.4545, 3)
  })

  it("reports a real (>=1) overround only when a book prices a full margined field", () => {
    // One book prices a complete 2-runner market at 1.8 each: implied
    // 0.5556 + 0.5556 = 1.111 → a legitimate ~11% vig.
    const fullBook: OddsQuoteRow[] = [
      quote({ selection: "A", selectionSlug: "a", bookmakerKey: "b1", decimalOdds: 1.8 }),
      quote({ selection: "B", selectionSlug: "b", bookmakerKey: "b1", decimalOdds: 1.8 }),
    ]
    const view = computeMarketView("TOURNAMENT_WINNER", fullBook, NOW, NOW)
    expect(view.overround).not.toBeNull()
    // Margin = sum(1/d) - 1 = 1.111 - 1 = ~0.111 (a real, positive ~11% vig).
    expect(view.overround!).toBeGreaterThan(0)
    expect(view.overround!).toBeCloseTo(0.111, 2)
  })

  it("suppresses a misleading sub-100% overround from a sparsely-priced field", () => {
    // The synthetic 3-runner field above implies only 0.55 per book — not a
    // real vig, so overround must be null rather than a bogus negative margin.
    const view = computeMarketView("TOURNAMENT_WINNER", quotes, NOW, NOW)
    expect(view.overround).toBeNull()
  })

  it("emits a favourite signal naming the top selection", () => {
    const view = computeMarketView("TOURNAMENT_WINNER", quotes, NOW, NOW)
    const fav = view.signals.find((s) => s.kind === "favorite")
    expect(fav?.selection).toBe("A")
  })
})

describe("deriveSignals", () => {
  it("is empty for no selections", () => {
    expect(deriveSignals([])).toEqual([])
  })
})
