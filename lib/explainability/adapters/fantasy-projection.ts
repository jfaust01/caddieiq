/**
 * Adapter: Fantasy Projection → Explanation (honest degradation).
 *
 * Fantasy projections are a single provider number (DraftKings / FanDuel points)
 * — not a CaddieIQ model — and their VALUES are scrambled on the current
 * provider trial tier. This adapter surfaces the projected points when they
 * survive the scramble gate and, when they do not, states plainly that the
 * values are withheld by the tier. It never fabricates a projection and never
 * presents the provider number as a modeled score.
 */

import type { DomainFantasyProjection } from "@/lib/domain/fantasy/types"
import { buildHeadline, emptyNarrative, round1 } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, Explanation, ExplanationConfidence, ExplanationSubject, Limitation } from "../types"

export function toFantasyProjectionExplanation(
  projection: DomainFantasyProjection | null,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("fantasy-projection")

  const available = projection?.available === true
  const dk = projection?.fantasyPointsDraftKings ?? null
  const fd = projection?.fantasyPointsFanDuel ?? null
  const confidence: ExplanationConfidence = available ? "medium" : "none"

  const contributors: Contributor[] = []
  if (available) {
    if (dk !== null) {
      contributors.push({
        key: "dk-points",
        label: "DraftKings Projected Points",
        description: `Provider projection of ${round1(dk)} DraftKings fantasy points.`,
        rawValue: round1(dk),
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: false,
      })
    }
    if (fd !== null) {
      contributors.push({
        key: "fd-points",
        label: "FanDuel Projected Points",
        description: `Provider projection of ${round1(fd)} FanDuel fantasy points.`,
        rawValue: round1(fd),
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: false,
      })
    }
  }

  const limitations: Limitation[] = []
  if (!projection) {
    limitations.push({
      code: "no-projection",
      message: "The provider has no fantasy projection for this player in this event.",
    })
  } else if (!available) {
    limitations.push({
      code: "scrambled-tier",
      message:
        "Projection values are scrambled on the current provider tier, so no point total can be shown. Real values appear automatically once a production key is installed — no code change required.",
    })
  }

  return {
    model,
    subject,
    headline: buildHeadline({
      // Fantasy points are provider units, not a 0–100 score.
      value: available ? (dk ?? fd) : null,
      unit: "none",
      band: null,
      confidence,
    }),
    contributors,
    reasoning: available ? ["Single-source provider projection (SportsDataIO)."] : [],
    assumptions: [
      {
        code: "provider-projection",
        message: "This is the provider's own projection, not a CaddieIQ model; CaddieIQ does not yet compute its own fantasy projection.",
      },
    ],
    limitations,
    provenance: {
      sources: ["SportsDataIO fantasy projections"],
      asOf: null,
    },
    narrative: emptyNarrative(),
  }
}
