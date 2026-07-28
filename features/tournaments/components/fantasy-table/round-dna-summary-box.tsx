'use client'

import { formatToPar, HoleData, calculateRoundTotals } from '@/features/tournaments/utils/round-dna-helpers'

interface RoundDnaSummaryBoxProps {
  round: number
  holes: HoleData[]
}

export function RoundDnaSummaryBox({ round, holes }: RoundDnaSummaryBoxProps) {
  const completedHoles = holes.filter(h => h.toPar !== null)
  
  if (completedHoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-12 h-full bg-white/[0.02] border border-white/[0.05] rounded px-2 py-4">
        <div className="text-xs font-semibold text-white/40">R{round}</div>
        <div className="text-7px text-white/30 text-center mt-1">
          Did not<br />play
        </div>
      </div>
    )
  }
  
  const totals = calculateRoundTotals(holes)
  const birdies = completedHoles.filter(h => h.toPar === -1).length
  const eagles = completedHoles.filter(h => h.toPar! <= -2).length
  const bogeys = completedHoles.filter(h => h.toPar === 1).length
  
  return (
    <div className="flex flex-col w-12 h-full bg-white/[0.02] border border-white/[0.05] rounded px-2 py-3 gap-1">
      {/* Round label */}
      <div className="text-xs font-semibold text-emerald-400">R{round}</div>
      
      {/* To Par */}
      {totals.totalScore !== null && (
        <div className="text-sm font-bold text-emerald-300">
          {formatToPar(totals.totalScore)}
        </div>
      )}
      
      {/* Score counts */}
      <div className="flex flex-col gap-1 text-7px text-white/70">
        {eagles > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-8px">🦅</span>
            <span>{eagles}</span>
          </div>
        )}
        {birdies > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-8px">●</span>
            <span>{birdies}</span>
          </div>
        )}
        {bogeys > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-8px">●</span>
            <span>{bogeys}</span>
          </div>
        )}
      </div>
    </div>
  )
}
