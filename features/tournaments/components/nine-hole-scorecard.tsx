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

  const cellClassMobile = 'px-1 py-1 text-[11px]'
  const cellClassTablet = 'px-1.5 py-1.5 sm:text-xs'
  const cellClassDesktop = 'px-2 py-2 text-sm'
  const labelClassMobile = 'px-1 py-1 text-[10px]'
  const labelClassDesktop = 'px-3 py-2 text-xs'

  return (
    <div className="border border-[#343944] rounded overflow-hidden min-w-0 w-full">
      {/* Section Header */}
      <div className="bg-[#1a1f26] border-b border-[#343944]">
        <div className={`font-semibold text-[#9EA5B1] uppercase ${isDesktop ? labelClassDesktop : labelClassMobile}`}>
          {label}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-center tabular-nums">
          <thead>
            <tr className="border-b border-[#343944] bg-[#151922]">
              <th className={`text-left font-semibold text-[#9EA5B1] ${isDesktop ? 'w-12 px-3 py-2 text-xs' : 'w-10 px-1 py-1 text-[10px]'}`}>
                {'HOLE'}
              </th>
              {holes.map((hole) => (
                <th key={`hole-${hole.holeNumber}`} className={`font-semibold text-white flex-shrink-0 ${isDesktop ? 'w-10 px-2 py-2 text-xs' : 'w-8 px-1 py-1 text-[11px]'}`}>
                  {hole.holeNumber}
                </th>
              ))}
              <th className={`font-semibold text-white flex-shrink-0 bg-[#1a1f26] ${isDesktop ? 'w-10 px-2 py-2 text-xs' : 'w-8 px-1 py-1 text-[11px]'}`}>
                {label === 'FRONT 9' ? 'OUT' : 'IN'}
              </th>
              {showTotals && (
                <th className={`font-semibold text-white flex-shrink-0 bg-[#1a1f26] ${isDesktop ? 'w-10 px-2 py-2 text-xs' : 'w-8 px-1 py-1 text-[11px]'}`}>
                  TOT
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#343944]">
            {/* PAR Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className={`text-left font-semibold text-[#9EA5B1] ${isDesktop ? 'px-3 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
                PAR
              </td>
              {courseHoles && courseHoles.length > 0
                ? courseHoles.map((ch) => (
                    <td key={`par-${ch.holeNumber}`} className={`text-white font-mono flex-shrink-0 text-center ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                      {ch.par !== null ? ch.par : '—'}
                    </td>
                  ))
                : holes.map((hole) => (
                    <td key={`par-${hole.holeNumber}`} className={`text-white font-mono flex-shrink-0 text-center ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                      {hole.par !== null ? hole.par : '—'}
                    </td>
                  ))}
              <td className={`text-white font-mono font-semibold bg-[#1a1f26] text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                {courseHoles?.reduce((sum, h) => sum + (h.par || 0), 0) || '—'}
              </td>
              {showTotals && (
                <td className={`text-white font-mono font-semibold bg-[#1a1f26] text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                  {courseHoles?.reduce((sum, h) => sum + (h.par || 0), 0) || '—'}
                </td>
              )}
            </tr>

            {/* SCORE Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className={`text-left font-semibold text-[#9EA5B1] ${isDesktop ? 'px-3 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
                SCORE
              </td>
              {holes.map((hole) => (
                <td key={`score-${hole.holeNumber}`} className={`text-white font-mono font-bold text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                  <div className={`flex flex-col items-center ${isDesktop ? 'gap-1' : 'gap-0.5'}`}>
                    <span>{hole.score !== null ? hole.score : '—'}</span>
                    {hole.score && hole.par && (
                      <ScoreMarker score={hole.score} par={hole.par} />
                    )}
                  </div>
                </td>
              ))}
              <td className={`text-white font-mono font-bold bg-[#1a1f26] text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                {total.strokes !== 0 ? total.strokes : '—'}
              </td>
              {showTotals && (
                <td className={`text-white font-mono font-bold bg-[#1a1f26] text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                  {totTotal.strokes !== 0 ? totTotal.strokes : '—'}
                </td>
              )}
            </tr>

            {/* STATUS Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className={`text-left font-semibold text-[#9EA5B1] ${isDesktop ? 'px-3 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
                STATUS
              </td>
              {holes.map((hole) => (
                <td
                  key={`status-${hole.holeNumber}`}
                  className={`font-mono font-semibold text-center flex-shrink-0 ${getStatusColor(hole.toPar)} ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}
                >
                  {hole.toPar !== null ? formatToPar(hole.toPar) : '—'}
                </td>
              ))}
              <td
                className={`font-mono font-semibold bg-[#1a1f26] text-center flex-shrink-0 ${getStatusColor(total.toPar)} ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}
              >
                {formatToPar(total.toPar)}
              </td>
              {showTotals && (
                <td
                  className={`font-mono font-semibold bg-[#1a1f26] text-center flex-shrink-0 ${getStatusColor(totTotal.toPar)} ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}
                >
                  {formatToPar(totTotal.toPar)}
                </td>
              )}
            </tr>

            {/* DK PTS Row */}
            <tr className="hover:bg-[#0F1117] transition-colors">
              <td className={`text-left font-semibold text-[#9EA5B1] ${isDesktop ? 'px-3 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
                DK PTS
              </td>
              {holes.map((hole) => (
                <td key={`dk-${hole.holeNumber}`} className={`text-[#9EA5B1] font-mono text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                  {hole.dkPoints !== null && Number.isFinite(hole.dkPoints) ? hole.dkPoints.toFixed(1) : '—'}
                </td>
              ))}
              <td className={`text-[#9EA5B1] font-mono font-semibold bg-[#1a1f26] text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
                {total.dkPoints != null && Number.isFinite(total.dkPoints) ? total.dkPoints.toFixed(1) : '—'}
              </td>
              {showTotals && (
                <td className={`text-[#9EA5B1] font-mono font-semibold bg-[#1a1f26] text-center flex-shrink-0 ${isDesktop ? 'px-2 py-2 text-sm' : 'px-1 py-1 text-xs'}`}>
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
