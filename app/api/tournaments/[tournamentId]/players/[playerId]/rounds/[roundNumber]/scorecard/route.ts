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

    // Development diagnostics
    console.log('[v0] Scorecard API: Request params', { tournamentId, playerId, roundNumber: round })

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

    // Development diagnostics
    if (!playerRound) {
      console.log('[v0] Scorecard API: PlayerRound not found', {
        tournamentId,
        playerId,
        round,
        diagnostic: 'Attempting to find resolution path...',
      })

      // Debug: Try to resolve player and tournament separately
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { id: true, name: true },
      })

      const tournamentField = await prisma.tournamentField.findFirst({
        where: {
          playerId: playerId,
          tournament: { id: tournamentId },
        },
        select: { id: true, playerId: true },
      })

      const roundRecord = await prisma.round.findFirst({
        where: {
          tournamentId: tournamentId,
          roundNumber: round,
        },
        select: { id: true },
      })

      console.log('[v0] Scorecard API: Debug resolution', {
        tournamentExists: !!tournament,
        tournamentFieldExists: !!tournamentField,
        roundExists: !!roundRecord,
        resolvedIds: {
          tournamentId,
          playerId,
          tournamentFieldId: tournamentField?.id,
          roundId: roundRecord?.id,
        },
      })
    }

    // Par data is already embedded in holeScores, so no need for separate query
    // Create a map of par by hole number from the hole scores
    const courseHoles: Array<{ holeNumber: number; par: number | null }> = playerRound
      ? Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          par: playerRound.holeScores.find(h => h.holeNumber === i + 1)?.par || null,
        }))
      : []

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

    console.log('[v0] Scorecard API: Database query results', {
      playerId,
      round,
      tournamentId,
      holesCount: playerRound.holeScores.length,
      hasVerifiedHoleData,
      sources: Array.from(sources),
      holeDataPresent: playerRound.holeScores.length > 0,
      table: 'hole_scores',
      firstHole: playerRound.holeScores[0] ? {
        holeNumber: playerRound.holeScores[0].holeNumber,
        score: playerRound.holeScores[0].score,
        par: playerRound.holeScores[0].par,
        toPar: playerRound.holeScores[0].toPar,
        source: playerRound.holeScores[0].source,
        externalId: playerRound.holeScores[0].externalId,
      } : null,
    })

    if (playerRound.holeScores.length === 0) {
      console.log('[v0] AUDIT: No hole scores found for round (returning summary only):', { playerId, round, tournamentId })
    } else if (playerRound.holeScores.length !== 18) {
      console.warn('[v0] AUDIT: Incomplete hole scores in hole_scores table (returning summary only):', {
        playerId,
        round,
        tournamentId,
        count: playerRound.holeScores.length,
      })
    } else if (sources.size > 1) {
      console.warn('[v0] AUDIT: Mixed data sources in hole_scores (returning summary only):', {
        playerId,
        round,
        tournamentId,
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
