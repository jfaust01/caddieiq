/**
 * The RankingPipeline abstraction.
 *
 * A pipeline turns a {@link RankingContext} into a {@link RankingPipelineResult}
 * by running an ordered set of stages:
 *
 *   1. Load Players
 *   2. Load Analytics
 *   3. Normalize Scores
 *   4. Apply Weights
 *   5. Calculate Ranking
 *   6. Generate Explanation (placeholder)
 *   7. Return Ranking Results
 *
 * {@link RankingPipeline} is the abstract template: `run()` executes the stages
 * in order, timing each and collecting {@link RankingStageResult} diagnostics,
 * and delegates the actual work to protected stage methods that subclasses
 * implement. {@link DefaultRankingPipeline} is the built-in implementation that
 * currently synthesizes realistic, deterministic mock rankings.
 *
 * No real analytics run here yet — see the `TODO(analytics)` / `TODO(ai)`
 * markers for where live data and AI explanations will plug in.
 */

import type { AnalyticsModuleKey, AnalyticsResult } from "@/lib/analytics/shared/types"
import { getDefaultWeights } from "./ranking-registry"
import type {
  PlayerRankingResult,
  RankingContext,
  RankingExplanation,
  RankingMetric,
  RankingPipelineResult,
  RankingStageName,
  RankingStageResult,
  RankingWeights,
} from "./types"
import {
  blendConfidence,
  clamp,
  confidenceFromScore,
  createRankingLogger,
  mockScore,
  movementFromDelta,
  normalizeWeights,
  RankingLogger,
  roundTo,
  seededRandom,
  hashString,
  type RankingLogSink,
} from "./utils"

/** Mutable state threaded through the pipeline stages for one run. */
export interface RankingPipelineState {
  context: RankingContext
  /** Effective, normalized weights for the run. */
  weights: RankingWeights
  /** Analytics results keyed by playerId (real or mock). */
  analytics: Record<string, AnalyticsResult[]>
  /** Per-player normalized module scores (0–100), keyed by playerId. */
  normalized: Record<string, Partial<Record<AnalyticsModuleKey, number>>>
  /** Ranking rows, populated during Calculate Ranking. */
  results: PlayerRankingResult[]
  /** Stage diagnostics accumulated across the run. */
  stages: RankingStageResult[]
  /** Whether any stage used placeholder values. */
  mock: boolean
}

export interface RankingPipelineOptions {
  logSink?: RankingLogSink
}

export abstract class RankingPipeline {
  protected readonly logger: RankingLogger

  constructor(options: RankingPipelineOptions = {}) {
    this.logger = createRankingLogger("pipeline", options.logSink)
  }

  /** Human-friendly pipeline name for logs. */
  abstract readonly name: string

  // --- Template method ------------------------------------------------------

  /**
   * Execute all stages in order, timing each. Individual stage errors are not
   * swallowed — a failing stage aborts the run so callers see the problem.
   */
  async run(context: RankingContext): Promise<RankingPipelineResult> {
    const startedAt = Date.now()
    const state: RankingPipelineState = {
      context,
      weights: {},
      analytics: {},
      normalized: {},
      results: [],
      stages: [],
      mock: false,
    }

    this.logger.info(`Running "${this.name}" for ranking type "${context.type}"`, {
      players: context.players.length,
    })

    await this.runStage(state, "load-players", () => this.loadPlayers(state))
    await this.runStage(state, "load-analytics", () => this.loadAnalytics(state))
    await this.runStage(state, "normalize-scores", () => this.normalizeScores(state))
    await this.runStage(state, "apply-weights", () => this.applyWeights(state))
    await this.runStage(state, "calculate-ranking", () => this.calculateRanking(state))
    await this.runStage(state, "generate-explanation", () => this.generateExplanation(state))

    const result = this.returnResults(state, Date.now() - startedAt)
    return result
  }

  // --- Stage contract (implemented by subclasses) --------------------------

  protected abstract loadPlayers(state: RankingPipelineState): Promise<number> | number
  protected abstract loadAnalytics(state: RankingPipelineState): Promise<number> | number
  protected abstract normalizeScores(state: RankingPipelineState): Promise<number> | number
  protected abstract applyWeights(state: RankingPipelineState): Promise<number> | number
  protected abstract calculateRanking(state: RankingPipelineState): Promise<number> | number
  protected abstract generateExplanation(
    state: RankingPipelineState,
  ): Promise<number> | number

  // --- Shared finalization --------------------------------------------------

  /** Assemble the immutable result. Shared by all pipelines. */
  protected returnResults(
    state: RankingPipelineState,
    durationMs: number,
  ): RankingPipelineResult {
    this.recordStage(state, "return-results", state.results.length, 0)
    return {
      type: state.context.type,
      scope: state.context.scope,
      results: state.results,
      weights: state.weights,
      stages: state.stages,
      generatedAt: new Date(),
      durationMs,
      mock: state.mock,
    }
  }

  // --- Internals ------------------------------------------------------------

  private async runStage(
    state: RankingPipelineState,
    stage: RankingStageName,
    fn: () => Promise<number> | number,
  ): Promise<void> {
    const started = Date.now()
    const count = await fn()
    this.recordStage(state, stage, count ?? 0, Date.now() - started)
  }

  protected recordStage(
    state: RankingPipelineState,
    stage: RankingStageName,
    count: number,
    durationMs: number,
    note?: string,
  ): void {
    state.stages.push({ stage, count, durationMs, note })
  }
}

/**
 * The built-in pipeline. Produces deterministic, realistic mock rankings so the
 * rest of the product can build against stable output before analytics are
 * live. Swap in a different {@link RankingPipeline} to change behavior.
 */
export class DefaultRankingPipeline extends RankingPipeline {
  readonly name = "default-mock"

  /** Stage 1 — Load Players. Players arrive on the context; just count them. */
  protected loadPlayers(state: RankingPipelineState): number {
    // TODO(data): resolve full player records from the domain model here.
    return state.context.players.length
  }

  /**
   * Stage 2 — Load Analytics. Use analytics attached to the context when
   * present; otherwise synthesize deterministic mock module scores per player.
   */
  protected loadAnalytics(state: RankingPipelineState): number {
    const modules = Object.keys(
      getDefaultWeights(state.context.type),
    ) as AnalyticsModuleKey[]

    let synthesized = 0
    for (const player of state.context.players) {
      const provided = state.context.analytics?.[player.playerId]
      if (provided && provided.length > 0) {
        state.analytics[player.playerId] = provided
        continue
      }
      // TODO(analytics): replace with AnalyticsEngine.run() per player.
      state.mock = true
      synthesized += 1
      state.analytics[player.playerId] = modules.map((module) =>
        this.mockAnalyticsResult(player.playerId, module),
      )
    }
    if (synthesized > 0) {
      this.logger.debug(`Synthesized mock analytics for ${synthesized} player(s)`)
    }
    return state.context.players.length
  }

  /** Stage 3 — Normalize Scores. Collapse each module's result to a 0–100 value. */
  protected normalizeScores(state: RankingPipelineState): number {
    for (const [playerId, results] of Object.entries(state.analytics)) {
      const perModule: Partial<Record<AnalyticsModuleKey, number>> = {}
      for (const result of results) {
        perModule[result.module] = clamp(result.score.value)
      }
      state.normalized[playerId] = perModule
    }
    return Object.keys(state.normalized).length
  }

  /** Stage 4 — Apply Weights. Merge overrides over registry defaults + normalize. */
  protected applyWeights(state: RankingPipelineState): number {
    const merged: RankingWeights = {
      ...getDefaultWeights(state.context.type),
      ...state.context.weights,
    }
    state.weights = normalizeWeights(merged)
    return Object.keys(state.weights).length
  }

  /** Stage 5 — Calculate Ranking. Weighted blend, then sort + assign ranks. */
  protected calculateRanking(state: RankingPipelineState): number {
    const weights = state.weights
    const weightKeys = Object.keys(weights) as AnalyticsModuleKey[]

    const scored = state.context.players.map((player) => {
      const perModule = state.normalized[player.playerId] ?? {}
      const metrics: RankingMetric[] = weightKeys.map((module) => {
        const value = perModule[module] ?? 0
        const weight = weights[module] ?? 0
        return {
          module,
          label: module,
          value: roundTo(value, 1),
          weight,
          contribution: roundTo(value * weight, 2),
        }
      })

      const overall = roundTo(
        metrics.reduce((sum, metric) => sum + metric.contribution, 0),
        1,
      )

      return { player, metrics, overall }
    })

    // Higher composite ranks first; stable tiebreak on label for determinism.
    scored.sort((a, b) => b.overall - a.overall || a.player.playerId.localeCompare(b.player.playerId))

    state.results = scored.map((entry, index) => {
      const rank = index + 1
      // TODO(data): source `previousRank` from the last persisted snapshot.
      const previousRank = this.mockPreviousRank(
        entry.player.playerId,
        state.context.type,
        rank,
        scored.length,
      )
      const delta = previousRank === null ? 0 : previousRank - rank

      return {
        rank,
        previousRank,
        movement: movementFromDelta(delta),
        delta,
        playerId: entry.player.playerId,
        label: entry.player.label ?? entry.player.playerId,
        score: {
          overall: entry.overall,
          confidence: confidenceFromScore(entry.overall),
          metrics: entry.metrics,
        },
      }
    })

    return state.results.length
  }

  /**
   * Stage 6 — Generate Explanation (placeholder). Attaches a mock rationale so
   * the shape is exercised end-to-end.
   *
   * TODO(ai): replace with real AI-generated explanations grounded in the
   * weighted breakdown and the underlying analytics narratives.
   */
  protected generateExplanation(state: RankingPipelineState): number {
    for (const result of state.results) {
      result.explanation = this.mockExplanation(result)
    }
    return state.results.length
  }

  // --- Mock helpers ---------------------------------------------------------

  private mockAnalyticsResult(playerId: string, module: AnalyticsModuleKey): AnalyticsResult {
    const value = mockScore(`${playerId}:${module}`)
    return {
      module,
      subject: { kind: "player", id: playerId },
      score: {
        module,
        key: module,
        label: module,
        value,
        confidence: confidenceFromScore(value),
      },
      metrics: [],
      summary: `Mock ${module} score for player ${playerId}.`,
      confidence: confidenceFromScore(value),
      generatedAt: new Date(),
      durationMs: 0,
      mock: true,
    }
  }

  private mockPreviousRank(
    playerId: string,
    type: string,
    currentRank: number,
    total: number,
  ): number | null {
    // Deterministic small drift of ±3 around the current rank.
    const rng = seededRandom(hashString(`${playerId}:${type}:prev`))
    const drift = Math.round((rng() - 0.5) * 6)
    return Math.min(total, Math.max(1, currentRank + drift))
  }

  private mockExplanation(result: PlayerRankingResult): RankingExplanation {
    const top = [...result.score.metrics]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 2)
      .map((metric) => metric.module)
    const confidence = blendConfidence([result.score.confidence])
    return {
      summary: `Ranked #${result.rank} (${result.score.overall}/100) — driven by ${
        top.join(" and ") || "balanced signals"
      }. (mock)`,
      bullets: top.map((module) => `Strong ${module} contribution.`),
      generatedAt: new Date(),
      mock: true,
    }
  }
}
