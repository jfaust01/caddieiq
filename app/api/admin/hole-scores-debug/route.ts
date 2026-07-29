import { NextRequest, NextResponse } from 'next/server'
import { importHoleScoresForTournament } from '@/lib/imports/sportsdataio-hole-score-importer'

export async function POST(request: NextRequest) {
  try {
    const { tournamentId } = await request.json()

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId required' },
        { status: 400 },
      )
    }

    // Capture console.log output
    const originalLog = console.log
    const originalWarn = console.warn
    const logs: string[] = []

    console.log = function (...args: any[]) {
      logs.push(args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '))
      originalLog.apply(console, args)
    }

    console.warn = function (...args: any[]) {
      logs.push('[WARN] ' + args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '))
      originalWarn.apply(console, args)
    }

    // Run the import
    const result = await importHoleScoresForTournament(tournamentId)

    // Restore original console
    console.log = originalLog
    console.warn = originalWarn

    return NextResponse.json({
      result,
      logs,
      diagnostics: {
        capturedLogLines: logs.length,
        logContent: logs.join('\n'),
      },
    })
  } catch (error) {
    console.log = console.log // restore
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
