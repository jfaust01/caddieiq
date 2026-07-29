import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function auditTournament(tournamentId: string) {
  // Get the tournament with all its field data
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      externalId: true,
      field: {
        select: {
          id: true,
          playerId: true,
          sourceRecordId: true,
          player: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  })

  if (!tournament) {
    return NextResponse.json(
      { error: `Tournament ${tournamentId} not found` },
      { status: 404 },
    )
  }

  const totalFieldRows = tournament.field.length
  const withSourceRecordId = tournament.field.filter((f) => f.sourceRecordId).length
  const withoutSourceRecordId = totalFieldRows - withSourceRecordId

  // Get five samples
  const fiveSamples = tournament.field.slice(0, 5).map((f) => ({
    id: f.id,
    playerId: f.playerId,
    sourceRecordId: f.sourceRecordId,
  }))

  // Show why matching fails
  const playersBySourceRecordId = new Map(
    tournament.field
      .filter((f) => f.sourceRecordId)
      .map((f) => [f.sourceRecordId, f.player]),
  )

  return NextResponse.json({
    audit: {
      '1_internal_tournament_id': tournament.id,
      '2_sportsdataio_tournament_id': tournament.externalId,
      '3_total_tournamentfield_rows': totalFieldRows,
      '4_rows_with_sourcerecordid_not_null': withSourceRecordId,
      '4b_rows_with_sourcerecordid_null': withoutSourceRecordId,
      '5_five_sample_rows': fiveSamples,
      '6_exact_prisma_query': `
        const tournament = await prisma.tournament.findUnique({
          where: { id: "${tournamentId}" },
          select: {
            id: true,
            name: true,
            externalId: true,
            field: {
              select: {
                playerId: true,
                sourceRecordId: true,
                player: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        })
      `,
      '7_query_results': {
        returned_tournament: tournament ? 'yes' : 'no',
        field_array_length: tournament.field.length,
        field_with_sourcerecordid: withSourceRecordId,
        field_without_sourcerecordid: withoutSourceRecordId,
      },
      '8_why_zero_matched_players': {
        playersBySourceRecordId_map_size: playersBySourceRecordId.size,
        explanation:
          totalFieldRows === 0
            ? 'Tournament has NO field entries - cannot match any players'
            : withSourceRecordId === 0
              ? 'Tournament has field entries BUT sourceRecordId is NULL for ALL - fix not applied or records created before fix'
              : `Tournament has ${withSourceRecordId} players with sourceRecordId - should match successfully`,
      },
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let tournamentId = searchParams.get('id')

    // If no ID provided, get first tournament with externalId
    if (!tournamentId) {
      const first = await prisma.tournament.findFirst({
        where: { externalId: { not: null } },
        select: { id: true },
      })
      if (!first) {
        return NextResponse.json(
          { error: 'No tournaments with externalId found' },
          { status: 404 },
        )
      }
      tournamentId = first.id
    }

    return auditTournament(tournamentId)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tournamentId } = await request.json()

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID required' },
        { status: 400 },
      )
    }

    return auditTournament(tournamentId)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
