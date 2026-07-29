/**
 * SportsDataIO Hole Score Import Pipeline
 *
 * Fetches player hole-by-hole scoring from SportsDataIO leaderboard API and
 * persists to the `hole_scores` table with real provider data.
 *
 * Pipeline:
 * 1. Fetch leaderboard from SportsDataIO (includes Rounds.Holes)
 * 2. Match players to internal Player records via external IDs
 * 3. Resolve/create PlayerRound records
 * 4. Calculate DraftKings points per hole
 * 5. Upsert hole_scores with composite key (playerRoundId, holeNumber)
 */

import prismaClient from '@/lib/prisma'
import { SportsDataProvider } from '@/lib/providers/sportsdataio/client'
import type { SdioRound, SdioRoundHole } from '@/lib/providers/sportsdataio/types'

/**
 * DraftKings scoring formula for golf:
 * - Albatross (-3): 18 points
 * - Eagle (-2): 12 points
 * - Birdie (-1): 8 points
 * - Par (0): 0 points
 * - Bogey (+1): -2 points
 * - Double Bogey (+2): -5 points
 * - Triple+ Bogey (+3+): -8 points
 */
function calculateDkPoints(holeScore: number | null | undefined, holePar: number | null | undefined): number | null {
  if (holeScore === null || holeScore === undefined || holePar === null || holePar === undefined) {
    return null
  }

  const relativeToPar = holeScore - holePar

  switch (relativeToPar) {
    case -3:
      return 18
    case -2:
      return 12
    case -1:
      return 8
    case 0:
      return 0
    case 1:
      return -2
    case 2:
      return -5
    default:
      return relativeToPar >= 3 ? -8 : null
  }
}

export interface HoleScoreImportSummary {
  success: boolean
  tournamentId: string
  providerTournamentId: number | null
  playersProcessed: number
  roundsProcessed: number
  holesInserted: number
  holesUpdated: number
  playersUnmatched: Array<{ playerId: number; name?: string }>
  errors: Array<{ error: string; playerRoundId?: string }>
}

export async function importHoleScoresForTournament(
  internalTournamentId: string,
): Promise<HoleScoreImportSummary> {
  const prisma = prismaClient
  const summary: HoleScoreImportSummary = {
    success: false,
    tournamentId: internalTournamentId,
    providerTournamentId: null,
    playersProcessed: 0,
    roundsProcessed: 0,
    holesInserted: 0,
    holesUpdated: 0,
    playersUnmatched: [],
    errors: [],
  }

  try {
    // Step 1: Find tournament and get provider ID
    const tournament = await prisma.tournament.findUnique({
      where: { id: internalTournamentId },
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

    if (!tournament) {
      throw new Error(`Tournament ${internalTournamentId} not found`)
    }

    summary.providerTournamentId = parseInt(tournament.externalId || '0', 10) || null

    // Step 2: Fetch leaderboard from SportsDataIO
    const provider = SportsDataProvider.fromEnv()
    const leaderboardResponse = await provider.getLeaderboard(tournament.externalId)
    const leaderboard = leaderboardResponse.data

    if (!leaderboard?.Players || leaderboard.Players.length === 0) {
      throw new Error('No players found in leaderboard')
    }

    console.log(`[v0] Importing hole scores for tournament ${tournament.name} (provider: ${tournament.externalId})`)

    // Step 3: Build player lookup by source record ID (SportsDataIO PlayerID)
    const playersBySourceRecordId = new Map(
      tournament.field
        .filter((f) => f.sourceRecordId)
        .map((f) => [f.sourceRecordId, f.player]),
    )

    // Step 4: Process each player's rounds and holes
    for (const sdioPlayer of leaderboard.Players) {
      const playerSourceRecordId = String(sdioPlayer.PlayerID)

      // Find matching internal player by source record ID
      let internalPlayer = playersBySourceRecordId.get(playerSourceRecordId)
      if (!internalPlayer) {
        summary.playersUnmatched.push({
          playerId: sdioPlayer.PlayerID,
          name: sdioPlayer.Name,
        })
        continue
      }

      summary.playersProcessed++

      // Process rounds with hole data
      if (!sdioPlayer.Rounds || sdioPlayer.Rounds.length === 0) {
        continue
      }

      for (const sdioRound of sdioPlayer.Rounds) {
        // Step 5: Resolve/create Round
        const roundNumber = sdioRound.Number || 1
        const round = await prisma.round.findFirst({
          where: {
            tournamentId: internalTournamentId,
            roundNumber: roundNumber,
          },
          select: { id: true },
        })

        if (!round) {
          console.warn(`[v0] Round ${roundNumber} not found for tournament ${internalTournamentId}`)
          continue
        }

        // Step 6: Resolve/create PlayerRound
        let playerRound = await prisma.playerRound.findFirst({
          where: {
            playerId: internalPlayer.id,
            round: { id: round.id },
          },
          select: { id: true },
        })

        if (!playerRound) {
          // Create PlayerRound with round summary data from SportsDataIO
          playerRound = await prisma.playerRound.create({
            data: {
              playerId: internalPlayer.id,
              roundId: round.id,
              score: sdioRound.Score || null,
              toPar: (sdioRound.Score && sdioRound.Par) ? sdioRound.Score - sdioRound.Par : null,
              position: null, // Position is set at tournament level
            },
            select: { id: true },
          })
        }

        summary.roundsProcessed++

        // Step 7: Upsert hole scores
        if (!sdioRound.Holes || sdioRound.Holes.length === 0) {
          continue
        }

        for (const sdioHole of sdioRound.Holes) {
          const holeNumber = sdioHole.Number
          if (!holeNumber || holeNumber < 1 || holeNumber > 18) {
            summary.errors.push({
              error: `Invalid hole number: ${holeNumber}`,
              playerRoundId: playerRound.id,
            })
            continue
          }

          if (!sdioHole.Par || sdioHole.Par < 3 || sdioHole.Par > 5) {
            summary.errors.push({
              error: `Invalid par: ${sdioHole.Par} for hole ${holeNumber}`,
              playerRoundId: playerRound.id,
            })
            continue
          }

          if (!sdioHole.Score || sdioHole.Score < 1 || sdioHole.Score > 14) {
            summary.errors.push({
              error: `Invalid score: ${sdioHole.Score} for hole ${holeNumber}`,
              playerRoundId: playerRound.id,
            })
            continue
          }

          const toPar = sdioHole.ToPar ?? sdioHole.Score - sdioHole.Par
          const dkPoints = calculateDkPoints(sdioHole.Score, sdioHole.Par)
          const externalId = `${tournament.externalId}_h${holeNumber}_p${sdioPlayer.PlayerID}`

          // Upsert using the unique constraint on (playerRoundId, holeNumber)
          const existingHole = await prisma.holeScore.findUnique({
            where: {
              playerRoundId_holeNumber: {
                playerRoundId: playerRound.id,
                holeNumber,
              },
            },
            select: { id: true },
          })

          if (existingHole) {
            await prisma.holeScore.update({
              where: { id: existingHole.id },
              data: {
                score: sdioHole.Score,
                par: sdioHole.Par,
                toPar,
                dkPoints,
                source: 'sportsdataio',
                externalId,
                importedAt: new Date(),
              },
            })
            summary.holesUpdated++
          } else {
            await prisma.holeScore.create({
              data: {
                playerRoundId: playerRound.id,
                holeNumber,
                score: sdioHole.Score,
                par: sdioHole.Par,
                toPar,
                dkPoints,
                source: 'sportsdataio',
                externalId,
                importedAt: new Date(),
              },
            })
            summary.holesInserted++
          }
        }
      }
    }

    summary.success = true
    console.log(`[v0] Hole score import complete:`, summary)
  } catch (error) {
    summary.errors.push({
      error: error instanceof Error ? error.message : String(error),
    })
    console.error(`[v0] Hole score import failed:`, error)
  }

  return summary
}
