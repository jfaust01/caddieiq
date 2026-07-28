'use client'

import { useMemo, memo } from 'react'
import { RoundDnaSummaryBox } from './round-dna-summary-box'
import { EnhancedRoundDnaTable } from './enhanced-round-dna-table'
import { HoleData } from '@/features/tournaments/utils/round-dna-helpers'

interface EnhancedRoundDnaCellProps {
  holes: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  round: number
}

function EnhancedRoundDnaCellInner({
  holes,
  round
}: EnhancedRoundDnaCellProps) {
  console.log('[v0] EnhancedRoundDnaCell rendered with holes:', holes?.length, 'round:', round)
  
  // Transform input to HoleData format
  const holeData: HoleData[] = useMemo(() => {
    const transformed = (holes || []).map((hole: any) => ({
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
    console.log('[v0] Transformed holeData:', transformed.length, 'items')
    return transformed
  }, [holes])
  
  if (!holeData || holeData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-white/40 bg-white/[0.02] border border-white/[0.05] rounded-lg">
        <div className="text-sm">No scorecard data available</div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg">
      {/* Left sidebar with summary */}
      <div className="flex-shrink-0">
        <RoundDnaSummaryBox round={round} holes={holeData} />
      </div>
      
      {/* Main table */}
      <div className="flex-1 min-w-0 overflow-x-auto">
        <EnhancedRoundDnaTable holes={holeData} round={round} />
      </div>
      
    </div>
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
