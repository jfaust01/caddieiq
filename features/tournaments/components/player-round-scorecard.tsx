'use client'

import { useMemo } from 'react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { ChevronDown } from 'lucide-react'

interface PlayerRoundScorecardProps {
  data: PlayerRoundScorecardData
  isLoading?: boolean
}

/**
 * Displays a hole-by-hole scorecard with PAR/SCORE/STATUS/DK points rows.
 * Renders an 18-hole grid with fixed-width columns and sticky row labels.
 * No nested buttons or complex interactions — pure data display.
 */
export function PlayerRoundScorecard({ data, isLoading }: PlayerRoundScorecardProps) {
  // Organize holes into front 9 and back 9
  const frontNine = useMemo(() => data.holes.slice(0, 9), [data.holes])
  const backNine = useMemo(() => data.holes.slice(9, 18), [data.holes])

  // Calculate front/back subtotals
  const frontTotal = useMemo(() => {
    const strokes = frontNine.reduce((sum, hole) => sum + (hole.score || 0), 0)
    const toPar = frontNine.reduce((sum, hole) => sum + (hole.toPar || 0), 0)
    const dkPoints = frontNine.reduce((sum, hole) => sum + (hole.dkPoints || 0), 0)
    return { strokes, toPar, dkPoints }
  }, [frontNine])

  const backTotal = useMemo(() => {
    const strokes = backNine.reduce((sum, hole) => sum + (hole.score || 0), 0)
    const toPar = backNine.reduce((sum, hole) => sum + (hole.toPar || 0), 0)
    const dkPoints = backNine.reduce((sum, hole) => sum + (hole.dkPoints || 0), 0)
    return { strokes, toPar, dkPoints }
  }, [backNine])

  const formatToPar = (value: number | null) => {
    if (value === null) return '—'
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  const getToParColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground'
    if (value < 0) return 'text-green-600 dark:text-green-500'
    if (value === 0) return 'text-muted-foreground'
    return 'text-red-600 dark:text-red-500'
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading scorecard...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header with player name and round info */}
      <div className="border-b border-border pb-4">
        <h3 className="font-semibold text-base">{data.playerName}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Round {data.roundNumber} • {data.totalStrokes || '—'} strokes •{' '}
          <span className={getToParColor(data.totalToPar)}>
            {formatToPar(data.totalToPar)}
          </span>
        </p>
      </div>

      {/* Front 9 */}
      <ScorecardSection title="Front 9" holes={frontNine} totals={frontTotal} />

      {/* Back 9 */}
      <ScorecardSection title="Back 9" holes={backNine} totals={backTotal} />

      {/* Tournament Total */}
      <div className="border-t border-border pt-4 mt-4">
        <div className="grid grid-cols-11 gap-1 text-xs">
          {/* Row label */}
          <div className="font-semibold text-muted-foreground">TOTAL</div>

          {/* Hole number headers (empty for total row) */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}
        </div>

        {/* Strokes row */}
        <div className="grid grid-cols-11 gap-1 text-xs font-mono tabular-nums mt-2">
          <div className="font-semibold text-muted-foreground">Strokes</div>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`front-${i}`} className="text-right font-semibold">
              {frontNine[i]?.score || '—'}
            </div>
          ))}
          <div className="text-right font-semibold bg-muted/30 rounded px-1">
            {frontTotal.strokes || '—'}
          </div>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`back-${i}`} className="text-right font-semibold">
              {backNine[i]?.score || '—'}
            </div>
          ))}
          <div className="text-right font-semibold bg-muted/30 rounded px-1">
            {backTotal.strokes || '—'}
          </div>
        </div>

        {/* To Par row */}
        <div className="grid grid-cols-11 gap-1 text-xs font-mono tabular-nums mt-1">
          <div className="font-semibold text-muted-foreground">To Par</div>
          {frontNine.map((hole, i) => (
            <div key={`front-tp-${i}`} className={`text-right font-semibold ${getToParColor(hole.toPar)}`}>
              {formatToPar(hole.toPar)}
            </div>
          ))}
          <div className={`text-right font-semibold bg-muted/30 rounded px-1 ${getToParColor(frontTotal.toPar)}`}>
            {formatToPar(frontTotal.toPar)}
          </div>
          {backNine.map((hole, i) => (
            <div key={`back-tp-${i}`} className={`text-right font-semibold ${getToParColor(hole.toPar)}`}>
              {formatToPar(hole.toPar)}
            </div>
          ))}
          <div className={`text-right font-semibold bg-muted/30 rounded px-1 ${getToParColor(backTotal.toPar)}`}>
            {formatToPar(backTotal.toPar)}
          </div>
        </div>

        {/* DK Points row */}
        {data.totalDkPoints !== null && (
          <div className="grid grid-cols-11 gap-1 text-xs font-mono tabular-nums mt-1">
            <div className="font-semibold text-muted-foreground">DK Pts</div>
            {frontNine.map((hole, i) => (
              <div key={`front-dk-${i}`} className="text-right text-muted-foreground">
                {hole.dkPoints !== null ? hole.dkPoints.toFixed(1) : '—'}
              </div>
            ))}
            <div className="text-right bg-muted/30 rounded px-1 font-semibold">
              {frontTotal.dkPoints.toFixed(1)}
            </div>
            {backNine.map((hole, i) => (
              <div key={`back-dk-${i}`} className="text-right text-muted-foreground">
                {hole.dkPoints !== null ? hole.dkPoints.toFixed(1) : '—'}
              </div>
            ))}
            <div className="text-right bg-muted/30 rounded px-1 font-semibold">
              {backTotal.dkPoints.toFixed(1)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ScorecardSectionProps {
  title: string
  holes: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  totals: { strokes: number; toPar: number; dkPoints: number }
}

function ScorecardSection({ title, holes, totals }: ScorecardSectionProps) {
  const formatToPar = (value: number | null) => {
    if (value === null) return '—'
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  const getToParColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground'
    if (value < 0) return 'text-green-600 dark:text-green-500'
    if (value === 0) return 'text-muted-foreground'
    return 'text-red-600 dark:text-red-500'
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>

      {/* Hole number headers */}
      <div className="grid grid-cols-10 gap-1 text-xs">
        {holes.map((hole) => (
          <div key={`hole-${hole.holeNumber}`} className="text-center font-mono text-muted-foreground">
            {hole.holeNumber}
          </div>
        ))}
        <div className="text-center font-semibold text-xs">Total</div>
      </div>

      {/* Par row */}
      <div className="grid grid-cols-10 gap-1 text-xs font-mono tabular-nums">
        {holes.map((hole) => (
          <div key={`par-${hole.holeNumber}`} className="text-center text-muted-foreground">
            {hole.par || '—'}
          </div>
        ))}
        <div className="text-center font-semibold bg-muted/30 rounded py-0.5">
          {holes.reduce((sum, h) => sum + (h.par || 0), 0)}
        </div>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-10 gap-1 text-xs font-mono tabular-nums font-semibold">
        {holes.map((hole) => (
          <div key={`score-${hole.holeNumber}`} className="text-center">
            {hole.score || '—'}
          </div>
        ))}
        <div className="text-center bg-muted/30 rounded py-0.5">
          {totals.strokes || '—'}
        </div>
      </div>

      {/* To Par row */}
      <div className="grid grid-cols-10 gap-1 text-xs font-mono tabular-nums">
        {holes.map((hole) => (
          <div key={`topar-${hole.holeNumber}`} className={`text-center font-semibold ${getToParColor(hole.toPar)}`}>
            {formatToPar(hole.toPar)}
          </div>
        ))}
        <div className={`text-center font-semibold bg-muted/30 rounded py-0.5 ${getToParColor(totals.toPar)}`}>
          {formatToPar(totals.toPar)}
        </div>
      </div>

      {/* DK Points row */}
      {holes.some((h) => h.dkPoints !== null) && (
        <div className="grid grid-cols-10 gap-1 text-xs font-mono tabular-nums">
          {holes.map((hole) => (
            <div key={`dk-${hole.holeNumber}`} className="text-center text-muted-foreground">
              {hole.dkPoints !== null ? hole.dkPoints.toFixed(1) : '—'}
            </div>
          ))}
          <div className="text-center font-semibold bg-muted/30 rounded py-0.5">
            {totals.dkPoints.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  )
}
