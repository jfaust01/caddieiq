/**
 * Adapter: Betting Value → Explanation (honest degradation).
 *
 * A true betting *value* model — a modeled edge of CaddieIQ's win probability
 * vs. the book's price — is not implemented yet (see MODELS.md §2.3). What the
 * platform holds today is the de-vigged market *consensus* from Odds
 * Intelligence. This adapter surfaces exactly that (fair probability, field
 * rank, book agreement, price dispersion) and states plainly, as a limitation,
 * that no edge has been computed. It never presents the market as a CaddieIQ
 * value call.
 */

import type { PlayerOddsView } from "@/lib/odds-intelligence/types"
import { fromVerified } from "../confidence"
import { buildHeadline, emptyNarrative, roundOrNull, round1 } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, Explanation, ExplanationSubject, Limitation } from "../types"

export function toBettingValueExplanation(
  view: PlayerOddsView,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("betting-value")
  const consensus = view.consensus
  const confidence = fromVerified(view.confidence)

  const contributors: Contributor[] = []
  if (consensus) {
    const fairPct = consensus.fairProbability * 100
    contributors.push({
      key: "fair-probability",
      label: "Fair Win Probability",
      description: `De-vigged consensus win probability of ${round1(fairPct)}% (${consensus.consensusAmerican > 0 ? "+" : ""}${consensus.consensusAmerican}).`,
      rawValue: round1(fairPct),
      normalizedValue: roundOrNull(fairPct),
      weightPct: null,
      contribution: null,
      direction: "neutral",
      confidence,
      independent: false,
    })
    if (view.fieldRank !== null) {
      contributors.push({
        key: "field-rank",
        label: "Market Field Rank",
        description: `Ranked ${view.fieldRank}${view.fieldSize ? ` of ${view.fieldSize}` : ""} by the market's fair probability.`,
        rawValue: view.fieldRank,
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: true,
      })
    }
    contributors.push({
      key: "book-agreement",
      label: "Book Agreement",
      description: `${consensus.bookCount} book${consensus.bookCount === 1 ? "" : "s"} pricing this selection; price spread ${round1(consensus.priceSpread)} (wider = more disagreement).`,
      rawValue: consensus.bookCount,
      normalizedValue: null,
      weightPct: null,
      contribution: null,
      direction: "neutral",
      confidence,
      independent: true,
    })
  }

  const limitations: Limitation[] = [
    {
      code: "no-edge-model",
      message:
        "Betting value (a modeled edge of CaddieIQ's probability vs. the book's price) is not implemented yet. This shows the market consensus only, not a value call.",
    },
  ]
  if (!consensus) {
    limitations.unshift({
      code: "no-consensus",
      message: view.confidence === "unavailable" ? "No verified sportsbook quotes exist for this player's market." : "No market consensus could be formed for this player.",
    })
  } else if (view.confidence === "partial") {
    limitations.push({
      code: "thin-market",
      message: "The market is thin or the capture is somewhat stale, so the consensus is partial — use with care.",
    })
  }

  const reasoning: string[] = []
  if (consensus) {
    reasoning.push(`Consensus drawn from ${consensus.bookCount} book${consensus.bookCount === 1 ? "" : "s"}.`)
    if (view.capturedAt) reasoning.push(`Quotes captured ${view.capturedAt.toISOString().slice(0, 10)}.`)
  }

  return {
    model,
    subject,
    headline: buildHeadline({
      value: consensus ? roundOrNull(consensus.fairProbability * 100) : null,
      unit: "probability",
      band: null,
      confidence,
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "market-efficient",
        message: "Absent a CaddieIQ edge model, the de-vigged market consensus is treated as the current best estimate of win probability.",
      },
    ],
    limitations,
    provenance: {
      sources: ["Odds Intelligence (verified multi-book quotes)"],
      asOf: view.capturedAt ? view.capturedAt.toISOString() : null,
    },
    narrative: emptyNarrative(),
  }
}
