import type { Explanation } from "./types"
import { toDecisionTrace } from "./decision-trace"
import type { DecisionTrace, DecisionTraceStage } from "./decision-trace-types"

export interface WhyThisPickInsight {
  /** Top 3-5 positive or neutral factors driving the pick. */
  topFactors: string[]
  /** Key risks or concerns that could affect the outcome. */
  risks: string[]
  /** Why we have (or lack) confidence in this pick. */
  confidenceReasoning: string
  /** Actionable recommendation category: "Strong Cash", "High-Upside GPP", "Value Contrarian", "Risky Play", "Insufficient Data". */
  insight: string
  /** Whether there's enough data to make a confident decision. */
  hasConfidence: boolean
  /** How many influential factors are present. */
  factorCount: number
}

/**
 * Extract the most influential contributors from a Decision Trace,
 * filtering for stages that actually influenced the outcome.
 */
function getInfluentialStages(trace: DecisionTrace): DecisionTraceStage[] {
  return trace.stages.filter(
    (s: DecisionTraceStage) =>
      s.influencesOutcome &&
      s.id !== "final" &&
      s.direction !== "neutral" &&
      (s.weightStars ?? 0) > 0,
  )
}

/**
 * Extract the top 3-5 factors that drove the result, formatted as plain-language bullets.
 */
function extractTopFactors(trace: DecisionTrace): string[] {
  const influential = getInfluentialStages(trace)
  const sorted = [...influential].sort((a, b) => (b.weightStars ?? 0) - (a.weightStars ?? 0))

  return sorted.slice(0, 5).map((stage) => {
    const direction = stage.direction === "positive" ? "Strong" : "Poor"
    const confidence =
      stage.confidence === "high" ? " (high confidence)" : stage.confidence === "low" ? " (low confidence)" : ""
    return `${direction} ${stage.title}${confidence}`
  })
}

/**
 * Extract key risks or concerns from low-confidence or negative-direction stages.
 */
function extractRisks(trace: DecisionTrace, explanation: Explanation): string[] {
  const risks: string[] = []

  // Add limitations as risks
  for (const lim of explanation.limitations) {
    if (lim.message.toLowerCase().includes("missing") || lim.message.toLowerCase().includes("could not")) {
      risks.push(`Data Gap: ${lim.message}`)
    }
  }

  // Add low-confidence negative contributors as risks
  const lowConfNegative = trace.stages.filter(
    (s: DecisionTraceStage) => s.confidence === "low" && s.direction === "negative" && s.influencesOutcome,
  )
  for (const stage of lowConfNegative.slice(0, 2)) {
    risks.push(`Uncertain Risk: ${stage.title} (low confidence)`)
  }

  return risks.slice(0, 3)
}

/**
 * Generate confidence reasoning based on trace statistics.
 */
function getConfidenceReasoning(trace: DecisionTrace, explanation: Explanation): string {
  const influential = getInfluentialStages(trace)
  const highConfStages = influential.filter((s: DecisionTraceStage) => s.confidence === "high")
  const lowConfStages = influential.filter((s: DecisionTraceStage) => s.confidence === "low")

  if (highConfStages.length >= 3 && explanation.limitations.length === 0) {
    return "Multiple high-confidence factors align on this rating."
  }

  if (lowConfStages.length > 0) {
    return `Some factors have low confidence; ${highConfStages.length} high-confidence signals support this pick.`
  }

  if (explanation.limitations.length > 0) {
    return "Missing data reduces confidence, but available signals are aligned."
  }

  return "Moderate confidence with balanced data."
}

/**
 * Generate an actionable recommendation insight based on the overall rating and trace.
 */
function getRecommendationInsight(trace: DecisionTrace, explanation: Explanation): string {
  const headline = explanation.headline.value ?? 0
  const confident = trace.stages
    .filter((s: DecisionTraceStage) => s.id !== "final" && s.confidence === "high" && s.influencesOutcome)
    .slice(0, 1).length > 0

  if (headline >= 80 && confident) {
    return "Strong Cash Play"
  }
  if (headline >= 75 && !confident) {
    return "High-Upside GPP"
  }
  if (headline >= 60 && trace.stages.filter((s: DecisionTraceStage) => s.direction === "positive").length >= 4) {
    return "Value Contrarian"
  }
  if (headline < 50 || (headline < 60 && trace.stages.filter((s: DecisionTraceStage) => s.direction === "negative").length >= 2)) {
    return "Risky Play"
  }
  if (explanation.limitations.length > 2) {
    return "Insufficient Data"
  }
  return "Moderate Opportunity"
}

/**
 * Extract the "Why This Pick?" insight from an Explanation.
 * Derives everything from the canonical Explanation + Decision Trace;
 * never invents factors or scores.
 */
export function extractWhyThisPickInsight(explanation: Explanation): WhyThisPickInsight {
  const trace = toDecisionTrace(explanation)
  const influential = getInfluentialStages(trace)

  const topFactors = extractTopFactors(trace)
  const risks = extractRisks(trace, explanation)
  const confidenceReasoning = getConfidenceReasoning(trace, explanation)
  const insight = getRecommendationInsight(trace, explanation)
  const hasConfidence =
    trace.stages.find((s) => s.confidence === "high" && s.influencesOutcome) !== undefined &&
    explanation.limitations.length === 0

  return {
    topFactors,
    risks,
    confidenceReasoning,
    insight,
    hasConfidence,
    factorCount: influential.length,
  }
}
