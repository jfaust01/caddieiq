'use client'

import { ScoreMarker } from './score-marker'
import { DraftKingsMark } from './draftkings-mark'
import { cn } from '@/lib/utils'

interface Hole {
  holeNumber: number
  score: number | null
  par: number | null
  toPar: number | null
  dkPoints: number | null
}

interface NineHoleScorecardProps {
  label: 'FRONT 9' | 'BACK 9'
  holes: Hole[]
  courseHoles?: Array<{ holeNumber: number; par: number | null }>
  total: { strokes: number; toPar: number; dkPoints: number }
  totTotal?: { strokes: number; toPar: number; dkPoints: number }
  isDesktop?: boolean
}

function formatToPar(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  if (value === 0) return 'E'
  return value > 0 ? `+${value}` : `${value}`
}

function toParColor(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'text-muted-foreground'
  if (value < 0) return 'text-emerald-400'
  if (value > 0) return 'text-red-400'
  return 'text-white'
}

export function NineHoleScorecard({
  label,
  holes,
  courseHoles,
  total,
  totTotal,
  isDesktop = true,
}: NineHoleScorecardProps) {
  const showTotals = label === 'BACK 9' && Boolean(totTotal)
  const isFront = label === 'FRONT 9'
  const hasData = holes.some((h) => h.score !== null)

  const parSum =
    courseHoles && courseHoles.length > 0
      ? courseHoles.reduce((sum, h) => sum + (h.par || 0), 0)
      : null

  // Grid: row label + 9 holes + OUT/IN (+ TOT for Back 9)
  const gridCols = showTotals
    ? 'minmax(66px,0.9fr) repeat(9,minmax(30px,1fr)) minmax(48px,0.82fr) minmax(48px,0.82fr)'
    : 'minmax(66px,0.9fr) repeat(9,minmax(30px,1fr)) minmax(48px,0.82fr)'

  const rowStyle = { gridTemplateColumns: gridCols }

  const labelCell =
    'flex items-center bg-black/[0.14] px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'
  const dataCell = 'flex items-center justify-center px-1 text-center tabular-nums'
  const totalCell = 'flex items-center justify-center border-l border-white/[0.08] bg-white/[0.025] px-1 text-center font-semibold tabular-nums'

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#0d1318] shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_12px_30px_rgba(0,0,0,0.18)]">
      {/* Decorative top-right emerald glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/[0.055] blur-3xl"
      />
      {/* Top accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/55 to-transparent"
      />

      <div className="relative z-10">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
              {isFront ? 'Front 9' : 'Back 9'}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {isFront ? 'Holes 1–9' : 'Holes 10–18'}
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-lg font-semibold tabular-nums', hasData ? toParColor(total.toPar) : 'text-muted-foreground')}>
              {hasData ? formatToPar(total.toPar) : '—'}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {isFront ? 'Out' : 'In'} {hasData && total.strokes !== 0 ? total.strokes : '—'}
            </div>
          </div>
        </div>

        {hasData ? (
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* HOLE header row */}
              <div className="grid border-b border-white/[0.055]" style={rowStyle}>
                <div className={cn(labelCell, 'py-2.5')}>Hole</div>
                {holes.map((hole) => (
                  <div
                    key={`hole-${hole.holeNumber}`}
                    className={cn(dataCell, 'py-2.5 text-xs font-semibold text-white/85')}
                  >
                    {hole.holeNumber}
                  </div>
                ))}
                <div className={cn(totalCell, 'py-2.5 text-xs text-white/85')}>
                  {isFront ? 'OUT' : 'IN'}
                </div>
                {showTotals && (
                  <div className={cn(totalCell, 'py-2.5 text-xs text-white/85')}>TOT</div>
                )}
              </div>

              {/* PAR row */}
              <div className="grid border-b border-white/[0.055]" style={rowStyle}>
                <div className={cn(labelCell, 'py-2.5')}>Par</div>
                {(courseHoles && courseHoles.length > 0 ? courseHoles : holes).map((h) => (
                  <div
                    key={`par-${h.holeNumber}`}
                    className={cn(dataCell, 'py-2.5 text-xs text-muted-foreground')}
                  >
                    {h.par !== null ? h.par : '—'}
                  </div>
                ))}
                <div className={cn(totalCell, 'py-2.5 text-xs text-muted-foreground')}>
                  {parSum ?? '—'}
                </div>
                {showTotals && (
                  <div className={cn(totalCell, 'py-2.5 text-xs text-muted-foreground')}>
                    {parSum ?? '—'}
                  </div>
                )}
              </div>

              {/* SCORE row - visual focus */}
              <div className="grid border-b border-white/[0.055] bg-white/[0.02]" style={rowStyle}>
                <div className={cn(labelCell, 'py-3')}>Score</div>
                {holes.map((hole) => (
                  <div
                    key={`score-${hole.holeNumber}`}
                    className={cn(dataCell, 'flex-col gap-0.5 py-3 text-sm font-bold text-white')}
                  >
                    <span>{hole.score !== null ? hole.score : '—'}</span>
                    {hole.score !== null && hole.par !== null && (
                      <ScoreMarker score={hole.score} par={hole.par} />
                    )}
                  </div>
                ))}
                <div className={cn(totalCell, 'py-3 text-sm text-white')}>
                  {total.strokes !== 0 ? total.strokes : '—'}
                </div>
                {showTotals && totTotal && (
                  <div className={cn(totalCell, 'py-3 text-sm text-white')}>
                    {totTotal.strokes !== 0 ? totTotal.strokes : '—'}
                  </div>
                )}
              </div>

              {/* DK PTS row */}
              <div className="grid" style={rowStyle}>
                <div className={cn(labelCell, 'gap-1 py-2.5')}>
                  <DraftKingsMark className="h-3 w-auto" />
                  <span>Pts</span>
                </div>
                {holes.map((hole) => (
                  <div
                    key={`dk-${hole.holeNumber}`}
                    className={cn(dataCell, 'py-2.5 text-xs text-muted-foreground')}
                  >
                    {hole.dkPoints !== null && Number.isFinite(hole.dkPoints)
                      ? hole.dkPoints.toFixed(1)
                      : '—'}
                  </div>
                ))}
                <div className={cn(totalCell, 'py-2.5 text-xs text-white/90')}>
                  {total.dkPoints != null && Number.isFinite(total.dkPoints)
                    ? total.dkPoints.toFixed(1)
                    : '—'}
                </div>
                {showTotals && totTotal && (
                  <div className={cn(totalCell, 'py-2.5 text-xs text-white/90')}>
                    {totTotal.dkPoints != null && Number.isFinite(totTotal.dkPoints)
                      ? totTotal.dkPoints.toFixed(1)
                      : '—'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Compact empty state */
          <div className="px-5 py-8 text-center">
            <div className="text-sm font-medium text-white/80">
              Hole-by-hole scorecard data is not available for this round.
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              Round totals will appear when official scoring data is available.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
