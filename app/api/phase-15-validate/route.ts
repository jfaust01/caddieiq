import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildPlayerIntelligence } from '@/lib/player-intelligence/player-intelligence-builder'

/**
 * AUTHORIZATION REQUIRED: This endpoint must only be accessible to admins
 * 
 * Validates:
 * - Bearer token present and valid
 * - Admin authorization
 * - Does not expose stack traces
 * - Does not expose configuration
 * - Returns only safe error messages
 */
function validateAdminAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  // In production, verify token against admin user database or auth service
  // For now, check against environment variable
  const validToken = process.env.ADMIN_API_TOKEN
  if (!validToken) {
    console.error('[v0] ADMIN_API_TOKEN not configured')
    return false
  }

  const token = authHeader.substring(7)
  return token === validToken
}

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] ===== PHASE 15: PLAYER INTELLIGENCE VALIDATION =====' )
    
    // SECURITY: Require admin authorization
    if (!validateAdminAuthorization(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid admin token required' },
        { status: 401 }
      )
    }

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
    const buildResult = await buildPlayerIntelligence(testPlayer.id)
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
      buildResult,
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
    // SECURITY: Do not expose stack traces or configuration in response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      status: 'ERROR',
      error: errorMessage.substring(0, 200), // Truncate to prevent exposure
      // NOTE: Stack trace intentionally omitted for security
    }, { status: 500 })
  }
}
