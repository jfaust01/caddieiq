/**
 * RankingEngine — the orchestration layer and single entry point for producing
 * rankings in CaddieIQ.
 *
 * Responsibilities:
 *   - Accept player inputs and (optionally) pre-computed analytics outputs.
 *   - Apply the weighting pipeline for a given ranking type.
 *   - Generate typed {@link RankingPipelineResult}s.
 *   - Provide the seams for future custom models and AI explanations.
 *
 * The engine performs no ranking math itself — it delegates to a
 * {@link RankingPipeline} (the default one currently returns realistic mock
 * rankings). Swapping the pipeline is how future custom models change behavior.
 */

import type { AnalyticsResult } from "@/lib/analytics/shared/types"
import {
  DefaultRankingPipeline,
  type RankingPipeline,
} from "./ranking-pipeline"
import { getRankingModel } from "./ranking-registry"
import type {
  PlayerRankingResult,
  RankingContext,
  RankingPipelineResult,
  RankingPlayerInput,
  RankingScope,
  RankingType,
  RankingWeights,
} from "./types"
import { createRankingLogger, RankingLogger, type RankingLogSink } from "./utils"

export interface RankingEngineOptions {
  /** Pipeline to run; defaults to {@link DefaultRankingPipeline}. */
  pipeline?: RankingPipeline
  logSink?: RankingLogSink
}

/** Options accepted by the convenience ranking methods. */
export interface RankPlayersOptions {
  scope?: RankingScope
  /** Weight overrides merged over the ranking type's registry defaults. */
  weights?: RankingWeights
  /** Analytics outputs keyed by playerId; synthesized as mock when omitted. */
  analytics?: Record<string, AnalyticsResult[]>
  /** Optional custom-model id when `type` is `"model"`. */
  modelId?: string
  params?: Record<string, unknown>
}

export class RankingEngine {
  private pipeline: RankingPipeline
  private readonly logger: RankingLogger

  constructor(options: RankingEngineOptions = {}) {
    this.pipeline = options.pipeline ?? new DefaultRankingPipeline({ logSink: options.logSink })
    this.logger = createRankingLogger("engine", options.logSink)
  }

  /** Swap the pipeline (e.g. to drive a future custom model). Chainable. */
  usePipeline(pipeline: RankingPipeline): this {
    this.pipeline = pipeline
    return this
  }

  /**
   * Run a full ranking from a fully-formed context. This is the lowest-level
   * entry point; most callers use {@link rankPlayers}.
   */
  async rank(context: RankingContext): Promise<RankingPipelineResult> {
    this.logger.info(`Ranking ${context.players.length} player(s) as "${context.type}"`)
    return this.pipeline.run(context)
  }

  /**
   * Convenience wrapper that assembles a {@link RankingContext} from a player
   * list and options, then runs the pipeline.
   */
  async rankPlayers(
    type: RankingType,
    players: RankingPlayerInput[],
    options: RankPlayersOptions = {},
  ): Promise<RankingPipelineResult> {
    const context: RankingContext = {
      type,
      scope: options.scope,
      players,
      analytics: options.analytics,
      weights: this.resolveWeights(type, options),
      params: options.params,
    }
    return this.rank(context)
  }

  /**
   * Placeholder for future AI-generated ranking explanations. The pipeline
   * already attaches mock explanations; this method is where a dedicated AI
   * pass would enrich or regenerate them.
   *
   * TODO(ai): call the AI layer to produce grounded, model-attributed
   * explanations for the given results.
   */
  async explain(results: PlayerRankingResult[]): Promise<PlayerRankingResult[]> {
    this.logger.debug(`explain() is a placeholder; returning ${results.length} result(s) unchanged`)
    return results
  }

  // --- Internals ------------------------------------------------------------

  /**
   * Resolve the effective weight overrides. For a `"model"` ranking, a
   * registered custom model's weights take precedence when a `modelId` is given.
   */
  private resolveWeights(
    type: RankingType,
    options: RankPlayersOptions,
  ): RankingWeights | undefined {
    if (type === "model" && options.modelId) {
      const model = getRankingModel(options.modelId)
      if (model) return { ...model.weights, ...options.weights }
      // TODO(model): surface a clearer error once custom models are persisted.
      this.logger.warn(`Custom model "${options.modelId}" not found; using defaults`)
    }
    return options.weights
  }
}
