import { prisma } from '@/lib/prisma'
import type { CalculatedFeature, BuildStatus, ActivationStatus, PlayerIntelligenceBuildRecord } from '@/lib/player-intelligence/types'
import type { VersionSnapshot } from '@/lib/player-intelligence/version-registry'

export interface PlayerIntelligenceRepository {
  findByPlayerId(playerId: string): Promise<any>
  getFeature(playerId: string, featureName: string): Promise<any | null>
  getFeatures(playerId: string, category?: string): Promise<any[]>
  upsert(
    playerId: string,
    dataCompleteness: number,
    features: CalculatedFeature[],
  ): Promise<any>
  
  // New versioned build methods
  createBuild(playerId: string, versionSnapshot: VersionSnapshot): Promise<PlayerIntelligenceBuildRecord>
  updateBuildStatus(buildId: string, buildStatus: BuildStatus): Promise<PlayerIntelligenceBuildRecord>
  addFeaturesToBuild(buildId: string, features: CalculatedFeature[]): Promise<number>
  getActiveBuild(playerId: string): Promise<PlayerIntelligenceBuildRecord | null>
  promoteBuildToActive(buildId: string, playerId: string, previousActiveId: string | null, reason: string): Promise<{ build: PlayerIntelligenceBuildRecord; previousBuild: PlayerIntelligenceBuildRecord | null }>
  rejectBuild(buildId: string, reason: string): Promise<PlayerIntelligenceBuildRecord>
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

  // NEW VERSIONED BUILD METHODS
  
  async createBuild(playerId: string, versionSnapshot: VersionSnapshot): Promise<PlayerIntelligenceBuildRecord> {
    return await prisma.playerIntelligenceBuild.create({
      data: {
        playerId,
        buildStatus: 'PENDING',
        activationStatus: 'CANDIDATE',
        dataCompleteness: 0,
        featureCount: 0,
        completedFeatureCount: 0,
        builderVersion: versionSnapshot.builderVersion,
        featureSchemaVersion: versionSnapshot.featureSchemaVersion,
        confidencePolicyVersion: versionSnapshot.confidencePolicyVersion,
        activationPolicyVersion: versionSnapshot.activationPolicyVersion,
      },
    })
  }

  async updateBuildStatus(buildId: string, buildStatus: BuildStatus): Promise<PlayerIntelligenceBuildRecord> {
    return await prisma.playerIntelligenceBuild.update({
      where: { id: buildId },
      data: { buildStatus },
    })
  }

  async addFeaturesToBuild(buildId: string, features: CalculatedFeature[]): Promise<number> {
    for (const feature of features) {
      await prisma.playerIntelligenceFeature.create({
        data: {
          playerIntelligenceBuildId: buildId,
          featureName: feature.featureName,
          featureCategory: feature.featureCategory,
          featureValue: feature.featureValue,
          featureValueStr: feature.featureValueStr,
          confidence: feature.confidence,
          source: feature.source,
          explanation: feature.explanation,
        },
      })
    }
    return features.length
  }

  async getActiveBuild(playerId: string): Promise<PlayerIntelligenceBuildRecord | null> {
    return await prisma.playerIntelligenceBuild.findFirst({
      where: {
        playerId,
        activationStatus: 'ACTIVE',
      },
      orderBy: { activatedAt: 'desc' },
    })
  }

  async promoteBuildToActive(
    buildId: string,
    playerId: string,
    previousActiveId: string | null,
    reason: string,
  ): Promise<{ build: PlayerIntelligenceBuildRecord; previousBuild: PlayerIntelligenceBuildRecord | null }> {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify build still exists and is CANDIDATE
      const build = await tx.playerIntelligenceBuild.findUnique({
        where: { id: buildId },
      })

      if (!build || build.activationStatus !== 'CANDIDATE') {
        throw new Error(`Build ${buildId} not found or not CANDIDATE`)
      }

      // 2. Verify previousActiveId matches current active (optimistic locking)
      const currentActive = await tx.playerIntelligenceBuild.findFirst({
        where: {
          playerId,
          activationStatus: 'ACTIVE',
        },
      })

      if (currentActive?.id !== previousActiveId) {
        throw new Error('CONCURRENCY_CONFLICT: Active build changed since read')
      }

      // 3. Mark previous ACTIVE as SUPERSEDED
      if (currentActive) {
        await tx.playerIntelligenceBuild.update({
          where: { id: currentActive.id },
          data: { activationStatus: 'SUPERSEDED' },
        })
      }

      // 4. Promote new build to ACTIVE
      const promotedBuild = await tx.playerIntelligenceBuild.update({
        where: { id: buildId },
        data: {
          activationStatus: 'ACTIVE',
          activationReason: reason,
          activatedAt: new Date(),
        },
      })

      // 5. Update Player.activePlayerIntelligenceBuildId atomically
      await tx.player.update({
        where: { id: playerId },
        data: { activePlayerIntelligenceBuildId: buildId },
      })

      return {
        build: promotedBuild,
        previousBuild: currentActive || null,
      }
    })
  }

  async rejectBuild(buildId: string, reason: string): Promise<PlayerIntelligenceBuildRecord> {
    return await prisma.playerIntelligenceBuild.update({
      where: { id: buildId },
      data: {
        activationStatus: 'REJECTED',
        rejectionReason: reason,
      },
    })
  }
}

export function getPlayerIntelligenceRepository(): PlayerIntelligenceRepository {
  return new PrismaPlayerIntelligenceRepository()
}
