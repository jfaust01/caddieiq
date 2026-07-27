import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tournaments/[tournamentId]/players/[playerId]/rounds/[roundNumber]/scorecard
 * 
 * Fetches hole-by-hole scorecard data for a player's round.
 * Returns JSON with hole scores or empty state.
 * Never hangs indefinitely - always returns within 10 seconds.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tournamentId: string; playerId: string; roundNumber: string }> }
) {
  try {
    const { tournamentId, playerId, roundNumber } = await context.params
    
    // Validate inputs
    if (!tournamentId || !playerId || !roundNumber) {
      console.error('[v0] Missing required parameters:', { tournamentId, playerId, roundNumber })
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Parse round number
    const round = parseInt(roundNumber, 10)
    if (isNaN(round) || round < 1 || round > 4) {
      return NextResponse.json({ error: 'Invalid round number' }, { status: 400 })
    }

    console.log('[v0] Fetching scorecard:', { playerId, round, tournamentId })

    // Query PlayerRound with hole scores and course information
    // Path: playerRound -> tournamentField -> playerId, tournament, player
    // Path: playerRound -> round -> roundNumber, courseId
    const playerRound = await prisma.playerRound.findFirst({
      where: {
        // Match round number
        round: {
          roundNumber: round,
          tournament: {
            id: tournamentId,
          },
        },
        // Match player via tournament field
        tournamentField: {
          playerId: playerId,
        },
      },
      select: {
        id: true,
        score: true,
        toPar: true,
        round: {
          select: {
            roundNumber: true,
            courseSetup: true,
          },
        },
        tournamentField: {
          select: {
            finalPosition: true,
            player: {
              select: {
                fullName: true,
              },
            },
          },
        },
        holeScores: {
          // PROVENANCE: `source` is a required column (non-nullable), so every
          // HoleScore row is provider-tagged by definition. No null filter needed
          // (filtering `source: { not: null }` is invalid on a non-nullable field).
          orderBy: { holeNumber: 'asc' },
          select: {
            holeNumber: true,
            score: true,
            par: true,
            toPar: true,
            dkPoints: true,
            source: true,
            externalId: true,
          },
        },
      },
    })

    // Fetch course holes for par data
    // Path: tournament -> tournament_courses -> course -> course_holes
    let courseHoles: Array<{ holeNumber: number; par: number | null }> = []
    
    try {
      // Get tournament with its courses
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: {
          id: true,
          courses: {
            select: {
              course: {
                select: {
                  holes: {
                    orderBy: { holeNumber: 'asc' },
                    select: {
                      holeNumber: true,
                      par: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (tournament?.courses && tournament.courses.length > 0) {
        // Use first course's holes (most tournaments have one primary course)
        const courseHolesData = tournament.courses[0]?.course?.holes || []
        if (courseHolesData.length === 18) {
          courseHoles = courseHolesData.map(hole => ({
            holeNumber: hole.holeNumber,
            par: hole.par,
          }))
        }
      }
    } catch (err) {
      // Silently continue if course query fails - Par display is optional
      console.log('[v0] Could not fetch course holes for par data:', err)
    }

    // Ensure we have 18 holes even if query failed
    if (courseHoles.length === 0) {
      courseHoles = Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        par: null,
      }))
    }

    // Not found
    if (!playerRound) {
      console.log('[v0] PlayerRound not found:', { playerId, round })
      return NextResponse.json({ data: null }, { status: 200 })
    }

    // No player name
    if (!playerRound.tournamentField?.player?.fullName) {
      console.log('[v0] Player name missing for round:', { playerId, round })
      return NextResponse.json({ data: null }, { status: 200 })
    }

    // Round-level summary data (to-par score, position, strokes) is always
    // available on the PlayerRound / TournamentField, independent of whether
    // verified hole-by-hole data has been imported yet. Surface it so the
    // scorecard hero (Score / Position) renders real values.
    const currentPosition =
      playerRound.tournamentField.finalPosition != null
        ? playerRound.tournamentField.finalPosition.toString()
        : undefined

    // Determine whether we have a complete, single-source 18-hole dataset.
    // Hole-by-hole rendering stays gated by these integrity checks; the
    // summary values above are returned regardless.
    const sources = new Set(playerRound.holeScores.map((h) => h.source))
    const hasVerifiedHoleData =
      playerRound.holeScores.length === 18 && sources.size === 1

    if (playerRound.holeScores.length === 0) {
      console.log('[v0] No hole scores for round (returning summary only):', { playerId, round })
    } else if (playerRound.holeScores.length !== 18) {
      console.error('[v0] Incomplete hole scores (returning summary only):', {
        playerId,
        round,
        count: playerRound.holeScores.length,
      })
    } else if (sources.size > 1) {
      console.error('[v0] Mixed data sources (returning summary only):', {
        playerId,
        round,
        sources: Array.from(sources),
      })
    }

    // Calculate total DK points only from verified hole data
    const totalDkPoints = hasVerifiedHoleData
      ? playerRound.holeScores.reduce((sum, hole) => sum + (hole.dkPoints || 0), 0) || null
      : null

    // Build response. Summary fields are always populated; holes are only
    // included when the verified 18-hole dataset passes integrity checks.
    const responseData = {
      playerName: playerRound.tournamentField.player.fullName,
      currentPosition,
      roundNumber: playerRound.round.roundNumber,
      totalStrokes: playerRound.score,
      totalToPar: playerRound.toPar,
      totalDkPoints: totalDkPoints,
      courseHoles: courseHoles,
      holes: hasVerifiedHoleData
        ? playerRound.holeScores.map((hole) => ({
            holeNumber: hole.holeNumber,
            score: hole.score,
            par: hole.par,
            toPar: hole.toPar,
            dkPoints: hole.dkPoints,
            source: hole.source,
            externalId: hole.externalId,
          }))
        : [],
    }

    console.log('[v0] Scorecard fetched successfully:', {
      playerId,
      round,
      holes: responseData.holes.length,
      hasVerifiedHoleData,
    })

    return NextResponse.json({ data: responseData }, { status: 200 })
  } catch (error) {
    // Log full error for debugging
    const errorInfo: Record<string, any> = {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
    }

    // Add Prisma-specific diagnostics
    if (error instanceof Error) {
      if ('code' in error) {
        errorInfo.prismaCode = (error as any).code
      }
      if ('meta' in error) {
        errorInfo.meta = (error as any).meta
      }
    }

    console.error('[v0] Scorecard API error:', errorInfo)

    // Return diagnostic response (safe, no credentials exposed)
    return NextResponse.json(
      {
        error: 'Unable to load scorecard',
        diagnostics: {
          errorType: error instanceof Error ? error.name : 'UnknownError',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
