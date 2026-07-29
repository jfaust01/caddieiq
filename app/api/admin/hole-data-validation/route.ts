import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Admin endpoint for validating that hole score data flows correctly through the system:
 * 1. Imported from SportsDataIO → hole_scores table
 * 2. Queried via scorecard API
 * 3. Rendered in RoundDNA visualization components
 * 
 * Shows real holes vs. placeholder holes for dev/debugging
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    const playerId = searchParams.get('playerId')
    const round = searchParams.get('round')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId required' },
        { status: 400 }
      )
    }

    // Get tournament info
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        externalId: true,
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Count data by category
    const results = {
      tournament,
      validation: {
        // Database state
        roundsCount: await prisma.round.count({
          where: { tournamentId },
        }),

        playerRoundsCount: await prisma.playerRound.count({
          where: {
            round: {
              tournamentId,
            },
          },
        }),

        holeScoresCount: await prisma.holeScore.count({
          where: {
            playerRound: {
              round: {
                tournamentId,
              },
            },
          },
        }),

        // Source tracking
        sportsdataioHoles: await prisma.holeScore.count({
          where: {
            source: 'sportsdataio',
            playerRound: {
              round: {
                tournamentId,
              },
            },
          },
        }),

        // Per-player stats
        playersWithHoles: await prisma.playerRound.groupBy({
          by: ['playerId'],
          where: {
            round: {
              tournamentId,
            },
          },
          _count: true,
        }).then(groups => groups.length),
      },
    }

    // If specific player/round requested, show detailed hole data
    if (playerId && round) {
      const roundNum = parseInt(round)

      // Get round ID
      const roundRecord = await prisma.round.findFirst({
        where: {
          tournamentId,
          roundNumber: roundNum,
        },
        select: { id: true },
      })

      if (!roundRecord) {
        return NextResponse.json({
          ...results,
          detailedHoles: null,
          message: `Round ${roundNum} not found`,
        })
      }

      // Get player round
      const playerRound = await prisma.playerRound.findFirst({
        where: {
          playerId,
          roundId: roundRecord.id,
        },
        select: { id: true },
      })

      if (!playerRound) {
        return NextResponse.json({
          ...results,
          detailedHoles: null,
          message: `Player ${playerId} not found in Round ${roundNum}`,
        })
      }

      // Get all holes for this player-round
      const holes = await prisma.holeScore.findMany({
        where: {
          playerRoundId: playerRound.id,
        },
        orderBy: { holeNumber: 'asc' },
        select: {
          id: true,
          holeNumber: true,
          score: true,
          par: true,
          toPar: true,
          dkPoints: true,
          source: true,
          externalId: true,
          importedAt: true,
        },
      })

      // Verify holes are real (not placeholder)
      const realHoles = holes.filter(h => h.source === 'sportsdataio')
      const verifyStatus = realHoles.length === 18 ? 'VERIFIED' : 'PARTIAL'

      results.detailedHoles = {
        playerRound: {
          playerId,
          roundNumber: roundNum,
          holeCount: holes.length,
          realHoles: realHoles.length,
          verifyStatus,
        },
        holes: holes.map(h => ({
          hole: h.holeNumber,
          score: h.score,
          par: h.par,
          toPar: h.toPar,
          dkPoints: h.dkPoints,
          source: h.source,
          imported: h.importedAt ? new Date(h.importedAt).toISOString() : null,
        })),
        summary: {
          totalHoles: holes.length,
          totalScore: holes.reduce((sum, h) => sum + (h.score || 0), 0),
          totalToPar: holes.reduce((sum, h) => sum + (h.toPar || 0), 0),
          totalDkPoints: holes.reduce((sum, h) => sum + (h.dkPoints || 0), 0),
        },
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[v0] Hole data validation error:', error)
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    )
  }
}
