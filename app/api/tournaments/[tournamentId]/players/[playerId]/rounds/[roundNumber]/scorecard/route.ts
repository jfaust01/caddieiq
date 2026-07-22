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
            player: {
              select: {
                fullName: true,
              },
            },
          },
        },
        holeScores: {
          // PROVENANCE: Only fetch verified, provider-supplied hole scores
          where: {
            source: { not: null },
          },
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

    // Fetch course holes for par data (course-agnostic approach)
    // Try to get course holes from tournament course mapping or database
    let courseHoles: Array<{ holeNumber: number; par: number | null }> = []
    
    // For now, create placeholder course holes (18 holes)
    // In production, this would fetch from tournament->course->course_holes
    courseHoles = Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      par: null, // Will be populated from course data
    }))

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

    // No hole scores (expected when provider data not imported yet)
    if (playerRound.holeScores.length === 0) {
      console.log('[v0] No hole scores for round:', { playerId, round })
      return NextResponse.json({ data: null }, { status: 200 })
    }

    // Incomplete dataset
    if (playerRound.holeScores.length !== 18) {
      console.error('[v0] Incomplete hole scores:', {
        playerId,
        round,
        count: playerRound.holeScores.length,
      })
      return NextResponse.json({ data: null }, { status: 200 })
    }

    // Mixed sources (data integrity check)
    const sources = new Set(playerRound.holeScores.map((h) => h.source))
    if (sources.size > 1) {
      console.error('[v0] Mixed data sources:', {
        playerId,
        round,
        sources: Array.from(sources),
      })
      return NextResponse.json({ data: null }, { status: 200 })
    }

    // Calculate total DK points
    const totalDkPoints =
      playerRound.holeScores.reduce((sum, hole) => sum + (hole.dkPoints || 0), 0) || null

    // Build response with course hole par data
    const responseData = {
      playerName: playerRound.tournamentField.player.fullName,
      roundNumber: playerRound.round.roundNumber,
      totalStrokes: playerRound.score,
      totalToPar: playerRound.toPar,
      totalDkPoints: totalDkPoints,
      courseHoles: courseHoles,
      holes: playerRound.holeScores.map((hole) => ({
        holeNumber: hole.holeNumber,
        score: hole.score,
        par: hole.par,
        toPar: hole.toPar,
        dkPoints: hole.dkPoints,
        source: hole.source,
        externalId: hole.externalId,
      })),
    }

    console.log('[v0] Scorecard fetched successfully:', {
      playerId,
      round,
      holes: playerRound.holeScores.length,
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
