'use client'

import { ScoreMarker } from './score-marker'
import { DraftKingsMark } from './draftkings-mark'

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
  const showTotals = label === 'BACK 9' && totTotal

  const cellClassMobile = 'px-1 py-1 text-[11px]'
  const cellClassTablet = 'px-1.5 py-1.5 sm:text-xs'
  const cellClassDesktop = 'px-2 py-2 text-sm'
  const labelClassMobile = 'px-1 py-1 text-[10px]'
  const labelClassDesktop = 'px-3 py-2 text-xs'

  // Calculate grid columns: label + 9 holes + OUT/IN + (TOT if Back 9)
  // Use aggressive minmax to compress hole columns on narrow viewports
  const gridColsDesktop = showTotals
    ? 'minmax(48px,0.8fr) repeat(9,minmax(28px,1fr)) minmax(44px,0.8fr) minmax(44px,0.8fr)'
    : 'minmax(48px,0.8fr) repeat(9,minmax(28px,1fr)) minmax(44px,0.8fr)'
  
  const gridColsTablet = showTotals
    ? 'minmax(40px,0.7fr) repeat(9,minmax(24px,0.9fr)) minmax(36px,0.7fr) minmax(36px,0.7fr)'
    : 'minmax(40px,0.7fr) repeat(9,minmax(24px,0.9fr)) minmax(36px,0.7fr)'
  
  const gridColsMobile = showTotals
    ? 'minmax(36px,0.6fr) repeat(9,minmax(20px,0.8fr)) minmax(32px,0.6fr) minmax(32px,0.6fr)'
    : 'minmax(36px,0.6fr) repeat(9,minmax(20px,0.8fr)) minmax(32px,0.6fr)'

  return (
    <div className="border border-[#343944] rounded overflow-hidden min-w-0 w-full">
      {/* Section Header */}
      <div className="bg-[#1a1f26] border-b border-[#343944]">
        <div className={`font-semibold text-[#9EA5B1] uppercase ${isDesktop ? labelClassDesktop : labelClassMobile}`}>
          {label}
        </div>
      </div>

      {/* Grid Container - Allow horizontal scroll on mobile/tablet */}
      <div className="w-full min-w-0 overflow-x-auto">
        <div
          className="w-full grid border-b border-[#343944] bg-[#151922] @container/scorecard"
          style={{ gridTemplateColumns: isDesktop ? gridColsDesktop : gridColsMobile }}
        >
          {/* Header: HOLE */}
          <div className={`text-left font-semibold text-[#9EA5B1] min-w-0 ${isDesktop ? 'px-2 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
            HOLE
          </div>
          {/* Header: Hole Numbers */}
          {holes.map((hole) => (
            <div
              key={`hole-${hole.holeNumber}`}
              className={`font-semibold text-white min-w-0 text-center tabular-nums ${isDesktop ? 'px-1 py-2 text-xs' : 'px-0.5 py-1 text-[10px]'}`}
            >
              {hole.holeNumber}
            </div>
          ))}
          {/* Header: OUT/IN */}
          <div className={`font-semibold text-white min-w-0 text-center bg-[#1a1f26] tabular-nums ${isDesktop ? 'px-1 py-2 text-xs' : 'px-0.5 py-1 text-[10px]'}`}>
            {label === 'FRONT 9' ? 'OUT' : 'IN'}
          </div>
          {/* Header: TOT */}
          {showTotals && (
            <div className={`font-semibold text-white min-w-0 text-center bg-[#1a1f26] tabular-nums ${isDesktop ? 'px-1 py-2 text-xs' : 'px-0.5 py-1 text-[10px]'}`}>
              TOT
            </div>
          )}
        </div>
        {/* PAR Row */}
        <div
          className="w-full grid border-b border-[#343944] hover:bg-[#0F1117] transition-colors"
          style={{ gridTemplateColumns: isDesktop ? gridColsDesktop : gridColsTablet }}
        >
          <div className={`text-left font-semibold text-[#9EA5B1] min-w-0 ${isDesktop ? 'px-2 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
            PAR
          </div>
          {courseHoles && courseHoles.length > 0
            ? courseHoles.map((ch) => (
                <div
                  key={`par-${ch.holeNumber}`}
                  className={`text-white font-mono text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}
                >
                  {ch.par !== null ? ch.par : '—'}
                </div>
              ))
            : holes.map((hole) => (
                <div
                  key={`par-${hole.holeNumber}`}
                  className={`text-white font-mono text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}
                >
                  {hole.par !== null ? hole.par : '—'}
                </div>
              ))}
          <div className={`text-white font-mono font-semibold bg-[#1a1f26] text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}>
            {courseHoles?.reduce((sum, h) => sum + (h.par || 0), 0) || '—'}
          </div>
          {showTotals && (
            <div className={`text-white font-mono font-semibold bg-[#1a1f26] text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}>
              {courseHoles?.reduce((sum, h) => sum + (h.par || 0), 0) || '—'}
            </div>
          )}
        </div>

        {/* SCORE Row */}
        <div
          className="w-full grid border-b border-[#343944] hover:bg-[#0F1117] transition-colors"
          style={{ gridTemplateColumns: isDesktop ? gridColsDesktop : gridColsTablet }}
        >
          <div className={`text-left font-semibold text-[#9EA5B1] min-w-0 ${isDesktop ? 'px-2 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
            SCORE
          </div>
          {holes.map((hole) => (
            <div
              key={`score-${hole.holeNumber}`}
              className={`text-white font-mono font-bold text-center min-w-0 tabular-nums flex flex-col items-center justify-center ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}
            >
              <span>{hole.score !== null ? hole.score : '—'}</span>
              {hole.score && hole.par && (
                <div className={isDesktop ? 'mt-0.5' : 'mt-0.25'}>
                  <ScoreMarker score={hole.score} par={hole.par} />
                </div>
              )}
            </div>
          ))}
          <div className={`text-white font-mono font-bold bg-[#1a1f26] text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}>
            {total.strokes !== 0 ? total.strokes : '—'}
          </div>
          {showTotals && (
            <div className={`text-white font-mono font-bold bg-[#1a1f26] text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}>
              {totTotal.strokes !== 0 ? totTotal.strokes : '—'}
            </div>
          )}
        </div>



        {/* DK PTS Row */}
        <div
          className="w-full grid hover:bg-[#0F1117] transition-colors"
          style={{ gridTemplateColumns: isDesktop ? gridColsDesktop : gridColsTablet }}
        >
          <div className={`text-left font-semibold text-[#9EA5B1] min-w-0 flex items-center ${isDesktop ? 'px-2 py-2 text-xs' : 'px-1 py-1 text-[10px]'}`}>
            <DraftKingsMark className={isDesktop ? 'h-3 w-auto' : 'h-2.5 w-auto'} />
            <span className="ml-1">PTS</span>
          </div>
          {holes.map((hole) => (
            <div
              key={`dk-${hole.holeNumber}`}
              className={`text-[#9EA5B1] font-mono text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}
            >
              {hole.dkPoints !== null && Number.isFinite(hole.dkPoints) ? hole.dkPoints.toFixed(1) : '—'}
            </div>
          ))}
          <div className={`text-[#9EA5B1] font-mono font-semibold bg-[#1a1f26] text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}>
            {total.dkPoints != null && Number.isFinite(total.dkPoints) ? total.dkPoints.toFixed(1) : '—'}
          </div>
          {showTotals && (
            <div className={`text-[#9EA5B1] font-mono font-semibold bg-[#1a1f26] text-center min-w-0 tabular-nums ${isDesktop ? 'px-1 py-2 text-sm' : 'px-0.5 py-1 text-xs'}`}>
              {totTotal && totTotal.dkPoints != null && Number.isFinite(totTotal.dkPoints) ? totTotal.dkPoints.toFixed(1) : '—'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
