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

export interface CourseHoleData {
  holeNumber: number
  par: number | null
}

export interface PlayerRoundScorecardData {
  playerName: string
  headshotUrl?: string | null
  countryCode?: string | null
  tour?: string | null
  currentPosition?: string | null
  roundNumber: number
  totalStrokes: number | null
  totalToPar: number | null
  totalDkPoints: number | null
  dfsSalary?: number | null
  ownershipPercent?: number | null
  round1Score?: number | null
  round2Score?: number | null
  round3Score?: number | null
  round4Score?: number | null
  courseName?: string | null
  courseYardage?: number | null
  courseHoles?: CourseHoleData[] // Course hole par data for display
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
              course: {
                select: {
                  name: true,
                  yardage: true,
                  par: true,
                  holes: {
                    orderBy: { holeNumber: 'asc' },
                    select: {
                      holeNumber: true,
                      par: true,
                    },
                  },
                },
              },
            },
          },
          tournamentField: {
            select: {
              finalPosition: true,
              player: {
                select: {
                  fullName: true,
                  headshotUrl: true,
                  countryCode: true,
                },
              },
              tournament: {
                select: {
                  id: true,
                },
              },
            },
          },
          holeScores: {
            // PROVENANCE: `source` is a required column (non-nullable), so every
            // HoleScore row is provider-tagged by definition. No null filter needed
            // (filtering `source: { not: null }` is invalid on a non-nullable field).
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
        headshotUrl: playerRound.tournamentField.player.headshotUrl,
        countryCode: playerRound.tournamentField.player.countryCode,
        currentPosition: playerRound.tournamentField.finalPosition?.toString() || undefined,
        roundNumber: playerRound.round.roundNumber,
        totalStrokes: playerRound.score,
        totalToPar: playerRound.toPar,
        totalDkPoints: totalDkPoints,
        courseName: playerRound.round.course?.name,
        courseYardage: playerRound.round.course?.yardage,
        courseHoles: playerRound.round.course?.holes.map((hole) => ({
          holeNumber: hole.holeNumber,
          par: hole.par,
        })),
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
