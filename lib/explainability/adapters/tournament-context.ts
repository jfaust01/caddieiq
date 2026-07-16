/**
 * Adapter: Tournament Context → Explanation.
 *
 * Tournament Context is not a 0–100 score — it is the platform's answer to
 * "which event is being evaluated, and how complete is that context?" Rather
 * than fabricate a number, this adapter produces a *qualitative* Explanation:
 * the headline value is `null` (unit `none`), the band carries the confidence
 * tier, contributors describe which context inputs resolved, and every gap
 * becomes an honest limitation. This is the ceiling every event-specific model
 * inherits, so surfacing it truthfully matters more than forcing a number.
 */

import type {
  ContextGap,
  TournamentContext,
} from "@/lib/tournament-context/types"
import { fromVerified } from "../confidence"
import { buildHeadline, emptyNarrative } from "../helpers"
import { getModelMeta } from "../registry"
import type {
  Contributor,
  Explanation,
  ExplanationSubject,
  Limitation,
} from "../types"

const GAP_LABEL: Record<ContextGap["field"], string> = {
  course: "Host course",
  startDate: "Start date",
  endDate: "End date",
  field: "Field (roster)",
}

export function toTournamentContextExplanation(
  context: TournamentContext,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("tournament-context")

  if (context.status === "unavailable") {
    return {
      model,
      subject,
      headline: buildHeadline({
        value: null,
        unit: "none",
        band: "Unavailable",
        confidence: fromVerified("unavailable"),
      }),
      contributors: [],
      reasoning: [context.detail],
      assumptions: [],
      limitations: [
        {
          code: "no-context",
          message:
            context.reason === "tournament-missing"
              ? "The requested tournament could not be found, so no event context is available."
              : "No upcoming tournament could be resolved for this player yet.",
        },
      ],
      provenance: {
        sources: ["Tournament Context Engine"],
        asOf: null,
      },
      narrative: emptyNarrative(),
    }
  }

  // Available: describe which inputs resolved as positive/negative contributors.
  const contributors: Contributor[] = [
    {
      key: "tournament",
      label: "Tournament",
      description: `Resolved to ${context.tournament.name} (${context.timing.toLowerCase()}).`,
      rawValue: context.tournament.name,
      normalizedValue: null,
      weightPct: null,
      contribution: null,
      direction: "positive",
      confidence: fromVerified("verified"),
      independent: false,
    },
    {
      key: "course",
      label: "Host course",
      description: context.course
        ? `Linked to ${context.course.name}.`
        : "No host course is linked yet, so course-dependent models must degrade.",
      rawValue: context.course ? context.course.name : null,
      normalizedValue: null,
      weightPct: null,
      contribution: null,
      direction: context.course ? "positive" : "negative",
      confidence: context.course ? fromVerified("verified") : fromVerified("unavailable"),
      independent: false,
    },
    {
      key: "field",
      label: "Field",
      description: context.fieldConfirmed
        ? `Official field imported${context.fieldPlayerCount != null ? ` (${context.fieldPlayerCount} players)` : ""}.`
        : "The official field has not been released/imported yet.",
      rawValue: context.fieldPlayerCount,
      normalizedValue: null,
      weightPct: null,
      contribution: null,
      direction: context.fieldConfirmed ? "positive" : "neutral",
      confidence: context.fieldConfirmed ? fromVerified("verified") : fromVerified("partial"),
      independent: false,
    },
  ]

  const limitations: Limitation[] = context.gaps.map((gap) => ({
    code: `gap:${gap.field}`,
    message: `${GAP_LABEL[gap.field]}: ${gap.detail}`,
  }))

  const reasoning: string[] =
    context.confidence === "verified"
      ? [`Full context resolved for ${context.tournament.name}; all event-specific models may run.`]
      : [
          `${context.tournament.name} is identified, but some context is missing — course-dependent models will degrade rather than guess.`,
        ]

  return {
    model,
    subject,
    headline: buildHeadline({
      value: null,
      unit: "none",
      band: context.confidence === "verified" ? "Verified" : "Partial",
      confidence: fromVerified(context.confidence),
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "context-ceiling",
        message:
          "Context confidence is the ceiling for every downstream model — no event-specific model may present more certainty than this.",
      },
    ],
    limitations,
    provenance: {
      sources: ["Tournament Context Engine"],
      asOf: null,
    },
    narrative: emptyNarrative(),
  }
}
