import type { CalculatedFeature } from './types'

/**
 * BuildValidator — Validates player intelligence build data
 * 
 * Responsibilities:
 * - Reject NaN, Infinity, out-of-range values
 * - Enforce confidence bounds (0-100)
 * - Detect duplicate feature keys
 * - Validate data completeness (0-100)
 * - Check for required fields
 */

export interface ValidationError {
  field: string
  issue: string
  severity: 'ERROR' | 'WARNING'
}

export class BuildValidator {
  /**
   * Validate all features in a build
   * Returns validation errors if any found
   */
  validateFeatures(features: CalculatedFeature[]): ValidationError[] {
    const errors: ValidationError[] = []
    const seenKeys = new Set<string>()

    for (let i = 0; i < features.length; i++) {
      const feature = features[i]

      // Check duplicate keys
      const key = `${feature.featureName}`
      if (seenKeys.has(key)) {
        errors.push({
          field: `features[${i}].featureName`,
          issue: `Duplicate feature key: ${key}`,
          severity: 'ERROR',
        })
      }
      seenKeys.add(key)

      // Validate confidence
      if (
        !Number.isFinite(feature.confidence) ||
        feature.confidence < 0 ||
        feature.confidence > 100
      ) {
        errors.push({
          field: `features[${i}].confidence`,
          issue: `Confidence must be number between 0-100, got ${feature.confidence}`,
          severity: 'ERROR',
        })
      }

      // Validate feature value
      if (feature.featureValue !== null && feature.featureValue !== undefined) {
        if (!Number.isFinite(feature.featureValue)) {
          errors.push({
            field: `features[${i}].featureValue`,
            issue: `Feature value must be finite number, got ${feature.featureValue}`,
            severity: 'ERROR',
          })
        }
      }

      // Require featureName
      if (!feature.featureName || feature.featureName.trim().length === 0) {
        errors.push({
          field: `features[${i}].featureName`,
          issue: `Feature name is required`,
          severity: 'ERROR',
        })
      }

      // Require featureCategory
      if (!feature.featureCategory || feature.featureCategory.trim().length === 0) {
        errors.push({
          field: `features[${i}].featureCategory`,
          issue: `Feature category is required`,
          severity: 'ERROR',
        })
      }

      // At least one value must be present
      if (feature.featureValue === null && (!feature.featureValueStr || feature.featureValueStr.trim().length === 0)) {
        errors.push({
          field: `features[${i}]`,
          issue: `Either featureValue or featureValueStr must be provided`,
          severity: 'ERROR',
        })
      }
    }

    return errors
  }

  /**
   * Validate data completeness percentage
   */
  validateDataCompleteness(dataCompleteness: number): ValidationError[] {
    const errors: ValidationError[] = []

    if (
      !Number.isFinite(dataCompleteness) ||
      dataCompleteness < 0 ||
      dataCompleteness > 100 ||
      !Number.isInteger(dataCompleteness)
    ) {
      errors.push({
        field: 'dataCompleteness',
        issue: `Data completeness must be integer between 0-100, got ${dataCompleteness}`,
        severity: 'ERROR',
      })
    }

    return errors
  }

  /**
   * Validate feature counts
   */
  validateFeatureCounts(featureCount: number, completedFeatureCount: number): ValidationError[] {
    const errors: ValidationError[] = []

    if (!Number.isInteger(featureCount) || featureCount < 0) {
      errors.push({
        field: 'featureCount',
        issue: `Feature count must be non-negative integer, got ${featureCount}`,
        severity: 'ERROR',
      })
    }

    if (!Number.isInteger(completedFeatureCount) || completedFeatureCount < 0) {
      errors.push({
        field: 'completedFeatureCount',
        issue: `Completed feature count must be non-negative integer, got ${completedFeatureCount}`,
        severity: 'ERROR',
      })
    }

    if (completedFeatureCount > featureCount) {
      errors.push({
        field: 'completedFeatureCount',
        issue: `Completed feature count (${completedFeatureCount}) cannot exceed total feature count (${featureCount})`,
        severity: 'ERROR',
      })
    }

    return errors
  }

  /**
   * Validate entire build result
   * Returns all validation errors (blocking and warnings)
   */
  validateBuild(
    features: CalculatedFeature[],
    dataCompleteness: number,
    featureCount: number,
    completedFeatureCount: number,
  ): ValidationError[] {
    const errors: ValidationError[] = []

    errors.push(...this.validateFeatures(features))
    errors.push(...this.validateDataCompleteness(dataCompleteness))
    errors.push(...this.validateFeatureCounts(featureCount, completedFeatureCount))

    return errors
  }

  /**
   * Check if validation errors are blocking
   */
  hasBlockingErrors(errors: ValidationError[]): boolean {
    return errors.some((e) => e.severity === 'ERROR')
  }
}

export function getDefaultBuildValidator(): BuildValidator {
  return new BuildValidator()
}
