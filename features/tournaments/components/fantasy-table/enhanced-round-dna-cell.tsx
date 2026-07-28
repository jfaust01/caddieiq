'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import { RoundDnaSummaryBox } from './round-dna-summary-box'
import { EnhancedRoundDnaTable } from './enhanced-round-dna-table'
import { HoleData } from '@/features/tournaments/utils/round-dna-helpers'

interface EnhancedRoundDnaCellProps {
  playerId: string
  round: number
  tournamentId: string
  onScorecardOpen?: (playerId: string, round: number) => void
}

async function fetchRoundScorecard(
  tournamentId: string,
  playerId: string,
  round: number
): Promise<HoleData[]> {
  try {
    const response = await fetch(
      `/api/tournaments/${tournamentId}/players/${playerId}/rounds/${round}/scorecard`
    )
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    // Transform API response to HoleData format
    return (data.holes || []).map((hole: any) => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      score: hole.score,
      toPar: hole.toPar,
      dkPoints: hole.dkPoints
    }))
  } catch (error) {
    console.error(`[v0] Failed to fetch scorecard for player ${playerId} round ${round}:`, error)
    return []
  }
}

function EnhancedRoundDnaCellInner({
  playerId,
  round,
  tournamentId,
  onScorecardOpen
}: EnhancedRoundDnaCellProps) {
  const [holes, setHoles] = useState<HoleData[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const data = await fetchRoundScorecard(tournamentId, playerId, round)
      setHoles(data)
      setLoading(false)
    }
    
    loadData()
  }, [playerId, round, tournamentId])
  
  // Create a cache key for memoization
  const cacheKey = useMemo(() => `${playerId}-${round}`, [playerId, round])
  
  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-white/40">
        <div className="text-sm">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg">
      {/* Left sidebar with summary */}
      <div className="flex-shrink-0">
        <RoundDnaSummaryBox round={round} holes={holes} />
      </div>
      
      {/* Main table */}
      <div className="flex-1 min-w-0">
        <EnhancedRoundDnaTable holes={holes} round={round} />
      </div>
      
      {/* Scorecard button */}
      <div className="flex items-center">
        <button
          onClick={() => onScorecardOpen?.(playerId, round)}
          className="px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-semibold"
        >
          View
        </button>
      </div>
    </div>
  )
}

// Memoize by playerId and round
export const EnhancedRoundDnaCell = memo(EnhancedRoundDnaCellInner, (prevProps, nextProps) => {
  return (
    prevProps.playerId === nextProps.playerId &&
    prevProps.round === nextProps.round &&
    prevProps.tournamentId === nextProps.tournamentId
  )
})

EnhancedRoundDnaCell.displayName = 'EnhancedRoundDnaCell'
