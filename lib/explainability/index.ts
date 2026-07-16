/**
 * Model Explainability Engine — public barrel.
 *
 * The one import surface for "why does a model say what it says". Everything
 * here is pure (no I/O, no provider imports), so it is safe to import from
 * server services, pure engines, and client components alike. Callers resolve a
 * model's native output however they already do, then pass it to the matching
 * `to<Model>Explanation` adapter to get the canonical {@link Explanation}.
 */

export * from "./types"
export * from "./confidence"
export * from "./registry"
export {
  buildHeadline,
  byContribution,
  directionFromScore,
  emptyNarrative,
  round1,
  roundOrNull,
} from "./helpers"

// Adapters — one per registered model.
export { toOverallRatingExplanation } from "./adapters/overall-rating"
export { toPlayerSkillExplanation } from "./adapters/player-skill"
export { toCourseFitExplanation } from "./adapters/course-fit"
export { toDfsValueExplanation } from "./adapters/dfs-value"
export { toBettingValueExplanation } from "./adapters/betting-value"
export { toFantasyProjectionExplanation } from "./adapters/fantasy-projection"
export { toWeatherExplanation } from "./adapters/weather-intelligence"
export { toTournamentContextExplanation } from "./adapters/tournament-context"

// Narrator — deterministic prose generation (LLM-ready seam).
export * from "./narrator"
