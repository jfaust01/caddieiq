'use client'

import { cn } from '@/lib/utils'

type ScorecardModalPhase = 'scheduled' | 'live' | 'completed'

interface HoleData {
  holeNumber: number
  par: number | null
  score: number | null
  toPar: number | null
  dkPoints: number | null
  avgScore?: number | null
  projectedScore?: number | null
}

interface ScorecardNineHoleCardProps {
  label: 'FRONT 9' | 'BACK 9'
  holes: HoleData[]
  phase: ScorecardModalPhase
  isLive?: boolean
  currentHole?: number
  isLoading?: boolean
}

/** Phase-specific accent colors. */
const phaseAccents: Record<ScorecardModalPhase, { text: string; bg: string; border: string }> = {
  completed: { text: 'text-sky-400', bg: 'bg-sky-400/5', border: 'border-sky-400/20' },
  live: { text: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/20' },
  scheduled: { text: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/20' },
}

function getScoreColor(score: number | null, par: number | null) {
  if (score === null || par === null) return 'text-foreground/60'
  const toPar = score - par
  if (toPar <= -2) return 'text-green-400' // Eagle or better
  if (toPar === -1) return 'text-green-400/80' // Birdie
  if (toPar === 0) return 'text-foreground/70' // Par
  if (toPar === 1) return 'text-red-400/60' // Bogey
  return 'text-red-400' // Double+
}

/**
 * Premium 9-hole scorecard card for Front 9 or Back 9.
 * Displays hole-by-hole data in a compact, responsive grid.
 * Content adapts based on tournament phase.
 */
export function ScorecardNineHoleCard({
  label,
  holes,
  phase,
  isLive = false,
  currentHole,
  isLoading = false,
}: ScorecardNineHoleCardProps) {
  const accents = phaseAccents[phase]
  const nineStart = label === 'FRONT 9' ? 1 : 10
  const displayHoles = holes.slice(nineStart === 1 ? 0 : 9, nineStart === 1 ? 9 : 18)

  // Calculate totals
  const totals = {
    par: displayHoles.reduce((sum, h) => sum + (h.par || 0), 0),
    score: displayHoles.reduce((sum, h) => sum + (h.score || 0), 0),
    dkPoints: displayHoles.reduce((sum, h) => sum + (h.dkPoints || 0), 0),
  }

  // For scheduled phase: avg and projected
  const avgTotal = phase === 'scheduled' 
    ? displayHoles.reduce((sum, h) => sum + (h.avgScore || 0), 0)
    : 0
  const projTotal = phase === 'scheduled'
    ? displayHoles.reduce((sum, h) => sum + (h.projectedScore || 0), 0)
    : 0

  const hasScores = displayHoles.some(h => h.score !== null)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[16px]',
        'border',
        accents.border,
        'bg-transparent',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]'
      )}
    >
      {/* Accent top edge */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5 pointer-events-none', accents.bg)} aria-hidden="true" />

      {/* Header */}
      <div className={cn('border-b', accents.border, 'px-4 py-3 flex items-center justify-between')}>
        <div className="flex items-center gap-3">
          <h3 className={cn('font-semibold text-sm sm:text-base', accents.text)}>
            {label}
          </h3>
          <span className="text-xs text-foreground/50">
            {nineStart}–{nineStart === 1 ? 9 : 18}
          </span>
        </div>
        {hasScores && (
          <div className={cn('font-mono text-sm', accents.text)}>
            {phase === 'completed' && `${totals.score}/${totals.par}`}
            {phase === 'live' && `${totals.score}/${totals.par}`}
            {phase === 'scheduled' && `${projTotal}/${totals.par}`}
          </div>
        )}
      </div>

      {/* Scorecard grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/50">HOLE</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-foreground/50">PAR</th>
              {phase === 'scheduled' && <th className="px-3 py-2 text-center text-xs font-semibold text-foreground/50">AVG</th>}
              <th className="px-3 py-2 text-center text-xs font-semibold text-foreground/50">
                {phase === 'scheduled' ? 'PROJ' : 'SCORE'}
              </th>
              {(phase === 'completed' || phase === 'live') && (
                <th className="px-3 py-2 text-center text-xs font-semibold text-foreground/50">DK PTS</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayHoles.map((hole) => {
              const isCurrentHole = isLive && hole.holeNumber === currentHole
              return (
                <tr
                  key={hole.holeNumber}
                  className={cn(
                    'border-b border-white/[0.04] transition-colors',
                    isCurrentHole && 'bg-amber-400/10'
                  )}
                >
                  {/* Hole number */}
                  <td className="px-3 py-2.5 font-semibold text-foreground/80">
                    {hole.holeNumber}
                    {isCurrentHole && <span className="ml-1 text-amber-400 text-xs">●</span>}
                  </td>

                  {/* Par */}
                  <td className="px-3 py-2.5 text-center text-foreground/70">
                    {hole.par ?? '—'}
                  </td>

                  {/* Avg score (scheduled only) */}
                  {phase === 'scheduled' && (
                    <td className="px-3 py-2.5 text-center text-foreground/60 text-xs">
                      {hole.avgScore ? hole.avgScore.toFixed(2) : '—'}
                    </td>
                  )}

                  {/* Score / Projected */}
                  <td className={cn('px-3 py-2.5 text-center font-semibold', 
                    phase === 'scheduled' ? 'text-foreground/70' : getScoreColor(hole.score, hole.par))}>
                    {phase === 'scheduled' 
                      ? (hole.projectedScore ? hole.projectedScore.toFixed(0) : '—')
                      : (hole.score ?? '—')
                    }
                  </td>

                  {/* DK Points (completed/live only) */}
                  {(phase === 'completed' || phase === 'live') && (
                    <td className="px-3 py-2.5 text-center text-foreground/60 text-xs">
                      {hole.dkPoints ? hole.dkPoints.toFixed(1) : '—'}
                    </td>
                  )}
                </tr>
              )
            })}

            {/* Totals row */}
            <tr className={cn('border-t-2 font-semibold', accents.border)}>
              <td className={cn('px-3 py-2.5', accents.text)}>
                {nineStart === 1 ? 'OUT' : 'IN'}
              </td>
              <td className={cn('px-3 py-2.5 text-center', accents.text)}>{totals.par}</td>
              {phase === 'scheduled' && (
                <td className={cn('px-3 py-2.5 text-center text-xs', accents.text)}>
                  {avgTotal.toFixed(1)}
                </td>
              )}
              <td className={cn('px-3 py-2.5 text-center', accents.text)}>
                {phase === 'scheduled' ? projTotal : totals.score}
              </td>
              {(phase === 'completed' || phase === 'live') && (
                <td className={cn('px-3 py-2.5 text-center text-xs', accents.text)}>
                  {totals.dkPoints.toFixed(1)}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
