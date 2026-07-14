/**
 * Registry of ranking types and their default weight profiles.
 *
 * Each {@link RankingType} maps to a {@link RankingTypeDefinition} describing how
 * the seven analytics modules should be weighted when producing that ranking.
 * The engine reads these defaults (then applies any per-run overrides) so the
 * "meaning" of each ranking lives in one place. Future custom models register
 * themselves here via {@link registerRankingModel}.
 *
 * Weights are relative and need not sum to 1 — the engine normalizes them.
 */

import type {
  RankingModelDefinition,
  RankingType,
  RankingTypeDefinition,
  RankingWeights,
} from "./types"

/**
 * Built-in ranking definitions. The weight vectors are deliberate but
 * illustrative placeholders; tuning happens once real analytics land.
 *
 * TODO(analytics): calibrate these weights against backtested analytics output.
 */
export const rankingRegistry = {
  overall: {
    type: "overall",
    label: "Overall",
    description: "Balanced blend of every analytics signal into one power ranking.",
    defaultWeights: {
      "recent-form": 0.2,
      "strokes-gained": 0.25,
      "course-fit": 0.15,
      consistency: 0.15,
      momentum: 0.1,
      value: 0.1,
      wind: 0.05,
    },
  },
  "course-fit": {
    type: "course-fit",
    label: "Course Fit",
    description: "Ranks players by how well their game suits a specific venue.",
    defaultWeights: {
      "course-fit": 0.55,
      "strokes-gained": 0.2,
      "recent-form": 0.15,
      wind: 0.1,
    },
  },
  "recent-form": {
    type: "recent-form",
    label: "Recent Form",
    description: "Emphasizes results and trajectory over the last several starts.",
    defaultWeights: {
      "recent-form": 0.6,
      momentum: 0.25,
      "strokes-gained": 0.15,
    },
  },
  value: {
    type: "value",
    label: "Value",
    description: "Surfaces players whose model strength outpaces their market price.",
    defaultWeights: {
      value: 0.55,
      "recent-form": 0.2,
      "course-fit": 0.15,
      momentum: 0.1,
    },
  },
  momentum: {
    type: "momentum",
    label: "Momentum",
    description: "Prioritizes players trending sharply upward right now.",
    defaultWeights: {
      momentum: 0.6,
      "recent-form": 0.3,
      "strokes-gained": 0.1,
    },
  },
  wind: {
    type: "wind",
    label: "Wind",
    description: "Ranks players by expected performance in windy conditions.",
    defaultWeights: {
      wind: 0.6,
      "strokes-gained": 0.2,
      consistency: 0.2,
    },
  },
  model: {
    type: "model",
    label: "Model",
    description: "Placeholder for user-defined custom models and their weightings.",
    defaultWeights: {
      "recent-form": 0.15,
      "strokes-gained": 0.15,
      "course-fit": 0.15,
      consistency: 0.15,
      momentum: 0.15,
      value: 0.15,
      wind: 0.1,
    },
    comingSoon: true,
  },
} satisfies Record<RankingType, RankingTypeDefinition>

/** Every ranking type key. */
export function listRankingTypes(): RankingType[] {
  return Object.keys(rankingRegistry) as RankingType[]
}

/** Look up a ranking definition, throwing if the type is unknown. */
export function getRankingDefinition(type: RankingType): RankingTypeDefinition {
  const definition = rankingRegistry[type]
  if (!definition) {
    throw new Error(`Unknown ranking type: "${type as string}"`)
  }
  return definition
}

/** The default (relative) weights for a ranking type. */
export function getDefaultWeights(type: RankingType): RankingWeights {
  return { ...getRankingDefinition(type).defaultWeights }
}

// ---------------------------------------------------------------------------
// Custom model registry (future)
// ---------------------------------------------------------------------------

const customModels = new Map<string, RankingModelDefinition>()

/**
 * Register a future user-defined ranking model. Models are keyed by id and can
 * later be resolved by the engine to drive a `"model"` ranking run.
 *
 * TODO(model): persist custom models and expose them through the Model Lab UI.
 */
export function registerRankingModel(model: RankingModelDefinition): void {
  customModels.set(model.id, model)
}

/** Resolve a previously registered custom model. */
export function getRankingModel(id: string): RankingModelDefinition | undefined {
  return customModels.get(id)
}

/** List all registered custom models. */
export function listRankingModels(): RankingModelDefinition[] {
  return [...customModels.values()]
}
