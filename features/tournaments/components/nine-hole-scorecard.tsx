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

// TODO: Remove once real hole-by-hole data is connected.
// Deterministic mock data so the scorecard renders with realistic numbers.
const MOCK_PARS = [4, 5, 3, 4, 4, 3, 5, 4, 4]
const MOCK_SCORE_DELTAS: Record<'FRONT 9' | 'BACK 9', number[]> = {
  'FRONT 9': [-1, 0, 0, 1, -1, 0, -1, 0, 1],
  'BACK 9': [0, -1, 1, 0, 0, -1, 0, 1, -1],
}

function buildMockHoles(label: 'FRONT 9' | 'BACK 9'): Hole[] {
  const startHole = label === 'FRONT 9' ? 1 : 10
  const deltas = MOCK_SCORE_DELTAS[label]
  return MOCK_PARS.map((par, i) => {
    const delta = deltas[i]
    const score = par + delta
    // Simple mock DK points: birdies/eagles score higher, bogeys lower.
    const dkPoints = 3 + delta * -1.5 + (par === 5 ? 0.5 : 0)
    return {
      holeNumber: startHole + i,
      score,
      par,
      toPar: delta,
      dkPoints: Math.max(0, Number(dkPoints.toFixed(1))),
    }
  })
}

function mockTotals(mockHoles: Hole[]): { strokes: number; toPar: number; dkPoints: number } {
  return {
    strokes: mockHoles.reduce((sum, h) => sum + (h.score ?? 0), 0),
    toPar: mockHoles.reduce((sum, h) => sum + (h.toPar ?? 0), 0),
    dkPoints: Number(mockHoles.reduce((sum, h) => sum + (h.dkPoints ?? 0), 0).toFixed(1)),
  }
}

export function NineHoleScorecard({
  label,
  holes,
  courseHoles,
  total,
  totTotal,
  isDesktop = true,
}: NineHoleScorecardProps) {
  const isFront = label === 'FRONT 9'
  const realHasData = holes.some((h) => h.score !== null)

  // TODO: Remove mock fallback once real hole-by-hole data is connected.
  const usingMock = !realHasData
  const displayHoles = usingMock ? buildMockHoles(label) : holes
  const displayTotal = usingMock ? mockTotals(displayHoles) : total
  const displayTotTotal = usingMock
    ? (() => {
        const front = mockTotals(buildMockHoles('FRONT 9'))
        const back = mockTotals(buildMockHoles('BACK 9'))
        return {
          strokes: front.strokes + back.strokes,
          toPar: front.toPar + back.toPar,
          dkPoints: Number((front.dkPoints + back.dkPoints).toFixed(1)),
        }
      })()
    : totTotal

  const showTotals = label === 'BACK 9' && Boolean(displayTotTotal)
  const hasData = true

  const displayCourseHoles =
    usingMock || !courseHoles || courseHoles.length === 0
      ? displayHoles.map((h) => ({ holeNumber: h.holeNumber, par: h.par }))
      : courseHoles

  const parSum =
    displayCourseHoles && displayCourseHoles.length > 0
      ? displayCourseHoles.reduce((sum, h) => sum + (h.par || 0), 0)
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
            <div className={cn('text-lg font-semibold tabular-nums', toParColor(displayTotal.toPar))}>
              {formatToPar(displayTotal.toPar)}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {isFront ? 'Out' : 'In'} {displayTotal.strokes !== 0 ? displayTotal.strokes : '—'}
            </div>
          </div>
        </div>

        {hasData ? (
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* HOLE header row */}
              <div className="grid border-b border-white/[0.055]" style={rowStyle}>
                <div className={cn(labelCell, 'py-2.5')}>Hole</div>
                {displayHoles.map((hole) => (
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
                {displayCourseHoles.map((h) => (
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
                {displayHoles.map((hole) => (
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
                  {displayTotal.strokes !== 0 ? displayTotal.strokes : '—'}
                </div>
                {showTotals && displayTotTotal && (
                  <div className={cn(totalCell, 'py-3 text-sm text-white')}>
                    {displayTotTotal.strokes !== 0 ? displayTotTotal.strokes : '—'}
                  </div>
                )}
              </div>

              {/* DK PTS row */}
              <div className="grid" style={rowStyle}>
                <div className={cn(labelCell, 'gap-1 py-2.5')}>
                  <DraftKingsMark className="h-3 w-auto" />
                  <span>Pts</span>
                </div>
                {displayHoles.map((hole) => (
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
                  {displayTotal.dkPoints != null && Number.isFinite(displayTotal.dkPoints)
                    ? displayTotal.dkPoints.toFixed(1)
                    : '—'}
                </div>
                {showTotals && displayTotTotal && (
                  <div className={cn(totalCell, 'py-2.5 text-xs text-white/90')}>
                    {displayTotTotal.dkPoints != null && Number.isFinite(displayTotTotal.dkPoints)
                      ? displayTotTotal.dkPoints.toFixed(1)
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
