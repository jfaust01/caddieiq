/**
 * Decision Trace Engine — pure builder.
 *
 * Turns a canonical {@link Explanation} into an ordered {@link DecisionTrace}
 * pipeline. This module performs NO I/O, imports no provider, and recomputes no
 * model. It reads only the explanation it is given, so a trace can never present
 * a number, direction, weight, or confidence that the explanation did not
 * already contain. If a model degrades (null score, missing inputs), the trace
 * degrades identically and surfaces the same limitations.
 *
 * @see ./decision-trace-types.ts
 * @see ../../docs/DECISION_TRACE_ENGINE.md
 */

import type {
  DecisionTrace,
  DecisionTraceStage,
  NarratedDecisionTrace,
  TraceCategoryMeta,
  TraceEvidence,
  TraceImpact,
  TraceNarrative,
  TraceStageCategory,
} from './decision-trace-types'
import type { Contributor, Explanation, ExplanationConfidence, ModelId } from './types'

/* -------------------------------------------------------------------------- */
/* Category classification                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The canonical analyst pipeline order. Every classified stage is emitted in
 * this order; `final` always closes the trace. This ordering is presentational
 * only — it never reweights or reorders the underlying composite math.
 */
export const TRACE_PIPELINE_ORDER: readonly TraceStageCategory[] = [
  'player-skill',
  'recent-form',
  'course-fit',
  'field-strength',
  'weather',
  'market',
  'salary',
  'context',
  'final',
] as const

/** Display metadata for each pipeline category. */
export const TRACE_CATEGORY_META: Record<TraceStageCategory, TraceCategoryMeta> = {
  'player-skill': {
    category: 'player-skill',
    label: 'Player Skill',
    description: 'Baseline ability from long-term strokes-gained and skill ratings.',
  },
  'recent-form': {
    category: 'recent-form',
    label: 'Recent Form',
    description: 'Momentum from recent results and trending performance.',
  },
  'course-fit': {
    category: 'course-fit',
    label: 'Course Fit',
    description: 'How the player’s skill profile matches this course’s demands.',
  },
  'field-strength': {
    category: 'field-strength',
    label: 'Field Strength',
    description: 'Strength and depth of the field the player competes against.',
  },
  weather: {
    category: 'weather',
    label: 'Weather',
    description: 'Forecast conditions and wave/draw exposure.',
  },
  market: {
    category: 'market',
    label: 'Market Signal',
    description: 'Betting market consensus and implied probability.',
  },
  salary: {
    category: 'salary',
    label: 'Salary Efficiency',
    description: 'Projected value relative to DFS salary or price.',
  },
  context: {
    category: 'context',
    label: 'Context',
    description: 'Supporting context that informs, but does not drive, the score.',
  },
  final: {
    category: 'final',
    label: 'Final Score',
    description: 'The composite result after all signals are combined.',
  },
}

/**
 * Whole-model category overrides. A few models produce contributors whose keys
 * are unambiguously a single pipeline category regardless of the individual key
 * (e.g. every Course Fit sub-skill is course-fit; every Player Skill sub-skill
 * is player-skill), so we resolve them by model first. This disambiguates keys
 * that collide across models (e.g. "approach"/"putting" appear in BOTH the
 * player-skill and course-fit models but mean different things).
 */
const MODEL_CATEGORY: Partial<Record<ModelId, TraceStageCategory>> = {
  'player-skill': 'player-skill',
  'course-fit': 'course-fit',
  'weather-intelligence': 'weather',
}

/**
 * Exact contributor keys → category, grounded in the real keys emitted by the
 * eight model adapters. Consulted after model overrides so classification is
 * deterministic and precise for known signals; the keyword rules below only act
 * as a fallback for keys not enumerated here.
 */
const EXACT_KEY_CATEGORY: Record<string, TraceStageCategory> = {
  // analytics / overall-rating metric keys
  seasonPerformance: 'player-skill',
  fantasyProduction: 'player-skill',
  consistency: 'player-skill',
  activity: 'player-skill',
  recentForm: 'recent-form',
  rankingMomentum: 'recent-form',
  // dfs-value signal keys
  playerSkill: 'player-skill',
  courseFit: 'course-fit',
  market: 'market',
  form: 'recent-form',
  weather: 'weather',
  salary: 'salary',
  // betting-value keys
  'fair-probability': 'market',
  'book-agreement': 'market',
  'field-rank': 'field-strength',
  // fantasy-projection keys
  'dk-points': 'player-skill',
  'fd-points': 'player-skill',
  // weather-intelligence keys (also covered by MODEL_CATEGORY)
  wind: 'weather',
  rain: 'weather',
  temperature: 'weather',
  'wave-advantage': 'weather',
  // tournament-context keys
  tournament: 'context',
  course: 'course-fit',
  field: 'field-strength',
}

/**
 * Fallback keyword rules for keys not covered by {@link EXACT_KEY_CATEGORY}.
 * Order matters: the first matching rule wins. Patterns use word boundaries
 * where a substring would otherwise misfire (e.g. "form" inside "performance").
 */
const CLASSIFIER_RULES: ReadonlyArray<{ category: TraceStageCategory; patterns: RegExp }> = [
  // Course fit must be checked before generic skill terms, because fit signals
  // reuse skill vocabulary in a course-relative sense.
  { category: 'course-fit', patterns: /(course|fit|layout|track)/i },
  { category: 'field-strength', patterns: /(field|strength|depth|competition|opponent)/i },
  { category: 'weather', patterns: /(weather|wind|rain|temp|forecast|wave|draw|condition)/i },
  { category: 'market', patterns: /(market|odds|book|implied|consensus|betting|\bev\b|value)/i },
  { category: 'salary', patterns: /(salary|efficiency|price|cost|ppd|ownership)/i },
  // "form" must be a whole word so it does not match "perFORMance".
  { category: 'recent-form', patterns: /(\bform\b|recent|momentum|trend|streak|\bhot\b|\bcold\b)/i },
  {
    category: 'player-skill',
    patterns:
      /(skill|ability|talent|baseline|strokes.?gained|\bsg\b|off.?the.?tee|tee.?to.?green|approach|around.?green|putting|scoring|driving|season|overall|rating|performance|production)/i,
  },
]

/**
 * Classify one contributor into a pipeline category. Resolution order:
 * 1. Whole-model override (disambiguates keys that collide across models).
 * 2. Exact known key.
 * 3. Keyword fallback rules.
 * 4. `context` for anything still unmatched.
 *
 * Context-only signals in `tournament-context` still resolve by key so that,
 * e.g., its "course" signal reads as course-fit while "tournament" reads as
 * context.
 */
export function classifyContributor(
  contributor: Pick<Contributor, 'key' | 'label' | 'independent'>,
  modelId?: ModelId,
): TraceStageCategory {
  // Exact keys win over a blanket model override so tournament-context's
  // "course"/"field" signals are not all flattened to a single category.
  const exact = EXACT_KEY_CATEGORY[contributor.key]
  if (exact) return exact

  if (modelId && MODEL_CATEGORY[modelId]) return MODEL_CATEGORY[modelId] as TraceStageCategory

  const haystack = `${contributor.key} ${contributor.label}`
  for (const rule of CLASSIFIER_RULES) {
    if (rule.patterns.test(haystack)) return rule.category
  }
  return 'context'
}

/* -------------------------------------------------------------------------- */
/* Stage construction                                                         */
/* -------------------------------------------------------------------------- */

/** Map a 0–100 weight percentage onto a discrete 0–5 star rating. */
export function weightToStars(weightPct: number | null): 0 | 1 | 2 | 3 | 4 | 5 | null {
  if (weightPct === null) return null
  if (weightPct <= 0) return 0
  // 5 stars at >=40%, scaling down in even bands. Presentation only.
  if (weightPct >= 40) return 5
  if (weightPct >= 30) return 4
  if (weightPct >= 20) return 3
  if (weightPct >= 10) return 2
  return 1
}

/** Direction maps directly onto impact — never inferred independently. */
function directionToImpact(direction: Contributor['direction']): TraceImpact {
  return direction
}

/** Format a raw/normalized value into a compact display string. */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return `${value}`
  return value.toFixed(1)
}

/** Build the evidence rows for a contributor, copying values verbatim. */
function buildEvidence(c: Contributor): TraceEvidence[] {
  const rows: TraceEvidence[] = []
  if (c.rawValue !== null) {
    rows.push({
      label: 'Raw value',
      display: typeof c.rawValue === 'number' ? formatNumber(c.rawValue) : c.rawValue,
    })
  }
  if (c.normalizedValue !== null) {
    rows.push({ label: 'Normalized', display: `${formatNumber(c.normalizedValue)}/100` })
  }
  if (c.contribution !== null) {
    const sign = c.contribution > 0 ? '+' : ''
    rows.push({ label: 'Contribution', display: `${sign}${formatNumber(c.contribution)}` })
  }
  if (c.weightPct !== null) {
    rows.push({ label: 'Weight', display: `${formatNumber(c.weightPct)}%` })
  }
  return rows
}

/** Convert one contributor into a pipeline stage. */
function toStage(c: Contributor, category: TraceStageCategory): DecisionTraceStage {
  const meta = TRACE_CATEGORY_META[category]
  return {
    id: c.key,
    category,
    categoryLabel: meta.label,
    title: c.label,
    weightStars: c.independent ? null : weightToStars(c.weightPct),
    weightPct: c.weightPct,
    impact: directionToImpact(c.direction),
    direction: c.direction,
    confidence: c.confidence,
    influencesOutcome: !c.independent,
    summary: c.description,
    evidence: buildEvidence(c),
  }
}

/* -------------------------------------------------------------------------- */
/* Headline formatting                                                        */
/* -------------------------------------------------------------------------- */

/** Format the headline exactly as the narrator/breakdown do, for consistency. */
function formatHeadlineDisplay(explanation: Explanation): string {
  const { headline } = explanation
  if (headline.value === null) return 'Unavailable'
  if (headline.unit === 'probability') return `${headline.value}%`
  if (headline.unit === 'score-100') return `${headline.value}/100`
  return `${headline.value}`
}

/* -------------------------------------------------------------------------- */
/* Public builder                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Build a {@link DecisionTrace} from a canonical {@link Explanation}.
 *
 * Pure and deterministic: identical explanations always yield identical traces.
 * Stages are ordered by {@link TRACE_PIPELINE_ORDER}; within a category, source
 * contributor order (strongest-first) is preserved. A synthetic `final` stage
 * always closes the trace and restates the headline.
 */
export function toDecisionTrace(explanation: Explanation): DecisionTrace {
  const { model, subject, headline, contributors, limitations } = explanation

  const classified = contributors.map((c) => ({
    stage: toStage(c, classifyContributor(c, model.id)),
  }))

  const orderIndex = new Map<TraceStageCategory, number>(
    TRACE_PIPELINE_ORDER.map((category, i) => [category, i]),
  )

  // Stable sort by pipeline order, preserving original order within a category.
  const orderedStages = classified
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => {
      const orderDiff =
        (orderIndex.get(a.stage.category) ?? 0) - (orderIndex.get(b.stage.category) ?? 0)
      return orderDiff !== 0 ? orderDiff : a.index - b.index
    })
    .map((entry) => entry.stage)

  const finalStage: DecisionTraceStage = {
    id: 'final',
    category: 'final',
    categoryLabel: TRACE_CATEGORY_META.final.label,
    title: TRACE_CATEGORY_META.final.label,
    weightStars: null,
    weightPct: null,
    impact: 'neutral',
    direction: 'neutral',
    confidence: headline.confidence,
    influencesOutcome: true,
    summary:
      headline.value === null
        ? `No ${model.label} score could be produced from the available inputs.`
        : `${model.label} resolves to ${formatHeadlineDisplay(explanation)}${headline.band ? ` (${headline.band})` : ''} at ${confidenceWord(headline.confidence)} confidence.`,
    evidence:
      headline.value === null
        ? []
        : [{ label: model.label, display: formatHeadlineDisplay(explanation) }],
  }

  return {
    modelId: model.id,
    modelLabel: model.label,
    subject,
    headlineLabel: model.label,
    headlineValue: headline.value,
    headlineDisplay: formatHeadlineDisplay(explanation),
    overallConfidence: headline.confidence,
    overallConfidenceLabel: headline.confidenceLabel,
    stages: [...orderedStages, finalStage],
    limitations,
    generatedAt: new Date().toISOString(),
  }
}

/* -------------------------------------------------------------------------- */
/* Trace-grounded narration (AI Coach)                                        */
/* -------------------------------------------------------------------------- */

const CONFIDENCE_WORD: Record<ExplanationConfidence, string> = {
  high: 'high',
  medium: 'moderate',
  low: 'low',
  none: 'no',
}

function confidenceWord(confidence: ExplanationConfidence): string {
  return CONFIDENCE_WORD[confidence]
}

function impactVerb(impact: TraceImpact): string {
  if (impact === 'positive') return 'helps'
  if (impact === 'negative') return 'hurts'
  return 'is neutral for'
}

/**
 * Narrate a {@link DecisionTrace} into an AI-Coach-style walkthrough.
 *
 * Like the deterministic explanation narrator, this NEVER introduces a fact not
 * already present in the trace. It only restates stage titles, impacts, weights,
 * and the final result in ordered plain language, and echoes the first
 * limitation as a caveat.
 */
export function narrateFromTrace(trace: DecisionTrace): TraceNarrative {
  if (trace.headlineValue === null) {
    const reason = trace.limitations[0]?.message
    return {
      summary: `${trace.modelLabel} is unavailable for ${trace.subject.label}.`,
      steps: [],
      caveat:
        reason ?? 'The required inputs are not present, so no score is shown rather than a fabricated one.',
    }
  }

  const summary = `${trace.modelLabel} for ${trace.subject.label} lands at ${trace.headlineDisplay} at ${confidenceWord(trace.overallConfidence)} confidence.`

  // Walk the influencing stages (skip the synthetic final and context-only rows)
  // strongest-weight first is already implied by source order within categories.
  const steps = trace.stages
    .filter((s) => s.category !== 'final' && s.influencesOutcome && s.direction !== 'neutral')
    .map((s) => {
      const weightClause = s.weightPct !== null ? ` (${formatNumber(s.weightPct)}% of the score)` : ''
      return `${s.categoryLabel}: ${s.title} ${impactVerb(s.impact)} the result${weightClause}.`
    })

  const caveat = trace.limitations[0]?.message ?? null

  return { summary, steps, caveat }
}

/** Convenience: build a trace and narrate it in one call. */
export function toNarratedTrace(explanation: Explanation): NarratedDecisionTrace {
  const trace = toDecisionTrace(explanation)
  return { trace, narrative: narrateFromTrace(trace) }
}
