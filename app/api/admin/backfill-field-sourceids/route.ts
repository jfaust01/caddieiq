import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { importTournamentFields } from '@/lib/imports/field-relations'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    console.log('[v0] Starting field sourceId backfill for tournaments with NULL sourceRecordId')

    // Find tournaments that have field entries but NO sourceRecordId
    const tournamentsNeedingBackfill = await prisma.tournament.findMany({
      where: {
        field: {
          some: {
            sourceRecordId: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        externalId: true,
      },
    })

    console.log(`[v0] Found ${tournamentsNeedingBackfill.length} tournaments needing backfill`)

    if (tournamentsNeedingBackfill.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tournaments need backfill - all have sourceRecordId populated',
        tournamentsBackfilled: 0,
      })
    }

    // Run the full field import which will re-process these tournaments
    // and populate sourceRecordId using the fixed repository
    const summary = await importTournamentFields()

    console.log('[v0] Field backfill complete:', summary)

    return NextResponse.json({
      success: true,
      message: `Backfilled ${tournamentsNeedingBackfill.length} tournaments`,
      tournamentsNeedingBackfill: tournamentsNeedingBackfill.map((t) => ({
        id: t.id,
        name: t.name,
        externalId: t.externalId,
      })),
      importSummary: summary,
    })
  } catch (error) {
    console.error('[v0] Field backfill error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Backfill failed',
      },
      { status: 500 },
    )
  }
}
