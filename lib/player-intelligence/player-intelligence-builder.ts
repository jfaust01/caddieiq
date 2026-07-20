import type { CalculatedFeature, BuildResult, FeatureCalculator } from './types'
import { getPlayerIntelligenceRepository } from '@/lib/repositories/player-intelligence-repository'
import { getPlayerDataLoader } from './data-loader'
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
 * PlayerIntelligenceBuilder orchestrates the feature calculation pipeline.
 * 
 * Responsibilities:
 * - Load player data via PlayerDataLoader
 * - Execute all feature calculators
 * - Compute data completeness
 * - Return structured BuildResult
 * - Hand results to repository for atomic persistence
 * 
 * Does NOT directly call Prisma. All persistence handled by repository.
 * All failures tracked and returned in BuildResult.
 */
export class PlayerIntelligenceBuilder {
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

  async buildForPlayer(playerId: string): Promise<BuildResult> {
    const calculatedAt = new Date()
    const warnings: string[] = []
    const calculatorFailures: Array<{ calculatorName: string; error: string }> = []
    const features: CalculatedFeature[] = []

    try {
      console.log(`[v0] Building Player Intelligence for ${playerId}`)

      // 1. Load player via data loader (NOT direct Prisma)
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

      // 2. Calculate all features, tracking failures
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
            error: errorMsg.substring(0, 200), // Truncate to prevent exposure
          })
        }
      }

      // 3. Calculate data completeness
      // EDGE CASE: Prevent division by zero when no features calculated
      const completedFeatures = features.filter(
        (f) => f.featureValue !== null || f.featureValueStr !== null
      ).length
      
      const dataCompleteness =
        features.length === 0 ? 0 : Math.floor((completedFeatures / features.length) * 100)

      console.log(`[v0] Calculated ${completedFeatures} / ${features.length} features`)
      console.log(`[v0] Data completeness: ${dataCompleteness}%`)

      // 4. Determine status
      let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS'
      if (calculatorFailures.length > 0) {
        status = features.length > 0 ? 'PARTIAL' : 'FAILED'
      }
      if (features.length === 0) {
        status = 'FAILED'
        warnings.push('No features were successfully calculated')
      }

      // 5. Persist atomically via repository
      // If any feature write fails, entire transaction rolls back
      const persistResult = await this.repository.upsert(playerId, dataCompleteness, features)

      console.log(`[v0] Player Intelligence built successfully for ${playerId}`)

      return {
        playerId,
        status,
        featureCount: features.length,
        completedFeatureCount: completedFeatures,
        dataCompleteness,
        calculatedAt,
        warnings,
        calculatorFailures,
      }
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

  async buildForPlayers(playerIds: string[]): Promise<BuildResult[]> {
    console.log(`[v0] Building Player Intelligence for ${playerIds.length} players`)

    const results: BuildResult[] = []
    for (const playerId of playerIds) {
      const result = await this.buildForPlayer(playerId)
      results.push(result)
    }

    console.log(`[v0] Completed batch build for ${playerIds.length} players`)
    return results
  }

  async buildForActivePlayersInTournament(tournamentId: string): Promise<BuildResult[]> {
    const playerIds = await this.dataLoader.getPlayersInTournament(tournamentId)
    console.log(`[v0] Found ${playerIds.length} players in tournament ${tournamentId}`)

    return await this.buildForPlayers(playerIds)
  }
}

export async function buildPlayerIntelligence(playerId: string): Promise<BuildResult> {
  const builder = new PlayerIntelligenceBuilder()
  return builder.buildForPlayer(playerId)
}

export async function buildPlayerIntelligenceBatch(playerIds: string[]): Promise<BuildResult[]> {
  const builder = new PlayerIntelligenceBuilder()
  return builder.buildForPlayers(playerIds)
}

export async function buildForTournament(tournamentId: string): Promise<BuildResult[]> {
  const builder = new PlayerIntelligenceBuilder()
  return builder.buildForActivePlayersInTournament(tournamentId)
}
