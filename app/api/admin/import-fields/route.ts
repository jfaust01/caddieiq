import { importTournamentFields } from '@/lib/imports/field-relations'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('[v0] Running field import...')
    const summary = await importTournamentFields()
    
    console.log('[v0] Field import complete:', {
      tournamentsConsidered: summary.tournamentsConsidered,
      tournamentsWithField: summary.tournamentsWithField,
      entriesSeen: summary.entriesSeen,
      entriesInvalid: summary.entriesInvalid,
      entriesUnmatchedPlayer: summary.entriesUnmatchedPlayer,
      inserted: summary.inserted,
      updated: summary.updated,
      failed: summary.failed,
    })
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[v0] Field import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
