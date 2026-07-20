import { prisma } from '@/lib/prisma'
import type { CalculatedFeature } from '@/lib/player-intelligence/types'

export interface PlayerIntelligenceRepository {
  findByPlayerId(playerId: string): Promise<any>
  getFeature(playerId: string, featureName: string): Promise<any | null>
  getFeatures(playerId: string, category?: string): Promise<any[]>
  upsert(
    playerId: string,
    dataCompleteness: number,
    features: CalculatedFeature[],
  ): Promise<any>
}

export class PrismaPlayerIntelligenceRepository implements PlayerIntelligenceRepository {
  async findByPlayerId(playerId: string) {
    return await prisma.playerIntelligence.findUnique({
      where: { playerId },
      include: {
        features: {
          orderBy: { featureCategory: 'asc' },
        },
      },
    })
  }

  async getFeature(playerId: string, featureName: string) {
    const intelligence = await prisma.playerIntelligence.findUnique({
      where: { playerId },
    })

    if (!intelligence) {
      return null
    }

    return await prisma.playerIntelligenceFeature.findUnique({
      where: {
        playerIntelligenceId_featureName: {
          playerIntelligenceId: intelligence.id,
          featureName,
        },
      },
    })
  }

  async getFeatures(playerId: string, category?: string) {
    const intelligence = await prisma.playerIntelligence.findUnique({
      where: { playerId },
    })

    if (!intelligence) {
      return []
    }

    return await prisma.playerIntelligenceFeature.findMany({
      where: {
        playerIntelligenceId: intelligence.id,
        ...(category && { featureCategory: category }),
      },
      orderBy: { featureName: 'asc' },
    })
  }

  async upsert(
    playerId: string,
    dataCompleteness: number,
    features: CalculatedFeature[],
  ) {
    // Create or update PlayerIntelligence record
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

    return intelligence
  }
}

export function getPlayerIntelligenceRepository(): PlayerIntelligenceRepository {
  return new PrismaPlayerIntelligenceRepository()
}
