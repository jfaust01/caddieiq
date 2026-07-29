'use client'

import { useMemo, memo } from 'react'
import { RoundDnaScorecard } from './round-dna-scorecard'
import { HoleData } from '@/features/tournaments/utils/round-dna-helpers'

interface EnhancedRoundDnaCellProps {
  holes: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  round: number
}

function EnhancedRoundDnaCellInner({
  holes,
  round
}: EnhancedRoundDnaCellProps) {
  // Transform input to HoleData format
  const holeData: HoleData[] = useMemo(() => {
    return (holes || []).map((hole: any) => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      score: hole.score,
      toPar: hole.toPar || 0,
      dkPoints: hole.dkPoints || 0,
      status: hole.toPar === null || hole.toPar === undefined ? 'missing' : 
              hole.toPar <= -3 ? 'albatross' :
              hole.toPar === -2 ? 'eagle' :
              hole.toPar === -1 ? 'birdie' :
              hole.toPar === 0 ? 'par' :
              hole.toPar === 1 ? 'bogey' :
              hole.toPar === 2 ? 'double' : 'triplePlus'
    }))
  }, [holes])
  
  if (!holeData || holeData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-white/40 bg-white/[0.02] border border-white/[0.05] rounded-lg">
        <div className="text-sm">No scorecard data available</div>
      </div>
    )
  }

  return (
    <RoundDnaScorecard 
      holeScores={holeData.map(h => ({
        holeNumber: h.holeNumber,
        par: h.par || 0,
        score: h.score,
        toPar: h.toPar || 0,
        dkPoints: h.dkPoints || 0,
      }))}
      currentRound={round}
    />
  )
}

// Memoize by holes and round
export const EnhancedRoundDnaCell = memo(EnhancedRoundDnaCellInner, (prevProps, nextProps) => {
  return (
    prevProps.round === nextProps.round &&
    JSON.stringify(prevProps.holes) === JSON.stringify(nextProps.holes)
  )
})

EnhancedRoundDnaCell.displayName = 'EnhancedRoundDnaCell'
