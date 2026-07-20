import { prisma } from '@/lib/prisma'
import type { CalculatedFeature, FeatureCalculator } from './types'
import { getPlayerIntelligenceRepository } from '@/lib/repositories/player-intelligence-repository'
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
 * - Load player data
 * - Execute all feature calculators
 * - Compute data completeness
 * - Hand results to repository for persistence
 * 
 * NOTE: Builder DOES NOT perform any Prisma operations.
 * All persistence is handled by repository.
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

  async buildForPlayer(playerId: string): Promise<void> {
    try {
      console.log(`[v0] Building Player Intelligence for ${playerId}`)

      // Verify player exists (this is the only Prisma call in builder)
      const player = await prisma.player.findUnique({
        where: { id: playerId },
      })

      if (!player) {
        throw new Error(`Player not found: ${playerId}`)
      }

      // Calculate all features
      const features: CalculatedFeature[] = []
      for (const calculator of this.calculators) {
        try {
          const feature = await calculator.calculate(playerId)
          if (feature) {
            features.push(feature)
            console.log(`[v0] Calculated ${calculator.name}: confidence=${feature.confidence}`)
          }
        } catch (error) {
          console.error(`[v0] Error calculating ${calculator.name}:`, error)
        }
      }

      // Calculate data completeness (percentage of features with values)
      const completedFeatures = features.filter((f) => f.featureValue !== null || f.featureValueStr !== null).length
      const dataCompleteness = Math.floor((completedFeatures / features.length) * 100)

      console.log(`[v0] Calculated ${completedFeatures} / ${features.length} features`)
      console.log(`[v0] Data completeness: ${dataCompleteness}%`)

      // Delegate all persistence to repository
      await this.repository.upsert(playerId, dataCompleteness, features)

      console.log(`[v0] Player Intelligence built successfully for ${playerId}`)
    } catch (error) {
      console.error(`[v0] Error building Player Intelligence for ${playerId}:`, error)
      throw error
    }
  }

  async buildForPlayers(playerIds: string[]): Promise<void> {
    console.log(`[v0] Building Player Intelligence for ${playerIds.length} players`)

    for (const playerId of playerIds) {
      try {
        await this.buildForPlayer(playerId)
      } catch (error) {
        console.error(`[v0] Failed to build intelligence for ${playerId}:`, error)
      }
    }

    console.log(`[v0] Completed batch build for ${playerIds.length} players`)
  }

  async buildForActivePlayersInTournament(tournamentId: string): Promise<void> {
    const players = await prisma.tournamentField.findMany({
      where: { tournament: { id: tournamentId } },
      distinct: ['playerId'],
      select: { playerId: true },
    })

    const playerIds = players.map((p) => p.playerId)
    console.log(`[v0] Found ${playerIds.length} players in tournament ${tournamentId}`)

    await this.buildForPlayers(playerIds)
  }
}

export async function buildPlayerIntelligence(playerId: string): Promise<void> {
  const builder = new PlayerIntelligenceBuilder()
  await builder.buildForPlayer(playerId)
}

export async function buildPlayerIntelligenceBatch(playerIds: string[]): Promise<void> {
  const builder = new PlayerIntelligenceBuilder()
  await builder.buildForPlayers(playerIds)
}
