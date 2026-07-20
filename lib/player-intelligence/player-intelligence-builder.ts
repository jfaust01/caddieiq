import { prisma } from '@/lib/prisma'
import type { CalculatedFeature, FeatureCalculator } from './types'
import {
  TournamentCountCalculator,
  AverageFinishCalculator,
  CutPercentageCalculator,
  Top10PercentageCalculator,
  AverageDKPointsCalculator,
  AverageSalaryCalculator,
  SalaryValueCalculator,
} from './calculators'

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

  async buildForPlayer(playerId: string): Promise<void> {
    try {
      console.log(`[v0] Building Player Intelligence for ${playerId}`)

      // Verify player exists
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
            console.log(`[v0] Calculated ${calculator.name}`)
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

      // Upsert PlayerIntelligence record
      const intelligence = await prisma.playerIntelligence.upsert({
        where: { playerId },
        create: {
          playerId,
          dataCompleteness,
        },
        update: {
          dataCompleteness,
          calculatedAt: new Date(),
        },
      })

      // Upsert all features
      for (const feature of features) {
        await prisma.playerIntelligenceFeature.upsert({
          where: {
            playerIntelligenceId_featureName: {
              playerIntelligenceId: intelligence.id,
              featureName: feature.featureName,
            },
          },
          create: {
            playerIntelligenceId: intelligence.id,
            featureName: feature.featureName,
            featureCategory: feature.featureCategory,
            featureValue: feature.featureValue,
            featureValueStr: feature.featureValueStr,
            confidence: feature.confidence,
            source: feature.source,
            explanation: feature.explanation,
          },
          update: {
            featureValue: feature.featureValue,
            featureValueStr: feature.featureValueStr,
            confidence: feature.confidence,
            source: feature.source,
            explanation: feature.explanation,
            lastCalculated: new Date(),
          },
        })
      }

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
