'use client'

import { cn } from '@/lib/utils'
import { PlayerFlag } from './player-flag'

interface ScorecardHeroHeaderProps {
  playerName: string
  headshotUrl: string | null
  countryCode?: string | null
  position: number | string | null
  totalScore: number | null
  totalStrokes: number | null
  className?: string
}

function formatScoreToPar(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '—'
  }
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

function getScoreColorClass(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return 'text-white'
  }
  if (score < 0) return 'text-emerald-400'
  if (score > 0) return 'text-red-400'
  return 'text-white'
}

function formatPosition(pos: number | string | null): string {
  if (pos === null || pos === undefined) return '—'
  const str = String(pos).toUpperCase()
  return str.startsWith('T') ? str : `${pos}`
}

export function ScorecardHeroHeader({
  playerName,
  headshotUrl,
  countryCode,
  position,
  totalScore,
  totalStrokes,
  className,
}: ScorecardHeroHeaderProps) {
  const scoreToPar = formatScoreToPar(totalScore)
  const scoreColorClass = getScoreColorClass(totalScore)
  const positionDisplay = formatPosition(position)
  const initials = playerName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'border border-white/[0.06]',
        'bg-gradient-to-br from-white/[0.05] to-white/[0.02]',
        'backdrop-blur-sm',
        'p-6 sm:p-8',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]',
        className
      )}
    >
      {/* Accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
      />

      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/[0.06] blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Player section: headshot + info */}
        <div className="flex items-start gap-6 mb-6 pb-6 border-b border-white/[0.05]">
          {/* Headshot */}
          {headshotUrl ? (
            <img
              src={headshotUrl}
              alt={playerName}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-white/[0.12] object-cover shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-sm sm:text-base font-semibold text-white flex-shrink-0 shadow-lg">
              {initials}
            </div>
          )}

          {/* Player info */}
          <div className="flex-1 min-w-0">
            {/* Name and flag */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold text-white break-words">
                {playerName}
              </h2>
              {countryCode && (
                <PlayerFlag
                  countryCode={countryCode}
                  className="h-6 sm:h-7 w-auto flex-shrink-0"
                />
              )}
            </div>

            {/* Position badge */}
            <div className="inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1">
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                Position {positionDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row: Score + Strokes */}
        <div className="flex items-center gap-8">
          {/* Total score to par */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">
              Score
            </span>
            <span className={cn('text-5xl sm:text-6xl font-black tabular-nums', scoreColorClass)}>
              {scoreToPar}
            </span>
          </div>

          {/* Divider */}
          <div className="h-16 w-px bg-white/[0.08]" />

          {/* Total strokes */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">
              Strokes
            </span>
            <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
              {totalStrokes ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
