/**
 * AI Caddie fallback / capabilities answerer.
 *
 * Used for the "unknown" and "capabilities" intents. Lists the real, supported
 * questions so the user is never left guessing — and never implies a capability
 * the engine doesn't actually have.
 */

import type { CaddieAnswer, CaddieIntent } from "../types"

/** The canonical set of example questions, grounded in real intents. */
export const CADDIE_EXAMPLE_QUESTIONS: readonly string[] = [
  "Best cash plays this week?",
  "Best GPP plays?",
  "Who's underpriced?",
  "Who fits the course?",
  "Who should I fade?",
  "Who's in form?",
  "Odds favorites?",
  "Weather this week?",
  "Compare Rahm and Fleetwood",
  "Why is Scottie Scheffler rated so high?",
]

export function answerCapabilities(tournamentName: string, intent: CaddieIntent = "capabilities"): CaddieAnswer {
  const isUnknown = intent === "unknown"
  return {
    intent,
    headline: isUnknown ? "I'm not sure how to answer that yet" : "Here's what I can help with",
    summary: isUnknown
      ? `I couldn't map that to one of my engines. For ${tournamentName}, try one of these:`
      : `I answer questions grounded in CaddieIQ's verified engines for ${tournamentName}.`,
    bullets: CADDIE_EXAMPLE_QUESTIONS.map((q) => q),
    entities: [],
    citations: [],
    confidence: isUnknown ? "unavailable" : "high",
    followUps: ["Best cash plays?", "Who fits the course?", "Odds favorites?"],
    isEmpty: isUnknown,
  }
}
