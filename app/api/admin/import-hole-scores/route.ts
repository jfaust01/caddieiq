/**
 * Admin Endpoint: POST /api/admin/import-hole-scores
 *
 * Triggers hole-score import for a tournament from SportsDataIO.
 * Backfills the `hole_scores` table with real provider data.
 *
 * Request:
 * {
 *   "tournamentId": "internal tournament ID"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "tournamentId": "...",
 *   "providerTournamentId": 123,
 *   "playersProcessed": 72,
 *   "roundsProcessed": 245,
 *   "holesInserted": 3890,
 *   "holesUpdated": 12,
 *   "playersUnmatched": [],
 *   "errors": []
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { importHoleScoresForTournament } from '@/lib/imports/sportsdataio-hole-score-importer'
import prismaClient from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { tournamentId } = await req.json()

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing tournamentId parameter' },
        { status: 400 },
      )
    }

    console.log(`[v0] Admin: Starting hole-score import for tournament ${tournamentId}`)

    const result = await importHoleScoresForTournament(tournamentId)

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('[v0] Admin hole-score import error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 },
    )
  }
}

/**
 * Admin Endpoint: GET /api/admin/import-hole-scores/status?tournamentId=XXX
 *
 * Check hole-score coverage for a tournament.
 *
 * Response:
 * {
 *   "tournamentId": "...",
 *   "coverage": {
 *     "complete": 72,    // Players with 18 holes × 4 rounds (72 holes)
 *     "partial": 5,       // Players with 1-71 holes
 *     "missing": 2,       // Players with 0 holes
 *     "total": 79
 *   }
 * }
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing tournamentId parameter' },
        { status: 400 },
      )
    }

    console.log(`[v0] Admin: Checking hole-score coverage for tournament ${tournamentId}`)

    const prisma = prismaClient

    // Get all players in the tournament field
    const players = await prisma.player.findMany({
      where: {
        tournamentFields: {
          some: {
            tournament: { id: tournamentId },
          },
        },
      },
      select: { id: true },
    })

    if (players.length === 0) {
      return NextResponse.json(
        {
          error: 'No players found in tournament',
        },
        { status: 404 },
      )
    }

    // Count holes per player
    const holeCountPerPlayer = await prisma.holeScore.groupBy({
      by: ['playerRoundId'],
      where: {
        playerRound: {
          round: {
            tournament: { id: tournamentId },
          },
        },
      },
      _count: {
        holeNumber: true,
      },
    })

    // Map to players
    const playerHoleCounts = await prisma.playerRound.findMany({
      where: {
        round: {
          tournament: { id: tournamentId },
        },
      },
      select: {
        id: true,
        playerId: true,
      },
    })

    const holeCountByPlayer = new Map<string, number>()
    for (const prh of playerHoleCounts) {
      const count = holeCountPerPlayer.find((h) => h.playerRoundId === prh.id)?._count.holeNumber || 0
      holeCountByPlayer.set(prh.playerId, (holeCountByPlayer.get(prh.playerId) || 0) + count)
    }

    // Categorize
    let complete = 0
    let partial = 0
    let missing = 0

    // For a 4-round tournament: complete = 72 holes (18 × 4)
    // Adjust based on actual tournament rounds
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        rounds: { select: { id: true } },
      },
    })
    const expectedHoles = (tournament?.rounds.length || 4) * 18

    for (const player of players) {
      const holeCount = holeCountByPlayer.get(player.id) || 0
      if (holeCount === expectedHoles) {
        complete++
      } else if (holeCount > 0) {
        partial++
      } else {
        missing++
      }
    }

    return NextResponse.json({
      tournamentId,
      coverage: {
        complete,
        partial,
        missing,
        total: players.length,
        expectedHolesPerPlayer: expectedHoles,
      },
    })
  } catch (error) {
    console.error('[v0] Admin hole-score coverage check error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Coverage check failed',
      },
      { status: 500 },
    )
  }
}
