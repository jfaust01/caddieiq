import { NextRequest, NextResponse } from 'next/server'
import prismaClient from '@/lib/prisma'

/**
 * GET /api/historical/tournaments
 * Returns all tournaments with their historical data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const tournaments = await prismaClient.tournament.findMany({
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            matchScores: true,
            dfsContests: true,
            oddsQuotes: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    const total = await prismaClient.tournament.count()

    return NextResponse.json({
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Historical API] Error fetching tournaments:', error)
    if (error instanceof Error) {
      console.error('[Historical API] Error details:', error.message)
    }
    return NextResponse.json(
      {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      },
      { status: 200 }
    )
  }
}
