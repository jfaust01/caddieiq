/**
 * Central glossary of metrics, signals, and technical terms used throughout
 * CaddieIQ's explainability system. Each definition is reusable across the
 * "Why?" timeline, admin Developer Trace, AI Coach, and other surfaces.
 *
 * This is the single source of truth for metric definitions — any new metrics
 * added to the platform should be registered here.
 */

export interface MetricDefinition {
  /** Unique, stable key for this metric (e.g., "raw-value", "confidence-level"). */
  readonly key: string
  /** Short label (2–4 words) suitable for inline display. */
  readonly label: string
  /** Full definition (1–2 sentences) explaining what the metric is. */
  readonly definition: string
  /** Why this metric matters to the user. */
  readonly whyItMatters: string
  /** Concrete example showing the metric in context (optional). */
  readonly example?: string
  /** How to interpret the values (e.g., "Higher is better", "0–1 probability"). */
  readonly interpretation?: string
  /** URL to related documentation (optional). */
  readonly docsLink?: string
}

/**
 * The complete metric glossary. Each entry is keyed by a stable string that
 * can be referenced by multiple surfaces without repeating definitions.
 */
export const METRIC_GLOSSARY: Readonly<Record<string, MetricDefinition>> = {
  // Core technical metrics
  "raw-value": {
    key: "raw-value",
    label: "Raw Value",
    definition:
      "The unprocessed output from the underlying model before any normalization or weighting is applied.",
    whyItMatters:
      "Shows you what the model actually computed, before CaddieIQ adjusted it for comparison.",
    example: "A course-fit model outputs 73 (raw), then normalized to 0.73 (0–1 scale).",
    interpretation: "Depends on the metric; always paired with a normalized version.",
  },

  "normalized-value": {
    key: "normalized-value",
    label: "Normalized Value",
    definition:
      "The raw value converted to a standard 0–100 or 0–1 scale for consistent comparison across all signals.",
    whyItMatters:
      "Allows fair comparison between metrics with different native ranges (e.g., 0–100 vs. 0–1).",
    example: "A probability of 0.62 normalizes to 62/100 on a 0–100 scale.",
    interpretation: "Always 0–100 or 0–1; higher is generally more favorable.",
  },

  "weight-percentage": {
    key: "weight-percentage",
    label: "Weight %",
    definition:
      "The percentage of the final score this metric contributes, calculated from its squared-error term in the model's loss function.",
    whyItMatters:
      "Tells you how much this signal actually influenced the result — the most important metrics carry the most weight.",
    example: "A 25% weight means this metric accounts for one-quarter of the final score.",
    interpretation: "Higher weight = more influence on the result. All weights sum to 100%.",
    docsLink: "/docs/models#weighting",
  },

  "contribution": {
    key: "contribution",
    label: "Contribution",
    definition:
      "The signed change in the final score attributable to this signal, calculated as weight × normalized change.",
    whyItMatters:
      "Shows the direction and magnitude of how each signal pushed the result up or down.",
    example: "A 25% weight signal with +0.1 normalized change contributes +2.5 points.",
    interpretation: "Positive (↑) = helped the result. Negative (↓) = hurt the result.",
  },

  // Confidence metrics
  "confidence-level": {
    key: "confidence-level",
    label: "Confidence",
    definition:
      "A measure of how certain the model is in its output, ranging from high (certain) to none (missing data).",
    whyItMatters:
      "Honest confidence lets you know when to trust a result vs. when to seek more information.",
    example: "A signal with 'high' confidence is based on complete data; 'none' means missing data.",
    interpretation: "high → trust the result. low → use cautiously. none → signal is unreliable.",
  },

  // Contribution direction
  "positive-impact": {
    key: "positive-impact",
    label: "Helps",
    definition: "This signal moved the final result upward (in the favorable direction).",
    whyItMatters: "Shows which factors worked in the player's favor.",
    example: "A high recent form score helps (increases) the Overall Rating.",
    interpretation: "Arrow pointing up; score increase.",
  },

  "negative-impact": {
    key: "negative-impact",
    label: "Hurts",
    definition: "This signal moved the final result downward (in the unfavorable direction).",
    whyItMatters: "Shows which factors worked against the player.",
    example: "Low activity hurts (decreases) the Overall Rating.",
    interpretation: "Arrow pointing down; score decrease.",
  },

  "neutral-impact": {
    key: "neutral-impact",
    label: "Neutral",
    definition:
      "This signal had minimal or no effect on the final result (often context-only or independent information).",
    whyItMatters:
      "Neutral signals provide context without changing the score, so you see the full picture.",
    example: "Tournament context (field size, course difficulty) informs but doesn't weight the score.",
    interpretation:
      "No arrow; score unchanged. Still useful for understanding the reasoning.",
  },

  // Evidence and signal types
  "evidence": {
    key: "evidence",
    label: "Evidence",
    definition:
      "The underlying data or calculation that backs up a signal (e.g., recent scores, wind speed, course statistics).",
    whyItMatters:
      "Grounds every conclusion in real data — no metric is abstract or made up.",
    example:
      "Recent Form evidence: last 5 tournament rounds averaged 2.5 strokes-gained.",
    interpretation: "Always traceable to actual model inputs.",
  },

  // Decision Trace categories
  "player-skill": {
    key: "player-skill",
    label: "Player Skill",
    definition:
      "Baseline ability metrics (strokes-gained, consistency, season performance) that define the player's fundamental strengths.",
    whyItMatters:
      "The foundation of any projection — a player's core competencies.",
    example:
      "Off-the-tee strokes-gained, tee-to-green proficiency, putting average.",
    interpretation: "Higher is better. Reflects long-term ability.",
  },

  "recent-form": {
    key: "recent-form",
    label: "Recent Form",
    definition:
      "Short-term momentum indicators (recent scores, trend, ranking movement) that capture whether the player is playing well right now.",
    whyItMatters:
      "A player's current form often matters as much as or more than their baseline skill.",
    example: "Top-10 finishes in the last 3 events; ranking up 5 spots this month.",
    interpretation: "Higher is better. Changes week-to-week; short-term indicator.",
  },

  "course-fit": {
    key: "course-fit",
    label: "Course Fit",
    definition:
      "How well the player's strengths (length, precision, short-game touch) align with this specific course's demands.",
    whyItMatters:
      "The same player plays better on courses that suit their style — course fit is predictive.",
    example:
      "A long-hitter excels at wide-fairway courses; a precise short-game player thrives at tight courses.",
    interpretation: "Higher fit = better match between player and course.",
  },

  "field-strength": {
    key: "field-strength",
    label: "Field Strength",
    definition:
      "The quality and depth of the opponent pool — how tough the competition is.",
    whyItMatters:
      "The same player performs differently against a world-class field vs. a weaker one.",
    example:
      "A 50-player field with 30 ranked players is tougher than a 50-player all-amateur field.",
    interpretation:
      "Higher field strength = tougher competition. Adjusts projection difficulty up.",
  },

  "weather": {
    key: "weather",
    label: "Weather",
    definition:
      "Wind, rain, temperature, and other atmospheric conditions that affect play difficulty and player suitability.",
    whyItMatters:
      "Windy conditions help wind-specialists; rain can favor shorter hitters. Weather is highly predictive.",
    example: "Strong wind waves, heavy rain, cool temps all shift player performance predictions.",
    interpretation:
      "Depends on condition. Wind helps/hurts different player types.",
  },

  "market": {
    key: "market",
    label: "Market",
    definition:
      "Betting market signals (consensus odds, book agreement, fair vs. implied probability) that reflect aggregate opinion.",
    whyItMatters:
      "The market aggregates thousands of bettors' information — a strong signal of true probability.",
    example:
      "Consensus decimal odds of 11.0 imply ~9% win probability; if fair probability is 12%, there's value.",
    interpretation: "Aligns with model output when market is efficient.",
  },

  "salary-efficiency": {
    key: "salary-efficiency",
    label: "Salary Efficiency",
    definition:
      "Fantasy points per dollar (PPD) — whether a player offers good DFS value at their given price.",
    whyItMatters:
      "High efficiency means upside potential in tournaments with salary caps.",
    example: "A $10k player projected to score 80 points has 8 PPD.",
    interpretation: "Higher PPD = better value. Relative metric (compare to salary tier).",
  },

  "tournament-context": {
    key: "tournament-context",
    label: "Tournament Context",
    definition:
      "Event-level information (field size, format, course difficulty, history) that sets the stage without directly weighting the score.",
    whyItMatters:
      "Context helps you understand the reasoning but doesn't change the model output.",
    example: "Major championship (tough field, longer course, historical data).",
    interpretation: "Informational only; doesn't influence the score directly.",
  },

  // Final score metrics
  "final-score": {
    key: "final-score",
    label: "Final Score",
    definition:
      "The aggregated, weighted conclusion from all pipeline stages — the model's best estimate of player suitability.",
    whyItMatters: "This is the answer: your decision aid for whether to pick or fade the player.",
    example: "Overall Rating 75/100 (STRONG confidence) is the final recommendation.",
    interpretation: "Range depends on the model (0–100, 0–1, probability %). Always contextual.",
  },

  // Model-specific metrics (from the objective)
  "overall-rating": {
    key: "overall-rating",
    label: "Overall Rating",
    definition:
      "CaddieIQ's flagship score: an integrated 0–100 assessment of a player's suitability for an upcoming tournament.",
    whyItMatters:
      "Combines skill, form, course fit, field, weather, and market into one trusted number.",
    example: "Jon Rahm at Pebble: 82/100 (VERY STRONG) due to skill, course history, and field.",
    interpretation: "0–100 scale. Bands: <40=Weak, 40–60=Solid, 60–80=Strong, 80+=Very Strong.",
  },

  "dfs-value": {
    key: "dfs-value",
    label: "DFS Value",
    definition:
      "Expected fantasy points minus salary cost, adjusted for field strength and competition.",
    whyItMatters:
      "Identifies DFS lineup opportunities with the best cost-to-upside ratio.",
    example: "$8500 player with 52 projected points at $50k salary cap = good value.",
    interpretation: "Positive value = leverage opportunity. Compare within salary tier.",
  },

  "betting-edge": {
    key: "betting-edge",
    label: "Betting Edge",
    definition:
      "The difference between CaddieIQ's fair probability and the market's implied probability (if CaddieIQ > market, there's value).",
    whyItMatters:
      "Quantifies when the market may be undervaluing or overvaluing a player.",
    example:
      "CaddieIQ projects 12% win prob; market implies 9% (at 11.0 odds) → 3% positive edge.",
    interpretation:
      "Positive edge (CaddieIQ higher) = potential bet opportunity. Magnitude = confidence.",
  },

  "expected-value": {
    key: "expected-value",
    label: "Expected Value (EV)",
    definition:
      "The long-term average profit/loss per unit wagered if you take a bet at given odds.",
    whyItMatters: "The most important metric for betting decisions — positive EV is what matters.",
    example: "50% win prob at 2.0 odds = 0% EV. 50% win prob at 2.2 odds = +10% EV.",
    interpretation:
      "Positive EV = bet. Negative EV = pass. Neutral (0% or close) = coinflip.",
  },

  "strokes-gained": {
    key: "strokes-gained",
    label: "Strokes Gained",
    definition:
      "A golf-specific metric: the number of strokes a player gains/loses vs. a baseline on each shot (off-tee, approach, around-green, putting).",
    whyItMatters:
      "Most predictive golf metric — tells you exactly where a player's edge comes from.",
    example: "Rory at a long course: +0.8 SG off-the-tee, +0.3 SG approach, −0.1 SG putting.",
    interpretation: "Positive = outperforming baseline. Breaks down the skill profile.",
  },

  "scrambling": {
    key: "scrambling",
    label: "Scrambling",
    definition:
      "Ability to save par or better from short-sided or difficult situations.",
    whyItMatters:
      "A wildcard skill that wins tournaments — turning bad breaks into decent scores.",
    example: "60% scrambling rate = 60% of short-sided situations resulted in par or better.",
    interpretation: "Higher is better. Tournament format-dependent (more relevant in strokeplay).",
  },

  "ownership": {
    key: "ownership",
    label: "Ownership %",
    definition: "The percentage of DFS tournament lineups that include a given player.",
    whyItMatters: "Affects leverage (own low ownership for upside, high for safety).",
    example: "A 2% play is unique; a 45% play is chalky and offers no leverage.",
    interpretation: "Low = unique/high upside. High = safe/heavily owned.",
  },

  "confidence-band": {
    key: "confidence-band",
    label: "Confidence Band",
    definition:
      "A range around a score estimate reflecting uncertainty (e.g., 70±5 means 65–75).",
    whyItMatters:
      "Shows how precise the estimate is — narrow bands = more certain.",
    example: "72±2 (narrow, tight) vs. 72±8 (wide, uncertain) are very different.",
    interpretation:
      "Narrow band = high confidence. Wide band = low confidence, seek more data.",
  },

  "model-id": {
    key: "model-id",
    label: "Model ID",
    definition:
      "The unique identifier of which CaddieIQ model produced this explanation (e.g., overall-rating, dfs-value, betting-edge).",
    whyItMatters: "Tells you which algorithm is behind the metric, important for debugging.",
    example: "model.id = 'overall-rating' means Overall Rating model. 'dfs-value' = DFS model.",
    interpretation: "Traceable to a specific model; each model has its own tuning and rules.",
  },

  "limitation": {
    key: "limitation",
    label: "Limitation",
    definition:
      "An honest acknowledgment of missing data, insufficient samples, or other factors that reduce confidence in a result.",
    whyItMatters:
      "Prevents over-confidence. You should act differently if a metric has known limitations.",
    example:
      "Limitation: 'Course history insufficient (only 1 event)' means the course-fit score is less reliable.",
    interpretation:
      "Always read limitations before making a decision. They explain the caveats.",
  },
}

/**
 * Convenience function to look up a metric definition by key.
 * Returns null if not found (allows adding new metrics without crashing).
 */
export function getMetricDefinition(key: string): MetricDefinition | null {
  return METRIC_GLOSSARY[key] ?? null
}
