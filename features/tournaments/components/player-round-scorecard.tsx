'use client'

import { useMemo } from 'react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { Info } from 'lucide-react'

interface PlayerRoundScorecardProps {
  data: PlayerRoundScorecardData
  isLoading?: boolean
}

/**
 * Premium dark-themed scorecard with 18-hole horizontal grid layout.
 * Features round selector, scoring markers, and responsive scrolling.
 */
export function PlayerRoundScorecard({ data, isLoading }: PlayerRoundScorecardProps) {
  // Ensure exactly 18 holes
  const allHoles = useMemo(() => {
    const holes = [...data.holes]
    while (holes.length < 18) {
      holes.push({
        holeNumber: holes.length + 1,
        score: null,
        par: null,
        toPar: null,
        dkPoints: null,
      })
    }
    return holes.slice(0, 18)
  }, [data.holes])

  // Calculate totals
  const outTotal = useMemo(() => {
    const strokes = allHoles.slice(0, 9).reduce((sum, h) => sum + (h.score || 0), 0)
    const toPar = allHoles.slice(0, 9).reduce((sum, h) => sum + (h.toPar || 0), 0)
    const dkPoints = allHoles.slice(0, 9).reduce((sum, h) => sum + (h.dkPoints || 0), 0)
    return { strokes, toPar, dkPoints }
  }, [allHoles])

  const inTotal = useMemo(() => {
    const strokes = allHoles.slice(9, 18).reduce((sum, h) => sum + (h.score || 0), 0)
    const toPar = allHoles.slice(9, 18).reduce((sum, h) => sum + (h.toPar || 0), 0)
    const dkPoints = allHoles.slice(9, 18).reduce((sum, h) => sum + (h.dkPoints || 0), 0)
    return { strokes, toPar, dkPoints }
  }, [allHoles])

  const totTotal = useMemo(() => {
    return {
      strokes: outTotal.strokes + inTotal.strokes,
      toPar: outTotal.toPar + inTotal.toPar,
      dkPoints: outTotal.dkPoints + inTotal.dkPoints,
    }
  }, [outTotal, inTotal])

  return (
    <div className={`bg-black/80 rounded-lg border border-slate-800 ${isLoading ? 'opacity-60' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10">
          <div className="text-sm text-slate-400">Loading scorecard…</div>
        </div>
      )}

      {/* Header: Round selector + Info icon + Divider */}
      <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-semibold text-white">Round {data.roundNumber}</div>
        <button className="p-1 hover:bg-slate-700/50 rounded transition-colors" title="Scorecard info">
          <Info className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Scrollable scorecard grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max p-6">
          {/* Single continuous row: HOLE | 1-9 | OUT | 10-18 | IN | TOT */}
          <ScorecardGrid
            holes={allHoles}
            courseHoles={data.courseHoles}
            outTotal={outTotal}
            inTotal={inTotal}
            totTotal={totTotal}
          />
        </div>
      </div>
    </div>
  )
}

interface ScorecardGridProps {
  holes: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  courseHoles?: Array<{ holeNumber: number; par: number | null }>
  outTotal: { strokes: number; toPar: number; dkPoints: number }
  inTotal: { strokes: number; toPar: number; dkPoints: number }
  totTotal: { strokes: number; toPar: number; dkPoints: number }
}

function ScorecardGrid({
  holes,
  courseHoles,
  outTotal,
  inTotal,
  totTotal,
}: ScorecardGridProps) {
  const formatToPar = (value: number) => {
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  const getToParColor = (value: number | null) => {
    if (value === null) return 'text-slate-500'
    if (value < 0) return 'text-emerald-400'
    if (value === 0) return 'text-slate-300'
    return 'text-rose-400'
  }

  const getScoringMarker = (score: number | null, par: number | null) => {
    if (score === null || par === null) return null
    const diff = score - par
    if (diff <= -2) return '⊙⊙' // Eagle or better
    if (diff === -1) return '⊙' // Birdie
    if (diff === 1) return '◻' // Bogey
    if (diff >= 2) return '◻◻' // Double bogey or worse
    return null
  }

  // Calculate par totals
  const parOut = courseHoles ? courseHoles.slice(0, 9).reduce((sum, h) => sum + (h.par || 0), 0) : 0
  const parIn = courseHoles ? courseHoles.slice(9, 18).reduce((sum, h) => sum + (h.par || 0), 0) : 0
  const parTot = parOut + parIn

  return (
    <div className="space-y-px">
      {/* HOLE row */}
      <div className="flex gap-px bg-slate-900">
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-500 bg-slate-950 border-r border-slate-700/50">
          HOLE
        </div>
        {holes.map((hole, i) => (
          <div
            key={`hole-${hole.holeNumber}`}
            className={`w-10 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-900 border-r border-slate-700/50 ${
              i === 8 || i === 17 ? 'bg-slate-800' : ''
            }`}
          >
            {hole.holeNumber}
          </div>
        ))}
        {/* OUT, IN, TOT */}
        {[
          { label: 'OUT', width: 'w-12' },
          { label: 'IN', width: 'w-12' },
          { label: 'TOT', width: 'w-12' },
        ].map((col) => (
          <div
            key={col.label}
            className={`${col.width} flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70 border-r border-slate-700/50`}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* PAR row */}
      <div className="flex gap-px bg-slate-900">
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-500 bg-slate-950 border-r border-slate-700/50">
          PAR
        </div>
        {courseHoles
          ? courseHoles.map((ch, i) => (
              <div
                key={`par-${ch.holeNumber}`}
                className={`w-10 flex items-center justify-center text-xs text-slate-400 bg-slate-900 border-r border-slate-700/50 ${
                  i === 8 || i === 17 ? 'bg-slate-800' : ''
                }`}
              >
                {ch.par !== null ? ch.par : '—'}
              </div>
            ))
          : holes.map((hole, i) => (
              <div
                key={`par-${hole.holeNumber}`}
                className={`w-10 flex items-center justify-center text-xs text-slate-400 bg-slate-900 border-r border-slate-700/50 ${
                  i === 8 || i === 17 ? 'bg-slate-800' : ''
                }`}
              >
                {hole.par !== null ? hole.par : '—'}
              </div>
            ))}
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70 border-r border-slate-700/50">
          {parOut || '—'}
        </div>
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70 border-r border-slate-700/50">
          {parIn || '—'}
        </div>
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70">
          {parTot || '—'}
        </div>
      </div>

      {/* SCORE row */}
      <div className="flex gap-px bg-slate-900">
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-500 bg-slate-950 border-r border-slate-700/50">
          SCORE
        </div>
        {holes.map((hole, i) => (
          <div
            key={`score-${hole.holeNumber}`}
            className={`w-10 flex flex-col items-center justify-center text-xs font-bold text-white bg-slate-900 border-r border-slate-700/50 ${
              i === 8 || i === 17 ? 'bg-slate-800' : ''
            }`}
          >
            <span>{hole.score || '—'}</span>
            {hole.score && hole.par && (
              <span className="text-xs text-slate-400 leading-none">{getScoringMarker(hole.score, hole.par)}</span>
            )}
          </div>
        ))}
        <div className="w-12 flex items-center justify-center text-xs font-bold text-white bg-slate-800/70 border-r border-slate-700/50">
          {outTotal.strokes || '—'}
        </div>
        <div className="w-12 flex items-center justify-center text-xs font-bold text-white bg-slate-800/70 border-r border-slate-700/50">
          {inTotal.strokes || '—'}
        </div>
        <div className="w-12 flex items-center justify-center text-xs font-bold text-white bg-slate-800/70">
          {totTotal.strokes || '—'}
        </div>
      </div>

      {/* STATUS row */}
      <div className="flex gap-px bg-slate-900">
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-500 bg-slate-950 border-r border-slate-700/50">
          STATUS
        </div>
        {holes.map((hole, i) => (
          <div
            key={`status-${hole.holeNumber}`}
            className={`w-10 flex items-center justify-center text-xs font-semibold ${getToParColor(hole.toPar)} bg-slate-900 border-r border-slate-700/50 ${
              i === 8 || i === 17 ? 'bg-slate-800' : ''
            }`}
          >
            {hole.toPar !== null ? formatToPar(hole.toPar) : '—'}
          </div>
        ))}
        <div className={`w-12 flex items-center justify-center text-xs font-semibold ${getToParColor(outTotal.toPar)} bg-slate-800/70 border-r border-slate-700/50`}>
          {formatToPar(outTotal.toPar)}
        </div>
        <div className={`w-12 flex items-center justify-center text-xs font-semibold ${getToParColor(inTotal.toPar)} bg-slate-800/70 border-r border-slate-700/50`}>
          {formatToPar(inTotal.toPar)}
        </div>
        <div className={`w-12 flex items-center justify-center text-xs font-semibold ${getToParColor(totTotal.toPar)} bg-slate-800/70`}>
          {formatToPar(totTotal.toPar)}
        </div>
      </div>

      {/* DK PTS row */}
      <div className="flex gap-px bg-slate-900">
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-500 bg-slate-950 border-r border-slate-700/50">
          DK PTS
        </div>
        {holes.map((hole, i) => (
          <div
            key={`dk-${hole.holeNumber}`}
            className={`w-10 flex items-center justify-center text-xs text-slate-500 bg-slate-900 border-r border-slate-700/50 ${
              i === 8 || i === 17 ? 'bg-slate-800' : ''
            }`}
          >
            {hole.dkPoints !== null ? hole.dkPoints.toFixed(1) : '—'}
          </div>
        ))}
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70 border-r border-slate-700/50">
          {outTotal.dkPoints.toFixed(1)}
        </div>
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70 border-r border-slate-700/50">
          {inTotal.dkPoints.toFixed(1)}
        </div>
        <div className="w-12 flex items-center justify-center text-xs font-semibold text-slate-300 bg-slate-800/70">
          {totTotal.dkPoints.toFixed(1)}
        </div>
      </div>
    </div>
  )
}


