import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('id') || 'cmrtxfgxb0000odmlindxgvma'

    // Check tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true, externalId: true },
    })

    // Count rounds
    const roundCount = await prisma.round.count({
      where: { tournamentId },
    })

    // Get sample rounds
    const rounds = await prisma.round.findMany({
      where: { tournamentId },
      select: { id: true, roundNumber: true },
      take: 5,
    })

    // Check player_rounds
    const playerRoundCount = await prisma.playerRound.count({
      where: {
        tournamentField: { tournamentId },
      },
    })

    return NextResponse.json({
      tournament,
      roundCount,
      rounds,
      playerRoundCount,
      conclusion: {
        roundsExist: roundCount > 0,
        playerRoundsExist: playerRoundCount > 0,
        reason: roundCount === 0 
          ? 'NO ROUNDS EXIST - importer will skip all players'
          : `${roundCount} rounds exist - importer should process them`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
