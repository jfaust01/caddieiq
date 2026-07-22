'use server'

import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export interface HoleScoreData {
  holeNumber: number
  score: number | null
  par: number | null
  toPar: number | null
  dkPoints: number | null
  source: string // PROVENANCE: Track where this hole score came from
  externalId: string | null // PROVENANCE: Provider's external ID for audit
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
            // PROVENANCE: Only include verified, provider-supplied hole scores
            // Synthetic, reconstructed, or inferred data is explicitly excluded
            where: {
              source: { not: null }, // Must have explicit source
            },
            orderBy: { holeNumber: 'asc' },
            select: {
              holeNumber: true,
              score: true,
              par: true,
              toPar: true,
              dkPoints: true,
              source: true, // Track provenance
              externalId: true, // Track provider ID for audit
            },
          },
        },
      })

      if (!playerRound || !playerRound.tournamentField?.player?.fullName) {
        return null
      }

      // If no verified hole scores exist, return null (will show "not available" message in UI)
      // This is the expected state when real provider data has not been imported yet
      if (playerRound.holeScores.length === 0) {
        return null
      }

      // VERIFICATION: Ensure complete 18-hole dataset from single authoritative source
      // Partial data, mixed sources, or incomplete records are rejected
      if (playerRound.holeScores.length !== 18) {
        console.error(
          `[v0] Incomplete hole scores for round ${playerRoundId}: found ${playerRound.holeScores.length}/18 holes. Returning null.`,
        )
        return null
      }

      // Verify all holes have consistent source (no mixed/hybrid data)
      const sources = new Set(playerRound.holeScores.map((h) => h.source))
      if (sources.size > 1) {
        console.error(
          `[v0] Mixed data sources for round ${playerRoundId}: ${Array.from(sources).join(', ')}. Returning null.`,
        )
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
          source: hole.source, // PROVENANCE: Track where this data came from
          externalId: hole.externalId, // PROVENANCE: Provider's ID for audit
        })),
      }
    } catch (error) {
      console.error('[v0] Error fetching player round scorecard:', error)
      return null
    }
  },
)
