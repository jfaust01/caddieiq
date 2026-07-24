'use client'

import { cn } from '@/lib/utils'
import { DraftKingsMark } from './draftkings-mark'

interface ScorecardStatsCardsProps {
  dkFantasyPoints: number | null
  dfsSalary: number | null
  ownership: number | null
  averageScore: number | null
  className?: string
}

function formatDkPoints(points: number | null | undefined): string {
  if (points === null || points === undefined || !Number.isFinite(points)) {
    return '—'
  }
  const rounded = Math.round(points * 10) / 10
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

function formatSalary(salary: number | null | undefined): string {
  if (salary === null || salary === undefined || !Number.isFinite(salary)) {
    return '—'
  }
  return `$${Math.round(salary / 1000)}k`
}

function formatOwnership(ownership: number | null | undefined): string {
  if (ownership === null || ownership === undefined || !Number.isFinite(ownership)) {
    return '—'
  }
  return `${ownership.toFixed(1)}%`
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '—'
  }
  return score.toFixed(1)
}

export function ScorecardStatsCards({
  dkFantasyPoints,
  dfsSalary,
  ownership,
  averageScore,
  className,
}: ScorecardStatsCardsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {/* DK Points */}
      <div className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-1 mb-1.5">
          <DraftKingsMark className="h-3 w-auto" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            Points
          </span>
        </div>
        <div className="text-lg font-bold text-emerald-400 tabular-nums">
          {formatDkPoints(dkFantasyPoints)}
        </div>
      </div>

      {/* DFS Salary */}
      <div className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-1 mb-1.5">
          <DraftKingsMark className="h-3 w-auto" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            Salary
          </span>
        </div>
        <div className="text-lg font-bold text-white tabular-nums">
          {formatSalary(dfsSalary)}
        </div>
      </div>

      {/* Ownership */}
      <div className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block mb-1.5">
          Ownership
        </span>
        <div className="text-lg font-bold text-white tabular-nums">
          {formatOwnership(ownership)}
        </div>
      </div>

      {/* Average Score */}
      <div className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block mb-1.5">
          Avg Score
        </span>
        <div className="text-lg font-bold text-white tabular-nums">
          {formatScore(averageScore)}
        </div>
      </div>
    </div>
  )
}
