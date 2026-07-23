'use client'

import { ScoreMarker } from './score-marker'

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

export function NineHoleScorecard({
  label,
  holes,
  courseHoles,
  total,
  totTotal,
  isDesktop = true,
}: NineHoleScorecardProps) {
  const formatToPar = (value: number) => {
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  const getStatusColor = (value: number | null) => {
    if (value === null) return 'text-white'
    if (value < 0) return 'text-[#22C55E]'
    if (value === 0) return 'text-white'
    return 'text-[#EF4444]'
  }

  const showTotals = label === 'BACK 9' && totTotal

  return (
    <div className="border border-[#343944] rounded overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#1a1f26] px-4 py-2 border-b border-[#343944]">
        <div className="text-xs font-semibold text-[#9EA5B1] uppercase">{label}</div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-center text-sm">
          <thead>
            <tr className="border-b border-[#343944] bg-[#151922]">
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#9EA5B1] w-12">
                {label === 'FRONT 9' ? 'HOLE' : 'HOLE'}
              </th>
              {holes.map((hole) => (
                <th key={`hole-${hole.holeNumber}`} className="px-2 py-2 text-xs font-semibold text-white w-10 min-w-10">
                  {hole.holeNumber}
                </th>
              ))}
              <th className="px-2 py-2 text-xs font-semibold text-white w-10 min-w-10 bg-[#1a1f26]">
                {label === 'FRONT 9' ? 'OUT' : 'IN'}
              </th>
              {showTotals && (
                <th className="px-2 py-2 text-xs font-semibold text-white w-10 min-w-10 bg-[#1a1f26]">
                  TOT
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#343944]">
            {/* PAR Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className="px-3 py-2 text-left text-xs font-semibold text-[#9EA5B1]">
                PAR
              </td>
              {courseHoles && courseHoles.length > 0
                ? courseHoles.map((ch) => (
                    <td key={`par-${ch.holeNumber}`} className="px-2 py-2 text-white font-mono">
                      {ch.par !== null ? ch.par : '—'}
                    </td>
                  ))
                : holes.map((hole) => (
                    <td key={`par-${hole.holeNumber}`} className="px-2 py-2 text-white font-mono">
                      {hole.par !== null ? hole.par : '—'}
                    </td>
                  ))}
              <td className="px-2 py-2 text-white font-mono font-semibold bg-[#1a1f26]">
                {courseHoles?.reduce((sum, h) => sum + (h.par || 0), 0) || '—'}
              </td>
              {showTotals && (
                <td className="px-2 py-2 text-white font-mono font-semibold bg-[#1a1f26]">
                  {courseHoles?.reduce((sum, h) => sum + (h.par || 0), 0) || '—'}
                </td>
              )}
            </tr>

            {/* SCORE Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className="px-3 py-2 text-left text-xs font-semibold text-[#9EA5B1]">
                SCORE
              </td>
              {holes.map((hole) => (
                <td key={`score-${hole.holeNumber}`} className="px-2 py-2 text-white font-mono font-bold text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>{hole.score !== null ? hole.score : '—'}</span>
                    {hole.score && hole.par && (
                      <ScoreMarker score={hole.score} par={hole.par} />
                    )}
                  </div>
                </td>
              ))}
              <td className="px-2 py-2 text-white font-mono font-bold bg-[#1a1f26] text-center">
                {total.strokes !== 0 ? total.strokes : '—'}
              </td>
              {showTotals && (
                <td className="px-2 py-2 text-white font-mono font-bold bg-[#1a1f26] text-center">
                  {totTotal.strokes !== 0 ? totTotal.strokes : '—'}
                </td>
              )}
            </tr>

            {/* STATUS Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className="px-3 py-2 text-left text-xs font-semibold text-[#9EA5B1]">
                STATUS
              </td>
              {holes.map((hole) => (
                <td
                  key={`status-${hole.holeNumber}`}
                  className={`px-2 py-2 text-sm font-mono font-semibold ${getStatusColor(
                    hole.toPar
                  )}`}
                >
                  {hole.toPar !== null ? formatToPar(hole.toPar) : '—'}
                </td>
              ))}
              <td
                className={`px-2 py-2 text-sm font-mono font-semibold bg-[#1a1f26] ${getStatusColor(
                  total.toPar
                )}`}
              >
                {formatToPar(total.toPar)}
              </td>
              {showTotals && (
                <td
                  className={`px-2 py-2 text-sm font-mono font-semibold bg-[#1a1f26] ${getStatusColor(
                    totTotal.toPar
                  )}`}
                >
                  {formatToPar(totTotal.toPar)}
                </td>
              )}
            </tr>

            {/* DK PTS Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className="px-3 py-2 text-left text-xs font-semibold text-[#9EA5B1]">
                DK PTS
              </td>
              {holes.map((hole) => (
                <td key={`dk-${hole.holeNumber}`} className="px-2 py-2 text-[#9EA5B1] font-mono text-sm">
                  {hole.dkPoints !== null && Number.isFinite(hole.dkPoints) ? hole.dkPoints.toFixed(1) : '—'}
                </td>
              ))}
              <td className="px-2 py-2 text-[#9EA5B1] font-mono text-sm font-semibold bg-[#1a1f26]">
                {total.dkPoints != null && Number.isFinite(total.dkPoints) ? total.dkPoints.toFixed(1) : '—'}
              </td>
              {showTotals && (
                <td className="px-2 py-2 text-[#9EA5B1] font-mono text-sm font-semibold bg-[#1a1f26]">
                  {totTotal && totTotal.dkPoints != null && Number.isFinite(totTotal.dkPoints) ? totTotal.dkPoints.toFixed(1) : '—'}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
