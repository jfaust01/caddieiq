'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ImportManager } from '@/lib/imports/import-manager'
import { createHoleScoreImportDefinition } from '@/lib/imports/hole-score-import'
import { HoleScoreRepository } from '@/lib/repositories/hole-score-repository'
// TODO: Wire provider once SportsDataIO is fully implemented
// import { SportsDataIOProvider } from '@/lib/providers/sportsdataio'

/**
 * POST /api/admin/backfill/hole-scores?tournamentId=XXX
 * 
 * Admin-only endpoint to backfill hole_scores table for a single tournament.
 * 
 * Requirements:
 * - tournamentId: UUID of tournament to backfill
 * - Authorization: Admin/system access only (add auth check as needed)
 * 
 * Process:
 * 1. Fetch hole-by-hole data from provider for all players in tournament
 * 2. Map provider format to HoleScore domain model
 * 3. Validate each hole (number 1-18, par 3-5, real score, source tag)
 * 4. Upsert to hole_scores table with composite unique (playerRoundId, holeNumber)
 * 5. Return import report with inserted/updated/failed counts
 * 
 * Safety:
 * - Idempotent: re-running returns same result
 * - Partial failures don't stop process (continues with next player)
 * - All failures logged with specific rejection reason
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: tournamentId' },
        { status: 400 }
      )
    }

    console.log('[v0] Hole-score backfill starting', { tournamentId, timestamp: new Date().toISOString() })

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true, slug: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: `Tournament not found: ${tournamentId}` },
        { status: 404 }
      )
    }

    console.log('[v0] Tournament verified', { tournament: tournament.name })

    // TODO: Once SportsDataIO provider is fully implemented, replace mock with real provider
    // const provider = new SportsDataIOProvider()
    // const repository = new HoleScoreRepository()
    // const manager = new ImportManager()
    
    // const definition = createHoleScoreImportDefinition(
    //   {
    //     provider,
    //     repository,
    //     tournamentId,
    //   },
    //   { season: tournament.season }
    // )
    
    // const result = await manager.run(definition, 'sportsdataio')

    // For now, return a placeholder result
    const result = {
      provider: 'sportsdataio',
      entity: 'hole_score',
      processed: 0,
      inserted: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'NOT_IMPLEMENTED',
          message: 'SportsDataIO provider hole-score ingestion not yet implemented. Awaiting provider wiring.',
        },
      ],
      warnings: [],
      durationMs: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }

    console.log('[v0] Hole-score backfill complete', {
      tournamentId,
      tournament: tournament.name,
      result,
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Hole-score backfill not yet implemented (provider pending)',
        tournament: {
          id: tournament.id,
          name: tournament.name,
          slug: tournament.slug,
        },
        importResult: result,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('[v0] Hole-score backfill error:', error)

    return NextResponse.json(
      {
        error: 'Backfill failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/backfill/hole-scores/status?tournamentId=XXX
 * 
 * Check hole-score coverage for a tournament.
 * Returns counts of players with complete, partial, and missing data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: tournamentId' },
        { status: 400 }
      )
    }

    // Count hole score coverage
    const coverage = await prisma.playerRound.findMany({
      where: {
        round: {
          tournament: { id: tournamentId },
        },
      },
      select: {
        id: true,
        score: true,
        tournamentField: {
          select: {
            player: { select: { fullName: true } },
          },
        },
        holeScores: {
          select: { holeNumber: true, source: true },
        },
      },
    })

    const stats = {
      total: coverage.length,
      complete: coverage.filter((pr) => pr.holeScores.length === 18).length,
      partial: coverage.filter((pr) => pr.holeScores.length > 0 && pr.holeScores.length < 18).length,
      missing: coverage.filter((pr) => pr.holeScores.length === 0).length,
      detailedCoverage: coverage.map((pr) => ({
        playerName: pr.tournamentField?.player?.fullName,
        holes: pr.holeScores.length,
        complete: pr.holeScores.length === 18,
      })),
    }

    return NextResponse.json(
      {
        tournamentId,
        stats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Hole-score status check error:', error)

    return NextResponse.json(
      {
        error: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
