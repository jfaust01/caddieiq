import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildPlayerIntelligence } from '@/lib/player-intelligence/player-intelligence-builder'

export async function GET() {
  try {
    console.log('[v0] ===== PHASE 15: PLAYER INTELLIGENCE VALIDATION =====')

    // Find an active player with tournament history for testing
    console.log('[v0] Finding test player with tournament history...')
    const testPlayer = await prisma.player.findFirst({
      where: {
        tournamentFields: {
          some: {
            tournament: {
              startDate: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
              },
            },
          },
        },
      },
      include: {
        tournamentFields: {
          take: 5,
          orderBy: {
            tournament: {
              startDate: 'desc',
            },
          },
        },
      },
    })

    if (!testPlayer) {
      return NextResponse.json({
        status: 'SKIPPED',
        message: 'No test player with recent tournament history found in database',
        recommendation: 'Run GolfCourseAPI importer first to populate player data',
      })
    }

    console.log(`[v0] Found test player: ${testPlayer.fullName} (${testPlayer.id})`)

    // Build player intelligence
    console.log(`[v0] Building player intelligence for ${testPlayer.fullName}...`)
    const startTime = Date.now()
    await buildPlayerIntelligence(testPlayer.id)
    const buildDuration = Date.now() - startTime

    // Retrieve built intelligence
    const intelligence = await prisma.playerIntelligence.findUnique({
      where: { playerId: testPlayer.id },
      include: {
        features: {
          orderBy: { featureCategory: 'asc' },
        },
      },
    })

    if (!intelligence) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'Failed to retrieve built intelligence',
      })
    }

    // Analyze features
    const featuresByCategory = intelligence.features.reduce(
      (acc, feature) => {
        if (!acc[feature.featureCategory]) {
          acc[feature.featureCategory] = []
        }
        acc[feature.featureCategory].push(feature)
        return acc
      },
      {} as Record<string, any[]>,
    )

    const completedFeatures = intelligence.features.filter((f) => f.featureValue !== null || f.featureValueStr !== null)
    const nullFeatures = intelligence.features.filter((f) => f.featureValue === null && f.featureValueStr === null)

    console.log(`[v0] Validation complete for ${testPlayer.fullName}`)

    return NextResponse.json({
      status: 'SUCCESS',
      phase: 'Phase 15 - Player Intelligence Foundation',
      buildDuration: `${buildDuration}ms`,
      testPlayer: {
        id: testPlayer.id,
        name: testPlayer.fullName,
        tournaments: testPlayer.tournamentFields.length,
      },
      intelligence: {
        dataCompleteness: intelligence.dataCompleteness,
        totalFeatures: intelligence.features.length,
        completedFeatures: completedFeatures.length,
        nullFeatures: nullFeatures.length,
        calculatedAt: intelligence.calculatedAt,
      },
      featuresByCategory: Object.fromEntries(
        Object.entries(featuresByCategory).map(([category, features]) => [
          category,
          {
            count: features.length,
            features: features.map((f) => ({
              name: f.featureName,
              value: f.featureValue ?? f.featureValueStr,
              confidence: f.confidence,
              source: f.source,
            })),
          },
        ]),
      ),
      sampleFeatures: completedFeatures.slice(0, 5).map((f) => ({
        name: f.featureName,
        category: f.featureCategory,
        value: f.featureValue ?? f.featureValueStr,
        confidence: f.confidence,
        explanation: f.explanation,
      })),
      productionReadiness: completedFeatures.length / intelligence.features.length > 0.7 ? 'READY' : 'NEEDS_DATA',
    })
  } catch (error) {
    console.error('[v0] Validation error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
    })
  }
}
