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
  ): Promise<{ intelligence: any; featureCount: number }> {
    // ATOMIC TRANSACTION: All operations succeed or all rollback
    return await prisma.$transaction(async (tx) => {
      // 1. Upsert PlayerIntelligence record
      const intelligence = await tx.playerIntelligence.upsert({
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

      // 2. Get names of features being persisted (for stale cleanup)
      const newFeatureNames = features.map((f) => f.featureName)

      // 3. Delete stale features: those not in the new set
      // This prevents orphaned features from previous builds
      if (newFeatureNames.length > 0) {
        await tx.playerIntelligenceFeature.deleteMany({
          where: {
            playerIntelligenceId: intelligence.id,
            featureName: {
              notIn: newFeatureNames,
            },
          },
        })
      } else {
        // If no features, delete ALL features for this intelligence
        await tx.playerIntelligenceFeature.deleteMany({
          where: {
            playerIntelligenceId: intelligence.id,
          },
        })
      }

      // 4. Upsert all new features (inside same transaction)
      for (const feature of features) {
        await tx.playerIntelligenceFeature.upsert({
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

      return {
        intelligence,
        featureCount: features.length,
      }
    })
  }
}

export function getPlayerIntelligenceRepository(): PlayerIntelligenceRepository {
  return new PrismaPlayerIntelligenceRepository()
}
