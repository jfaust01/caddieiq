/**
 * Model registry — the single source of truth for which models exist and how to
 * describe them. The "Why?" UI, the admin debug view, and every adapter read
 * their metadata from here, so adding a model is a one-line change in one place.
 */

import type { ModelId, ModelMeta } from "./types"

/** Metadata for every explainable model, keyed by {@link ModelId}. */
export const MODEL_REGISTRY: Readonly<Record<ModelId, ModelMeta>> = {
  "overall-rating": {
    id: "overall-rating",
    label: "Overall Rating",
    category: "player",
    methodology:
      "CaddieIQ's signature 0–100 player rating: the mean of the available season analytics (form, consistency, activity, fantasy production, season performance), each normalized against the field.",
  },
  "course-fit": {
    id: "course-fit",
    label: "Course Fit",
    category: "player-tournament",
    methodology:
      "Estimates how a player's skill profile matches a course's demands: a demand-weighted blend of per-family skill signals, scored only where both the course demand and the player's skill are verified.",
  },
  "dfs-value": {
    id: "dfs-value",
    label: "DFS Value",
    category: "player-tournament",
    methodology:
      "Composes the independent Signal Families (Player Skill, Course Fit, Market, Form, Weather) with DraftKings salary into one value score — projected quality relative to cost — capped by the Tournament Context confidence ceiling.",
  },
  "betting-value": {
    id: "betting-value",
    label: "Betting Value",
    category: "player-tournament",
    methodology:
      "Reads the de-vigged market consensus (fair win probability, price dispersion, book agreement) from verified multi-book odds. The edge/value model on top of the market is not yet implemented.",
  },
  "fantasy-projection": {
    id: "fantasy-projection",
    label: "Fantasy Projection",
    category: "player-tournament",
    methodology:
      "Surfaces per-tournament projected fantasy points (DraftKings / FanDuel) from the provider. Projection values are scrambled on the current provider tier and become real automatically once a production key is installed.",
  },
  "player-skill": {
    id: "player-skill",
    label: "Player Skill",
    category: "player",
    methodology:
      "Normalizes verified round statistics into field-relative 0–100 skill signals across fifteen categories. There is no single composite score — each skill is rated on its own, and unsourced skills stay explicitly unknown.",
  },
  "weather-intelligence": {
    id: "weather-intelligence",
    label: "Weather Intelligence",
    category: "tournament",
    methodology:
      "Turns verified forecast snapshots into a golf-relevant signal family (wind, rain, temperature, playability, tee-time wave edge). It is a signal family, not a 0–100 score; a completed or unlocated event degrades honestly.",
  },
  "tournament-context": {
    id: "tournament-context",
    label: "Tournament Context",
    category: "tournament",
    methodology:
      "Resolves the verified event facts (course, dates, official field) that gate every event-specific model, and sets the confidence ceiling those models can never exceed. It is context, not a score.",
  },
}

/** Every model id, in a stable display order. */
export const MODEL_IDS: readonly ModelId[] = [
  "overall-rating",
  "player-skill",
  "course-fit",
  "dfs-value",
  "betting-value",
  "fantasy-projection",
  "weather-intelligence",
  "tournament-context",
]

/** Ordered registry entries, for enumerating models in the UI. */
export const MODELS: readonly ModelMeta[] = MODEL_IDS.map((id) => MODEL_REGISTRY[id])

/** Look up a model's metadata by id. */
export function getModelMeta(id: ModelId): ModelMeta {
  return MODEL_REGISTRY[id]
}
