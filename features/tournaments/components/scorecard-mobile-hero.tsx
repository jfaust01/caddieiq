'use client'

import { cn } from '@/lib/utils'

interface ScorecardMobileHeroProps {
  playerName: string
  headshotUrl: string | null
  position: number | null
  totalScore: number | null
  totalStrokes: number | null
  dkFantasyPoints: number | null
  courseName: string
  coursePar: number | null
}

export function ScorecardMobileHero({
  playerName,
  headshotUrl,
  position,
  totalScore,
  totalStrokes,
  dkFantasyPoints,
  courseName,
  coursePar,
}: ScorecardMobileHeroProps) {
  const scoreColor = totalScore && totalScore < 0 ? 'text-emerald-400' : totalScore && totalScore > 0 ? 'text-red-400' : 'text-white'

  return (
    <div className="space-y-3 rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
      {/* Player Info Row */}
      <div className="flex min-w-0 items-center gap-3">
        {headshotUrl ? (
          <img
            src={headshotUrl}
            alt={playerName}
            className="h-16 w-16 shrink-0 rounded-full border border-white/[0.12] object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-sm font-semibold text-white">
            {playerName
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-white">{playerName}</h3>
          <div className="mt-1 text-xs text-white/60">{courseName}</div>
          {coursePar && <div className="text-xs text-white/60">Par {coursePar}</div>}
        </div>
      </div>

      {/* Metrics Grid - 2 columns */}
      <div className="grid w-full grid-cols-2 gap-2">
        <div className="min-w-0 rounded bg-white/[0.04] px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Score</div>
          <div className={cn('text-lg font-bold tabular-nums', scoreColor)}>
            {totalScore !== null && totalScore !== undefined ? (totalScore === 0 ? 'E' : totalScore > 0 ? `+${totalScore}` : totalScore) : '—'}
          </div>
        </div>

        <div className="min-w-0 rounded bg-white/[0.04] px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Position</div>
          <div className="text-lg font-bold tabular-nums text-white">{position ?? '—'}</div>
        </div>

        <div className="min-w-0 rounded bg-white/[0.04] px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">DK Points</div>
          <div className="text-lg font-bold tabular-nums text-white">{dkFantasyPoints ?? '—'}</div>
        </div>

        <div className="min-w-0 rounded bg-white/[0.04] px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Strokes</div>
          <div className="text-lg font-bold tabular-nums text-white">{totalStrokes ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}
