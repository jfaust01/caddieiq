/**
 * Abstract base class implemented by every analytics module.
 *
 * It supplies cross-cutting behavior so concrete modules only implement the
 * metric-specific parts:
 *   - `calculate()` is a template method that validates the context, logs
 *     Start/Success/Failure, measures duration, and funnels every thrown value
 *     through `toAnalyticsError`.
 *   - a default `validate()` that checks the subject is present and of an
 *     accepted kind.
 *   - `buildScore()` / `buildResult()` helpers for assembling typed output.
 *
 * Concrete modules implement the protected `compute()` (the actual scoring,
 * currently mock) and `summarize()`.
 */

import { AnalyticsValidationError, toAnalyticsError } from "./errors"
import { AnalyticsLogger, createAnalyticsLogger, type AnalyticsLogSink } from "./logger"
import type {
  AnalyticsContext,
  AnalyticsModule,
  AnalyticsModuleKey,
  AnalyticsResult,
  AnalyticsSubjectKind,
  ConfidenceLevel,
  MetricScore,
  MetricTrend,
  ValidationResult,
} from "./types"

export abstract class BaseAnalyticsModule implements AnalyticsModule {
  abstract readonly key: AnalyticsModuleKey
  abstract readonly label: string
  abstract readonly description: string

  /**
   * Subject kinds this module supports. Defaults to players; modules that also
   * score tournaments or courses widen this.
   */
  protected readonly supportedSubjects: AnalyticsSubjectKind[] = ["player"]

  protected readonly logger: AnalyticsLogger

  constructor(logSink?: AnalyticsLogSink) {
    // `key` is set on the subclass instance before this runs in practice, but
    // TypeScript can't prove that; the logger reads it lazily on first use via
    // the getter below.
    this.logger = createAnalyticsLogger(this.loggerKey, logSink)
  }

  /** Resolve the module key for logging; overridable if needed. */
  protected get loggerKey(): AnalyticsModuleKey | "engine" {
    return this.key
  }

  // --- Template method: validation, logging, timing, error handling --------

  async calculate(context: AnalyticsContext): Promise<AnalyticsResult> {
    const start = Date.now()
    const validation = this.validate(context)
    if (!validation.valid) {
      throw new AnalyticsValidationError(
        `Invalid context for module "${this.key}"`,
        { module: this.key, issues: validation.issues },
      )
    }

    this.logger.start(context.subject)
    try {
      const result = await this.compute(context)
      const durationMs = Date.now() - start
      this.logger.success(context.subject, durationMs)
      return { ...result, durationMs }
    } catch (error) {
      const durationMs = Date.now() - start
      const analyticsError = toAnalyticsError(error, this.key)
      this.logger.failure(context.subject, analyticsError, durationMs)
      throw analyticsError
    }
  }

  /**
   * The actual scoring for a subject. Runs *inside* the validation/logging/
   * timing wrapper provided by {@link calculate}, so implementations should not
   * log lifecycle events themselves. Currently returns mock values.
   */
  protected abstract compute(context: AnalyticsContext): Promise<AnalyticsResult>

  /** Turn a result into a concise, human-readable narrative. */
  abstract summarize(result: AnalyticsResult): string

  // --- Default validation ---------------------------------------------------

  validate(context: AnalyticsContext): ValidationResult {
    const issues: ValidationResult["issues"] = []
    const subject = context?.subject

    if (!subject) {
      issues.push({ path: "subject", message: "A subject is required." })
    } else {
      if (!subject.id) {
        issues.push({ path: "subject.id", message: "A subject id is required." })
      }
      if (!this.supportedSubjects.includes(subject.kind)) {
        issues.push({
          path: "subject.kind",
          message: `Module "${this.key}" does not support subject kind "${subject.kind}".`,
        })
      }
    }

    return { valid: issues.length === 0, issues }
  }

  // --- Assembly helpers -----------------------------------------------------

  /** Assemble a typed {@link MetricScore} for this module. */
  protected buildScore(
    key: string,
    label: string,
    value: number,
    extra: {
      rawValue?: number
      unit?: string
      percentile?: number
      trend?: MetricTrend
      confidence?: ConfidenceLevel
      description?: string
    } = {},
  ): MetricScore {
    return {
      module: this.key,
      key,
      label,
      value,
      confidence: extra.confidence ?? "medium",
      rawValue: extra.rawValue,
      unit: extra.unit,
      percentile: extra.percentile,
      trend: extra.trend,
      description: extra.description,
    }
  }

  /** Assemble a typed {@link AnalyticsResult}. `durationMs` is set by `calculate`. */
  protected buildResult(
    context: AnalyticsContext,
    score: MetricScore,
    metrics: MetricScore[],
    summary: string,
    confidence: ConfidenceLevel,
  ): AnalyticsResult {
    return {
      module: this.key,
      subject: context.subject,
      score,
      metrics,
      summary,
      confidence,
      generatedAt: new Date(),
      durationMs: 0,
      mock: true,
    }
  }
}
