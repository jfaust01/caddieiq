import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/tournaments
 * Returns a list of all tournaments for admin selectors
 */
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('[v0] Failed to fetch tournaments:', error)
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 })
  }
}
