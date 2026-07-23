'use client'

import { useMemo } from 'react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { Info } from 'lucide-react'
import { DraftKingsMark } from './draftkings-mark'

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
    <div className={`bg-[#111318] border border-[#343944] rounded-2xl overflow-hidden ${isLoading ? 'opacity-60' : ''}`} style={{ padding: '32px' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
          <div className="text-sm text-slate-400">Loading scorecard…</div>
        </div>
      )}

      {/* Header: Round selector + Info icon + Divider */}
      <div className="flex items-start justify-between mb-6">
        <div className="text-[52px] font-bold text-white leading-none" style={{ letterSpacing: '-0.02em' }}>
          Round {data.roundNumber}
        </div>
        <button className="w-10 h-10 rounded-full border border-[#5a6370] bg-[#1a1f26] hover:bg-[#222836] transition-colors flex items-center justify-center flex-shrink-0" title="Scorecard info">
          <Info className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#343944] mb-6"></div>

      {/* Scrollable scorecard grid */}
      <div className="overflow-x-auto -mx-8 px-8" style={{ marginBottom: '-32px', paddingBottom: '32px' }}>
        <div className="min-w-max">
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

  const getStatusTextColor = (value: number | null) => {
    if (value === null) return 'text-white'
    if (value < 0) return 'text-[#22C55E]' // Green for under par
    if (value === 0) return 'text-white'
    return 'text-[#EF4444]' // Red for over par
  }

  const getScoringBadgeType = (score: number | null, par: number | null) => {
    if (score === null || par === null) return null
    const diff = score - par
    if (diff <= -2) return 'eagle' // Eagle or better
    if (diff === -1) return 'birdie' // Birdie
    if (diff === 1) return 'bogey' // Bogey
    if (diff >= 2) return 'double' // Double bogey or worse
    return null
  }

  // Calculate par totals
  const parOut = courseHoles ? courseHoles.slice(0, 9).reduce((sum, h) => sum + (h.par || 0), 0) : 0
  const parIn = courseHoles ? courseHoles.slice(9, 18).reduce((sum, h) => sum + (h.par || 0), 0) : 0
  const parTot = parOut + parIn

  return (
    <div className="space-y-0">
      {/* HOLE row */}
      <div className="flex gap-0">
        <div className="w-16 flex items-center justify-center text-lg font-medium text-[#9EA5B1] bg-[#1a1f26] border-b border-[#2a3038]" style={{ height: '56px' }}>
          HOLE
        </div>
        {holes.map((hole, i) => (
          <div
            key={`hole-${hole.holeNumber}`}
            className={`w-12 flex items-center justify-center text-lg font-semibold text-white border-b ${
              i === 17 ? 'bg-[#0a0d11]' : 'bg-[#151922]'
            }`}
            style={{ borderColor: '#2a3038', height: '56px' }}
          >
            {hole.holeNumber}
          </div>
        ))}
        {/* OUT, IN, TOT */}
        {[
          { label: 'OUT' },
          { label: 'IN' },
          { label: 'TOT' },
        ].map((col) => (
          <div
            key={col.label}
            className="w-14 flex items-center justify-center text-lg font-semibold text-white bg-[#1a1f26] border-b"
            style={{ borderColor: '#2a3038', height: '56px' }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* PAR row */}
      <div className="flex gap-0">
        <div className="w-16 flex items-center justify-center text-lg font-medium text-[#9EA5B1] bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          PAR
        </div>
        {courseHoles
          ? courseHoles.map((ch, i) => (
              <div
                key={`par-${ch.holeNumber}`}
                className={`w-12 flex items-center justify-center text-lg font-semibold text-white border-b ${
                  i === 17 ? 'bg-[#0a0d11]' : 'bg-[#151922]'
                }`}
                style={{ borderColor: '#2a3038', height: '56px' }}
              >
                {ch.par !== null ? ch.par : '—'}
              </div>
            ))
          : holes.map((hole, i) => (
              <div
                key={`par-${hole.holeNumber}`}
                className={`w-12 flex items-center justify-center text-lg font-semibold text-white border-b ${
                  i === 17 ? 'bg-[#0a0d11]' : 'bg-[#151922]'
                }`}
                style={{ borderColor: '#2a3038', height: '56px' }}
              >
                {hole.par !== null ? hole.par : '—'}
              </div>
            ))}
        <div className="w-14 flex items-center justify-center text-lg font-semibold text-white bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          {parOut || '—'}
        </div>
        <div className="w-14 flex items-center justify-center text-lg font-semibold text-white bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          {parIn || '—'}
        </div>
        <div className="w-14 flex items-center justify-center text-lg font-semibold text-white bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          {parTot || '—'}
        </div>
      </div>

      {/* SCORE row */}
      <div className="flex gap-0">
        <div className="w-16 flex items-center justify-center text-lg font-medium text-[#9EA5B1] bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          SCORE
        </div>
        {holes.map((hole, i) => (
          <div
            key={`score-${hole.holeNumber}`}
            className={`w-12 flex flex-col items-center justify-center border-b ${
              i === 17 ? 'bg-[#0a0d11]' : 'bg-[#151922]'
            }`}
            style={{ borderColor: '#2a3038', height: '56px' }}
          >
            <span className="text-xl font-bold text-white">{hole.score || '—'}</span>
            {hole.score && hole.par && (
              <ScoringBadge score={hole.score} par={hole.par} />
            )}
          </div>
        ))}
        <div className="w-14 flex items-center justify-center text-xl font-bold text-white bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          {outTotal.strokes || '—'}
        </div>
        <div className="w-14 flex items-center justify-center text-xl font-bold text-white bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          {inTotal.strokes || '—'}
        </div>
        <div className="w-14 flex items-center justify-center text-xl font-bold text-white bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          {totTotal.strokes || '—'}
        </div>
      </div>

      {/* STATUS row */}
      <div className="flex gap-0">
        <div className="w-16 flex items-center justify-center text-lg font-medium text-[#9EA5B1] bg-[#1a1f26] border-b" style={{ borderColor: '#2a3038', height: '56px' }}>
          STATUS
        </div>
        {holes.map((hole, i) => (
          <div
            key={`status-${hole.holeNumber}`}
            className={`w-12 flex items-center justify-center text-lg font-semibold border-b ${getStatusTextColor(hole.toPar)} ${
              i === 17 ? 'bg-[#0a0d11]' : 'bg-[#151922]'
            }`}
            style={{ borderColor: '#2a3038', height: '56px' }}
          >
            {hole.toPar !== null ? formatToPar(hole.toPar) : '—'}
          </div>
        ))}
        <div className={`w-14 flex items-center justify-center text-lg font-semibold bg-[#1a1f26] border-b ${getStatusTextColor(outTotal.toPar)}`} style={{ borderColor: '#2a3038', height: '56px' }}>
          {formatToPar(outTotal.toPar)}
        </div>
        <div className={`w-14 flex items-center justify-center text-lg font-semibold bg-[#1a1f26] border-b ${getStatusTextColor(inTotal.toPar)}`} style={{ borderColor: '#2a3038', height: '56px' }}>
          {formatToPar(inTotal.toPar)}
        </div>
        <div className={`w-14 flex items-center justify-center text-lg font-semibold bg-[#1a1f26] border-b ${getStatusTextColor(totTotal.toPar)}`} style={{ borderColor: '#2a3038', height: '56px' }}>
          {formatToPar(totTotal.toPar)}
        </div>
      </div>

      {/* DK PTS row */}
      <div className="flex gap-0">
        <div className="w-16 flex items-center justify-center text-lg font-medium text-[#9EA5B1] bg-[#1a1f26] gap-1" style={{ height: '56px' }}>
          <DraftKingsMark className="h-4 w-auto" />
          <span>PTS</span>
        </div>
        {holes.map((hole, i) => (
          <div
            key={`dk-${hole.holeNumber}`}
            className={`w-12 flex items-center justify-center text-lg text-[#9EA5B1] font-semibold ${
              i === 17 ? 'bg-[#0a0d11]' : 'bg-[#151922]'
            }`}
            style={{ height: '56px' }}
          >
            {hole.dkPoints !== null && Number.isFinite(hole.dkPoints) ? hole.dkPoints.toFixed(1) : '—'}
          </div>
        ))}
        <div className="w-14 flex items-center justify-center text-lg font-semibold text-[#9EA5B1] bg-[#1a1f26]" style={{ height: '56px' }}>
          {outTotal.dkPoints != null && Number.isFinite(outTotal.dkPoints) ? outTotal.dkPoints.toFixed(1) : '—'}
        </div>
        <div className="w-14 flex items-center justify-center text-lg font-semibold text-[#9EA5B1] bg-[#1a1f26]" style={{ height: '56px' }}>
          {inTotal.dkPoints != null && Number.isFinite(inTotal.dkPoints) ? inTotal.dkPoints.toFixed(1) : '—'}
        </div>
        <div className="w-14 flex items-center justify-center text-lg font-semibold text-[#9EA5B1] bg-[#1a1f26]" style={{ height: '56px' }}>
          {totTotal.dkPoints != null && Number.isFinite(totTotal.dkPoints) ? totTotal.dkPoints.toFixed(1) : '—'}
        </div>
      </div>
    </div>
  )
}

interface ScoringBadgeProps {
  score: number
  par: number
}

function ScoringBadge({ score, par }: ScoringBadgeProps) {
  const diff = score - par
  
  if (diff <= -2) {
    // Eagle: Green outline circle
    return (
      <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
      </svg>
    )
  }
  
  if (diff === -1) {
    // Birdie: Blue outline circle
    return (
      <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
      </svg>
    )
  }
  
  if (diff === 1) {
    // Bogey: Gray outline square
    return (
      <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="1" />
      </svg>
    )
  }
  
  if (diff >= 2) {
    // Double bogey: Double square
    return (
      <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
        <rect x="3" y="3" width="8" height="8" rx="0.5" />
        <rect x="13" y="13" width="8" height="8" rx="0.5" />
      </svg>
    )
  }
  
  return null
}
