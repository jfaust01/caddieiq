'use client'

import { useMemo } from 'react'
import type { FieldEntrant } from '@/features/tournaments/types'
import { FantasyPlayerTable } from '@/features/tournaments/components/fantasy-table/fantasy-player-table'

interface LeaderboardTabProps {
  tournament: any
}

export function LeaderboardTab({ tournament }: LeaderboardTabProps) {
  const matchScores = tournament.matchScores || []

  // Determine tournament phase based on dates
  const now = new Date()
  const startDate = new Date(tournament.startDate)
  const endDate = new Date(tournament.endDate)
  
  let phase: 'scheduled' | 'live' | 'completed'
  if (now < startDate) {
    phase = 'scheduled'
  } else if (now <= endDate) {
    phase = 'live'
  } else {
    phase = 'completed'
  }

  // Transform match scores to FieldEntrant format for the fantasy table
  const entrants: FieldEntrant[] = useMemo(() => {
    return matchScores.map((score: any) => ({
      playerId: score.player.id,
      playerName: `${score.player.firstName} ${score.player.lastName}`,
      countryCode: score.player.countryCode || null,
      headshotUrl: score.player.headshotUrl || null,
      // Scoring data
      position: score.position || null,
      status: score.status || null,
      cutMade: score.cutMade !== false,
      totalStrokes: score.score,
      total: null, // Relative to par - would need to be calculated
      dkFantasyPoints: score.dkFantasyPoints || null,
      totalDkFantasyPoints: score.dkFantasyPoints || null,
      round1: score.round1Score || null,
      round2: score.round2Score || null,
      round3: score.round3Score || null,
      round4: score.round4Score || null,
      round1DkPoints: null,
      round2DkPoints: null,
      round3DkPoints: null,
      round4DkPoints: null,
      round1RelToPar: null,
      round2RelToPar: null,
      round3RelToPar: null,
      round4RelToPar: null,
      // Pre-tournament data (Scheduled phase)
      dfsSalary: score.dfsSalary || null,
      oddsToWin: score.oddsToWin || null,
      worldRanking: score.worldRanking || null,
      formScore: score.formScore || null,
      startingTime: score.startingTime || null,
      ownershipPercent: score.ownershipPercent || null,
      // Live data
      thruHole: score.thruHole || null,
      roundScore: score.roundScore || null,
    }))
  }, [matchScores])

  // Empty DFS lookups map (no value model data available in historical view)
  const dfsByPlayer = useMemo(() => new Map(), [])

  return (
    <div className="tournament-table-container">
      <FantasyPlayerTable
        phase={phase}
        entrants={entrants}
        allEntrants={entrants}
        fieldSize={entrants.length}
        dfsByPlayer={dfsByPlayer}
        onRowClick={(playerId) => {
          // Open player scorecard modal - would be handled by parent or modal context
          console.log('Opening scorecard for player:', playerId)
        }}
      />
    </div>
  )
}
