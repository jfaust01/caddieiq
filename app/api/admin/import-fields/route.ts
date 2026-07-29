import { importTournamentFields, importSingleTournamentField } from '@/lib/imports/field-relations'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tournamentId = body?.tournamentId

    if (tournamentId) {
      // Single tournament import
      console.log(`[v0] Running field import for tournament: ${tournamentId}`)
      const result = await importSingleTournamentField(tournamentId)
      
      console.log('[v0] Single tournament field import complete:', {
        preImportFieldRowCount: result.preImportFieldRowCount,
        postImportFieldRowCount: result.postImportFieldRowCount,
        sourceRecordIdWritten: result.sourceRecordIdWritten,
        sourceRecordIdStillNull: result.sourceRecordIdStillNull,
        entriesSeen: result.entriesSeen,
        inserted: result.inserted,
        updated: result.updated,
        failed: result.failed,
      })
      
      return NextResponse.json(result)
    } else {
      // All tournaments import
      console.log('[v0] Running field import for all tournaments...')
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
    }
  } catch (error) {
    console.error('[v0] Field import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
