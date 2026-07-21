import type { BuildResult } from './types'

/**
 * ActivationPolicy — Determines which builds are eligible for activation
 * 
 * Explicit rules for what constitutes a "good" build:
 * - Only SUCCESS status can be activated
 * - Minimum data completeness threshold
 * - Presence of required features
 * - No blocking validation errors
 * 
 * Enables declarative governance of what data downstream systems see
 */

export interface ActivationPolicyConfig {
  /// Only activate builds with this status
  activatableStatuses: string[]

  /// Minimum data completeness percentage (0-100)
  minimumCompleteness: number

  /// Required features: all must be present and non-null
  requiredFeatures: string[]

  /// Minimum number of total features required
  minimumFeatureCount: number
}

export interface ActivationEvaluation {
  eligible: boolean
  reasons: string[]
  warnings: string[]
}

export class ActivationPolicy {
  private config: ActivationPolicyConfig

  constructor(config: ActivationPolicyConfig) {
    this.config = config
  }

  /**
   * Evaluate if a build is eligible for activation
   */
  evaluate(
    buildResult: BuildResult,
    featureNames: string[],
    featureValues: Map<string, { value: number | string | null }>,
  ): ActivationEvaluation {
    const reasons: string[] = []
    const warnings: string[] = []
    let eligible = true

    // Check status
    if (!this.config.activatableStatuses.includes(buildResult.status)) {
      reasons.push(
        `Build status "${buildResult.status}" not in activatable statuses: [${this.config.activatableStatuses.join(', ')}]`,
      )
      eligible = false
    }

    // Check minimum completeness
    if (buildResult.dataCompleteness < this.config.minimumCompleteness) {
      reasons.push(
        `Data completeness ${buildResult.dataCompleteness}% below minimum ${this.config.minimumCompleteness}%`,
      )
      eligible = false
    }

    // Check minimum feature count
    if (featureNames.length < this.config.minimumFeatureCount) {
      reasons.push(
        `Feature count ${featureNames.length} below minimum ${this.config.minimumFeatureCount}`,
      )
      eligible = false
    }

    // Check required features present and non-null
    for (const requiredFeature of this.config.requiredFeatures) {
      if (!featureNames.includes(requiredFeature)) {
        reasons.push(`Required feature "${requiredFeature}" not present in build`)
        eligible = false
      } else {
        const featureData = featureValues.get(requiredFeature)
        if (!featureData || featureData.value === null) {
          reasons.push(`Required feature "${requiredFeature}" is null/missing`)
          eligible = false
        }
      }
    }

    // Warnings for non-critical issues
    if (buildResult.calculatorFailures.length > 0) {
      warnings.push(
        `${buildResult.calculatorFailures.length} calculators failed (build is ${buildResult.status}, may indicate incomplete data)`,
      )
    }

    return {
      eligible,
      reasons,
      warnings,
    }
  }

  /**
   * Get default production policy
   * (Can be overridden for different environments)
   */
  static getDefaultProductionPolicy(): ActivationPolicy {
    return new ActivationPolicy({
      activatableStatuses: ['SUCCESS'],
      minimumCompleteness: 60,
      requiredFeatures: ['tournament_count', 'avg_finish'],
      minimumFeatureCount: 3,
    })
  }

  /**
   * Get permissive policy for development/testing
   */
  static getPermissivePolicy(): ActivationPolicy {
    return new ActivationPolicy({
      activatableStatuses: ['SUCCESS', 'PARTIAL'],
      minimumCompleteness: 25,
      requiredFeatures: ['tournament_count'],
      minimumFeatureCount: 1,
    })
  }
}

export function getActivationPolicy(env?: string): ActivationPolicy {
  if (env === 'production') {
    return ActivationPolicy.getDefaultProductionPolicy()
  }
  return ActivationPolicy.getPermissivePolicy()
}
