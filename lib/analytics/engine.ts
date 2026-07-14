/**
 * AnalyticsEngine — the orchestration layer of Golf Intelligence.
 *
 * Responsibilities:
 *   - Hold a set of registered analytics modules.
 *   - Run some or all of them for a given subject/context.
 *   - Aggregate their results into a single typed insight, applying (and
 *     normalizing) per-module weights.
 *   - Provide the seam that future model definitions plug into via
 *     {@link ModuleWeights}.
 *
 * The engine performs no analytics itself — it delegates to modules, each of
 * which currently returns realistic mock values. Aggregation math here is
 * structural (weighted average of already-produced scores), not golf analytics.
 */

import { AnalyticsError, toAnalyticsError } from "./shared/errors"
import { AnalyticsLogger, createAnalyticsLogger, type AnalyticsLogSink } from "./shared/logger"
import type {
  AnalyticsContext,
  AnalyticsModule,
  AnalyticsModuleKey,
  AnalyticsResult,
  AnalyticsResult_Aggregate,
  ConfidenceLevel,
  CourseInsight,
  ModuleWeights,
  PlayerInsight,
  TournamentInsight,
  WeightedResult,
} from "./shared/types"

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
}
const CONFIDENCE_BY_RANK: ConfidenceLevel[] = ["low", "medium", "high"]

export interface AnalyticsEngineOptions {
  /** Modules to register at construction. */
  modules?: AnalyticsModule[]
  /** Default weights applied during aggregation when a run omits them. */
  defaultWeights?: ModuleWeights
  /** Optional log sink for the engine's own logging. */
  logSink?: AnalyticsLogSink
}

export interface RunOptions {
  /** Restrict the run to these modules; defaults to all registered modules. */
  only?: AnalyticsModuleKey[]
  /** Per-module weights for aggregation; merged over the engine defaults. */
  weights?: ModuleWeights
}

export class AnalyticsEngine {
  private readonly modules = new Map<AnalyticsModuleKey, AnalyticsModule>()
  private readonly defaultWeights: ModuleWeights
  private readonly logger: AnalyticsLogger

  constructor(options: AnalyticsEngineOptions = {}) {
    this.defaultWeights = options.defaultWeights ?? {}
    this.logger = createAnalyticsLogger("engine", options.logSink)
    for (const module of options.modules ?? []) {
      this.register(module)
    }
  }

  // --- Registration ---------------------------------------------------------

  /** Register (or replace) a module by its key. Chainable. */
  register(module: AnalyticsModule): this {
    this.modules.set(module.key, module)
    return this
  }

  /** Whether a module is registered. */
  has(key: AnalyticsModuleKey): boolean {
    return this.modules.has(key)
  }

  /** All registered module keys. */
  registeredModules(): AnalyticsModuleKey[] {
    return [...this.modules.keys()]
  }

  // --- Running --------------------------------------------------------------

  /**
   * Run a single module for a context. Throws an `AnalyticsError` if the module
   * is not registered.
   */
  async runModule(
    key: AnalyticsModuleKey,
    context: AnalyticsContext,
  ): Promise<AnalyticsResult> {
    const module = this.modules.get(key)
    if (!module) {
      throw new AnalyticsError(`Module "${key}" is not registered`, {
        module: key,
        code: "NOT_IMPLEMENTED",
      })
    }
    return module.calculate(context)
  }

  /**
   * Run several modules for a context and return their raw results. Modules
   * that don't support the subject kind (or otherwise fail) are skipped, with
   * the failure logged rather than aborting the whole run.
   */
  async run(context: AnalyticsContext, options: RunOptions = {}): Promise<AnalyticsResult[]> {
    const keys = options.only ?? this.registeredModules()
    const results: AnalyticsResult[] = []

    for (const key of keys) {
      const module = this.modules.get(key)
      if (!module) continue
      // Skip modules that don't accept this subject kind.
      if (!module.validate(context).valid) continue

      try {
        results.push(await module.calculate(context))
      } catch (error) {
        const analyticsError = toAnalyticsError(error, key)
        this.logger.warn(`Skipped module "${key}": ${analyticsError.message}`, {
          error: analyticsError.toJSON(),
        })
      }
    }

    return results
  }

  // --- Aggregation ----------------------------------------------------------

  /**
   * Aggregate module results into a blended score using normalized weights.
   * Weights come from `options.weights` merged over the engine defaults; any
   * module without an explicit weight is treated as equal-weighted.
   */
  aggregate(
    context: AnalyticsContext,
    results: AnalyticsResult[],
    options: RunOptions = {},
  ): AnalyticsResult_Aggregate {
    const requested: ModuleWeights = { ...this.defaultWeights, ...options.weights }

    // Assign each result a raw weight (explicit or 1), then normalize to sum 1.
    const rawWeights = results.map((result) => requested[result.module] ?? 1)
    const totalRaw = rawWeights.reduce((sum, weight) => sum + weight, 0) || 1

    const breakdown: WeightedResult[] = results.map((result, index) => ({
      result,
      weight: rawWeights[index] / totalRaw,
    }))

    const overallScore = Number(
      breakdown
        .reduce((sum, item) => sum + item.result.score.value * item.weight, 0)
        .toFixed(1),
    )

    const appliedWeights: ModuleWeights = {}
    for (const item of breakdown) {
      appliedWeights[item.result.module] = Number(item.weight.toFixed(3))
    }

    return {
      subject: context.subject,
      overallScore,
      confidence: this.blendConfidence(results),
      breakdown,
      weights: appliedWeights,
      generatedAt: new Date(),
      mock: results.some((result) => result.mock),
    }
  }

  // --- Typed insight builders ----------------------------------------------

  /** Run + aggregate into a {@link PlayerInsight}. */
  async playerInsight(context: AnalyticsContext, options?: RunOptions): Promise<PlayerInsight> {
    const results = await this.run(context, options)
    const aggregate = this.aggregate(context, results, options)
    return {
      ...aggregate,
      subject: { ...context.subject, kind: "player" },
      headline: this.buildHeadline("player", aggregate.overallScore),
    }
  }

  /** Run + aggregate into a {@link TournamentInsight}. */
  async tournamentInsight(
    context: AnalyticsContext,
    options?: RunOptions,
  ): Promise<TournamentInsight> {
    const results = await this.run(context, options)
    const aggregate = this.aggregate(context, results, options)
    return {
      ...aggregate,
      subject: { ...context.subject, kind: "tournament" },
      headline: this.buildHeadline("tournament", aggregate.overallScore),
      // TODO(sportsdataio): populate by running player insights across the field
      // and ranking them; empty until player-level runs are combined here.
      contenders: [],
    }
  }

  /** Run + aggregate into a {@link CourseInsight}. */
  async courseInsight(context: AnalyticsContext, options?: RunOptions): Promise<CourseInsight> {
    const results = await this.run(context, options)
    const aggregate = this.aggregate(context, results, options)
    return {
      ...aggregate,
      subject: { ...context.subject, kind: "course" },
      headline: this.buildHeadline("course", aggregate.overallScore),
      // TODO(sportsdataio): derive from normalized course characteristics.
      emphasizes: [],
    }
  }

  // --- Internals ------------------------------------------------------------

  private blendConfidence(results: AnalyticsResult[]): ConfidenceLevel {
    if (results.length === 0) return "low"
    const avg =
      results.reduce((sum, result) => sum + CONFIDENCE_RANK[result.confidence], 0) /
      results.length
    return CONFIDENCE_BY_RANK[Math.round(avg)] ?? "medium"
  }

  private buildHeadline(kind: string, score: number): string {
    const band = score >= 75 ? "elite" : score >= 55 ? "strong" : score >= 40 ? "average" : "weak"
    return `Aggregate ${kind} score ${score}/100 — ${band} outlook. (mock)`
  }
}
