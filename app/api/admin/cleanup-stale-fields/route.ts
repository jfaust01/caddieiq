import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tournamentId = body?.tournamentId

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId required' },
        { status: 400 },
      )
    }

    // Delete all TournamentField records for this tournament where sourceRecordId IS NULL
    const deleted = await prisma.tournamentField.deleteMany({
      where: {
        tournamentId,
        sourceRecordId: null,
      },
    })

    // Count remaining records
    const remaining = await prisma.tournamentField.count({
      where: { tournamentId },
    })

    return NextResponse.json({
      tournamentId,
      staleRecordsDeleted: deleted.count,
      recordsRemaining: remaining,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
