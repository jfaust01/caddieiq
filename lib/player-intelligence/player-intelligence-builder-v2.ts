import type { CalculatedFeature, BuildResult, FeatureCalculator } from './types'
import { getPlayerIntelligenceRepository } from '@/lib/repositories/player-intelligence-repository'
import { getPlayerDataLoader } from './data-loader'
import { BuildValidator } from './build-validator'
import { ActivationPolicy } from './activation-policy'
import { VersionRegistry, type VersionSnapshot, getCapturedVersionSnapshot } from './version-registry'
import {
  TournamentCountCalculator,
  AverageFinishCalculator,
  CutPercentageCalculator,
  Top10PercentageCalculator,
  AverageDKPointsCalculator,
  AverageSalaryCalculator,
  SalaryValueCalculator,
} from './calculators'

/**
 * PlayerIntelligenceBuildv2 — Versioned snapshot builder with atomic activation
 * 
 * Workflow:
 * 1. Create CANDIDATE build (immutable row)
 * 2. Calculate all features
 * 3. Validate numerics and schema
 * 4. Update build status to SUCCESS/PARTIAL/FAILED
 * 5. Evaluate activation policy
 * 6. Atomically promote to ACTIVE or mark REJECTED
 */

export class PlayerIntelligenceBuilderV2 {
  private calculators: FeatureCalculator[] = [
    new TournamentCountCalculator(),
    new AverageFinishCalculator(),
    new CutPercentageCalculator(),
    new Top10PercentageCalculator(),
    new AverageDKPointsCalculator(),
    new AverageSalaryCalculator(),
    new SalaryValueCalculator(),
  ]

  private repository = getPlayerIntelligenceRepository()
  private dataLoader = getPlayerDataLoader()
  private validator = new BuildValidator()
  private policy = ActivationPolicy.getDefaultProductionPolicy()

  async buildForPlayer(playerId: string): Promise<BuildResult> {
    const calculatedAt = new Date()
    const warnings: string[] = []
    const calculatorFailures: Array<{ calculatorName: string; error: string }> = []
    const features: CalculatedFeature[] = []

    try {
      console.log(`[v0] Building Player Intelligence (v2) for ${playerId}`)

      // STEP 1: Load player via data loader
      const player = await this.dataLoader.getPlayerById(playerId)
      if (!player) {
        return {
          playerId,
          status: 'FAILED',
          featureCount: 0,
          completedFeatureCount: 0,
          dataCompleteness: 0,
          calculatedAt,
          warnings: [`Player not found: ${playerId}`],
          calculatorFailures: [],
        }
      }

      // STEP 2: Create CANDIDATE build with version snapshot
      const versionSnapshot = getCapturedVersionSnapshot(
        new Map(this.calculators.map((c) => [c.name, '1.0.0'])),
      )
      const build = await this.repository.createBuild(playerId, versionSnapshot)
      console.log(`[v0] Created CANDIDATE build ${build.id} for ${playerId}`)

      // STEP 3: Update to CALCULATING
      await this.repository.updateBuildStatus(build.id, 'CALCULATING')

      // STEP 4: Calculate all features
      for (const calculator of this.calculators) {
        try {
          const feature = await calculator.calculate(playerId)
          if (feature) {
            features.push(feature)
            console.log(`[v0] Calculated ${calculator.name}: confidence=${feature.confidence}`)
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`[v0] Error calculating ${calculator.name}:`, errorMsg)
          calculatorFailures.push({
            calculatorName: calculator.name,
            error: errorMsg.substring(0, 200),
          })
        }
      }

      // STEP 5: Validate all numerics
      const validationErrors = this.validator.validateBuild(
        features,
        100,
        features.length,
        features.filter((f) => f.featureValue !== null || f.featureValueStr !== null).length,
      )

      if (this.validator.hasBlockingErrors(validationErrors)) {
        const errorSummary = validationErrors.map((e) => `${e.field}: ${e.issue}`).join('; ')
        console.error(`[v0] Validation errors: ${errorSummary}`)
        await this.repository.rejectBuild(build.id, `Validation failed: ${errorSummary.substring(0, 200)}`)
        return {
          playerId,
          status: 'FAILED',
          featureCount: features.length,
          completedFeatureCount: 0,
          dataCompleteness: 0,
          calculatedAt,
          warnings: [`Validation errors: ${errorSummary}`],
          calculatorFailures,
        }
      }

      // STEP 6: Add features to build
      await this.repository.addFeaturesToBuild(build.id, features)
      console.log(`[v0] Added ${features.length} features to build ${build.id}`)

      // STEP 7: Calculate completeness
      const completedFeatures = features.filter(
        (f) => f.featureValue !== null || f.featureValueStr !== null
      ).length
      const dataCompleteness =
        features.length === 0 ? 0 : Math.floor((completedFeatures / features.length) * 100)

      // STEP 8: Determine build status
      let buildStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS'
      if (calculatorFailures.length > 0) {
        buildStatus = features.length > 0 ? 'PARTIAL' : 'FAILED'
      }
      if (features.length === 0) {
        buildStatus = 'FAILED'
      }

      // STEP 9: Update build status
      await this.repository.updateBuildStatus(build.id, buildStatus)

      // STEP 10: Evaluate activation policy
      const featureNames = features.map((f) => f.featureName)
      const featureValues = new Map(
        features.map((f) => [
          f.featureName,
          { value: f.featureValue !== null ? f.featureValue : f.featureValueStr },
        ]),
      )

      const buildResult: BuildResult = {
        playerId,
        status: buildStatus,
        featureCount: features.length,
        completedFeatureCount: completedFeatures,
        dataCompleteness,
        calculatedAt,
        warnings,
        calculatorFailures,
      }

      const evaluation = this.policy.evaluate(buildResult, featureNames, featureValues)

      if (evaluation.eligible) {
        // STEP 11: Atomically promote to ACTIVE
        try {
          const currentActive = await this.repository.getActiveBuild(playerId)
          const promotion = await this.repository.promoteBuildToActive(
            build.id,
            playerId,
            currentActive?.id || null,
            `Automatic promotion: ${buildStatus}`,
          )
          console.log(`[v0] Promoted build ${build.id} to ACTIVE (superseded ${promotion.previousBuild?.id || 'none'})`)
        } catch (error) {
          if (error instanceof Error && error.message.includes('CONCURRENCY_CONFLICT')) {
            console.warn(`[v0] Concurrency conflict during promotion (another build was activated first)`)
            warnings.push('Build calculation succeeded but was superseded by concurrent build')
          } else {
            throw error
          }
        }
      } else {
        // STEP 12: Reject build if ineligible
        await this.repository.rejectBuild(
          build.id,
          `Policy rejection: ${evaluation.reasons.join('; ')}`,
        )
        console.log(`[v0] Rejected build ${build.id}: ${evaluation.reasons.join('; ')}`)
        warnings.push(`Build rejected by activation policy: ${evaluation.reasons.join('; ')}`)
      }

      // Add warnings if any
      if (evaluation.warnings.length > 0) {
        warnings.push(...evaluation.warnings)
      }

      return buildResult
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[v0] Error building Player Intelligence for ${playerId}:`, errorMsg)

      return {
        playerId,
        status: 'FAILED',
        featureCount: features.length,
        completedFeatureCount: 0,
        dataCompleteness: 0,
        calculatedAt,
        warnings: [errorMsg.substring(0, 200)],
        calculatorFailures,
      }
    }
  }
}

export async function buildPlayerIntelligenceV2(playerId: string): Promise<BuildResult> {
  const builder = new PlayerIntelligenceBuilderV2()
  return builder.buildForPlayer(playerId)
}
