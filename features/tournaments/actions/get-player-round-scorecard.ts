'use server'

import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export interface HoleScoreData {
  holeNumber: number
  score: number | null
  par: number | null
  toPar: number | null
  dkPoints: number | null
}

export interface PlayerRoundScorecardData {
  playerName: string
  roundNumber: number
  totalStrokes: number | null
  totalToPar: number | null
  totalDkPoints: number | null
  holes: HoleScoreData[]
}

/**
 * Fetch hole-by-hole scorecard data for a specific player round.
 * Cached with React's cache() API for request-level deduplication.
 *
 * Returns null if the player round doesn't exist or has no hole data.
 * Hole data is retrieved from the HoleScore table (precomputed from hole-by-hole import).
 * If HoleScore table is empty but round exists, falls back to null display (user message: "Hole-by-hole data not yet available").
 */
export const getPlayerRoundScorecard = cache(
  async (playerRoundId: string): Promise<PlayerRoundScorecardData | null> => {
    try {
      // Fetch the player round with related data
      const playerRound = await prisma.playerRound.findUnique({
        where: { id: playerRoundId },
        select: {
          id: true,
          score: true,
          toPar: true,
          round: {
            select: {
              roundNumber: true,
            },
          },
          tournamentField: {
            select: {
              player: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          holeScores: {
            orderBy: { holeNumber: 'asc' },
            select: {
              holeNumber: true,
              score: true,
              par: true,
              toPar: true,
              dkPoints: true,
            },
          },
        },
      })

      if (!playerRound || !playerRound.tournamentField?.player?.fullName) {
        return null
      }

      // If no hole scores exist, return null (will show "not available" message in UI)
      if (playerRound.holeScores.length === 0) {
        return null
      }

      // Calculate DK points from holes (sum of per-hole DK points)
      const totalDkPoints =
        playerRound.holeScores.reduce((sum, hole) => {
          return sum + (hole.dkPoints || 0)
        }, 0) || null

      return {
        playerName: playerRound.tournamentField.player.fullName,
        roundNumber: playerRound.round.roundNumber,
        totalStrokes: playerRound.score,
        totalToPar: playerRound.toPar,
        totalDkPoints: totalDkPoints,
        holes: playerRound.holeScores.map((hole) => ({
          holeNumber: hole.holeNumber,
          score: hole.score,
          par: hole.par,
          toPar: hole.toPar,
          dkPoints: hole.dkPoints,
        })),
      }
    } catch (error) {
      console.error('[v0] Error fetching player round scorecard:', error)
      return null
    }
  },
)
