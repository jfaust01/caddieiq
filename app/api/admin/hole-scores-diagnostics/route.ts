import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface PlayerDiagnostic {
  playerId: string
  playerName: string
  sdioPlayerId: number | null
  sdioPlayerName: string | null
  internalPlayerId: string
  tournamentFieldId: string | null
  sourceRecordId: string | null
  matchStatus: 'matched' | 'unmatched' | 'no_field_data'
  r1Holes: number
  r2Holes: number
  r3Holes: number
  r4Holes: number
  totalHoles: number
  playerRoundIds: string[]
  importedAt: string | null
  status: 'complete' | 'partial' | 'no_hole_data' | 'import_error'
}

export interface HoleScoreDiagnostics {
  tournament: {
    id: string
    name: string
    externalId: number | null
  }
  summary: {
    providerPlayersReturned: number
    playersMatched: number
    playersUnmatched: number
    roundsProcessed: number
    holesInserted: number
    holesUpdated: number
    totalPersistedHoleRows: number
    coveragePercentage: number
  }
  players: PlayerDiagnostic[]
  unmatchedPlayers: Array<{
    sdioPlayerId: number
    name: string
  }>
  lastImportedAt: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    console.log('[v0] Diagnostics API called with tournamentId:', tournamentId)

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId parameter required' },
        { status: 400 },
      )
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        externalId: true,
        field: {
          select: {
            id: true,
            playerId: true,
            sourceRecordId: true,
            player: {
              select: {
                id: true,
                fullName: true,
              },
            },
            playerRounds: {
              select: {
                id: true,
                roundId: true,
                updatedAt: true,
                holeScores: {
                  select: { id: true },
                },
              },
            },
          },
        },
        rounds: {
          select: { id: true, roundNumber: true },
        },
      },
    })

    console.log('[v0] Tournament query result:', tournament ? 'found' : 'not found')
    
    if (!tournament) {
      return NextResponse.json(
        { error: `Tournament ${tournamentId} not found` },
        { status: 404 },
      )
    }

    // Build diagnostics
    const playerDiagnostics: PlayerDiagnostic[] = []
    const roundMap = new Map(tournament.rounds.map((r) => [r.id, r.roundNumber]))

    for (const field of tournament.field) {
      const playerRounds = field.playerRounds || []
      const roundCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
      const roundIds: string[] = []
      let latestImportedAt: string | null = null

      for (const pr of playerRounds) {
        const roundNum = roundMap.get(pr.roundId)
        if (roundNum && roundNum >= 1 && roundNum <= 4) {
          roundCounts[roundNum as 1 | 2 | 3 | 4] = pr.holeScores?.length || 0
        }
        roundIds.push(pr.id)
        if (!latestImportedAt || (pr.updatedAt && pr.updatedAt > new Date(latestImportedAt || 0))) {
          latestImportedAt = pr.updatedAt?.toISOString() || null
        }
      }

      const totalHoles = roundCounts[1] + roundCounts[2] + roundCounts[3] + roundCounts[4]

      // Determine status
      let status: 'complete' | 'partial' | 'no_hole_data' | 'import_error'
      if (totalHoles === 0) {
        status = 'no_hole_data'
      } else if (totalHoles < 72) {
        status = 'partial'
      } else {
        status = 'complete'
      }

      playerDiagnostics.push({
        playerId: field.playerId,
        playerName: field.player?.fullName || 'Unknown',
        sdioPlayerId: field.sourceRecordId ? parseInt(field.sourceRecordId, 10) : null,
        sdioPlayerName: null,
        internalPlayerId: field.player?.id || '',
        tournamentFieldId: field.id,
        sourceRecordId: field.sourceRecordId,
        matchStatus: field.sourceRecordId ? 'matched' : 'unmatched',
        r1Holes: roundCounts[1],
        r2Holes: roundCounts[2],
        r3Holes: roundCounts[3],
        r4Holes: roundCounts[4],
        totalHoles,
        playerRoundIds: roundIds,
        importedAt: latestImportedAt,
        status,
      })
    }

    // Calculate totals
    const totalHoleRows = await prisma.holeScore.count({
      where: {
        playerRound: {
          tournamentField: {
            tournamentId,
          },
        },
      },
    })

    const matchedCount = playerDiagnostics.filter((p) => p.sourceRecordId).length
    const unmatchedCount = tournament.field.length - matchedCount

    const diagnostics: HoleScoreDiagnostics = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        externalId: tournament.externalId ? parseInt(tournament.externalId, 10) : null,
      },
      summary: {
        providerPlayersReturned: 0,
        playersMatched: matchedCount,
        playersUnmatched: unmatchedCount,
        roundsProcessed: 0,
        holesInserted: 0,
        holesUpdated: 0,
        totalPersistedHoleRows: totalHoleRows,
        coveragePercentage:
          tournament.field.length > 0 ? Math.round((matchedCount / tournament.field.length) * 100) : 0,
      },
      players: playerDiagnostics.sort((a, b) => a.playerName.localeCompare(b.playerName)),
      unmatchedPlayers: [],
      lastImportedAt: playerDiagnostics
        .map((p) => (p.importedAt ? new Date(p.importedAt).getTime() : 0))
        .reduce((max, curr) => Math.max(max, curr), 0)
        ? new Date(
            playerDiagnostics
              .map((p) => (p.importedAt ? new Date(p.importedAt).getTime() : 0))
              .reduce((max, curr) => Math.max(max, curr), 0),
          ).toISOString()
        : null,
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('[v0] Diagnostics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Diagnostics failed' },
      { status: 500 },
    )
  }
}
