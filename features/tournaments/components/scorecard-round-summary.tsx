'use client'

import { Info } from 'lucide-react'

interface ScorecardRoundSummaryProps {
  round: number
  courseName?: string | null
  coursePar?: number | null
  courseYardage?: number | null
}

export function ScorecardRoundSummary({
  round,
  courseName,
  coursePar,
  courseYardage,
}: ScorecardRoundSummaryProps) {
  return (
    <div className="px-4 py-3 bg-[#0F1117] flex items-center justify-between text-sm">
      <div className="text-[#9EA5B1]">
        <span className="font-medium">Round {round}</span>
        {courseName && (
          <>
            <span className="mx-2">•</span>
            <span>{courseName}</span>
          </>
        )}
        {coursePar && (
          <>
            <span className="mx-2">•</span>
            <span>Par {coursePar}</span>
          </>
        )}
      </div>
      <button className="p-1 hover:bg-[#222836] rounded transition-colors">
        <Info className="w-4 h-4 text-[#9EA5B1]" />
      </button>
    </div>
  )
}
