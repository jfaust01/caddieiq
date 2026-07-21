import { NextRequest, NextResponse } from 'next/server'
import prismaClient from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prismaClient.tournament.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        winner: true,
        matchScores: {
          select: {
            id: true,
            position: true,
            score: true,
            player: {
              select: { id: true, firstName: true, lastName: true },
            },
            round1Score: true,
            round2Score: true,
            round3Score: true,
            round4Score: true,
          },
          orderBy: { position: 'asc' },
          take: 50,
        },
        weatherSnapshots: {
          select: {
            id: true,
            recordedAt: true,
            temperature: true,
            feelsLike: true,
            windSpeed: true,
            windGust: true,
            humidity: true,
            condition: true,
            precipitation: true,
            cloudCover: true,
          },
        },
        oddsQuotes: {
          select: {
            id: true,
            market: true,
            bookmakerKey: true,
            selection: true,
            decimalOdds: true,
            americanOdds: true,
            impliedProbability: true,
          },
          take: 50,
        },
        dfsContests: {
          select: {
            id: true,
            contestName: true,
            operator: true,
            fieldSize: true,
            salaryCap: true,
          },
          take: 10,
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: tournament })
  } catch (error) {
    console.error('[Historical API] Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}
