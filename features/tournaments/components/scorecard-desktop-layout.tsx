'use client'

import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NineHoleScorecard } from './nine-hole-scorecard'
import { ScorecardLegend } from './scorecard-legend'
import { ScorecardRoundTabs } from './scorecard-round-tabs'
import { DraftKingsMark } from './draftkings-mark'
import { PlayerFlag } from './player-flag'
import { EnhancedRoundDnaCell } from './fantasy-table/enhanced-round-dna-cell'
import { cn } from '@/lib/utils'

interface DesktopScorecardLayoutProps {
  data: PlayerRoundScorecardData
  selectedRound: number
  onRoundChange: (round: number) => void
  frontNine: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  backNine: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  outTotal: { strokes: number; toPar: number; dkPoints: number }
  inTotal: { strokes: number; toPar: number; dkPoints: number }
  totTotal: { strokes: number; toPar: number; dkPoints: number }
  coursePar: number | null
}

export function ScorecardDesktopLayout({
  data,
  selectedRound,
  onRoundChange,
  frontNine,
  backNine,
  outTotal,
  inTotal,
  totTotal,
  coursePar,
}: DesktopScorecardLayoutProps) {
  const playerInitials = data.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const formatToParDisplay = (value: number | null) => {
    if (value === null) return '—'
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  const getToParColor = (value: number | null) => {
    if (value === null) return 'text-white'
    if (value < 0) return 'text-emerald-400'
    if (value === 0) return 'text-white'
    return 'text-red-500'
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-0">
      {/* Hero Header */}
      <div className="flex-shrink-0 border-b border-white/[0.07]">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] pb-8 pt-6">
          {/* LEFT: Player Identity */}
          <div className="flex min-w-0 items-center gap-6">
            <Avatar className="h-32 w-32 shrink-0 border border-white/[0.10]">
              <AvatarImage src={data.headshotUrl ?? undefined} alt={data.playerName} />
              <AvatarFallback className="text-lg font-bold">{playerInitials}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-3xl font-semibold tracking-tight text-white">
                  {data.playerName}
                </h2>
                <PlayerFlag countryCode={data.countryCode} className="h-5 w-5 flex-shrink-0" />
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="inline-block bg-blue-500/20 px-2 py-0.5 rounded text-xs font-medium text-blue-300">
                  PGA
                </span>
                <span className="font-medium text-foreground">
                  {data.tournamentName || 'Tournament'}
                </span>
              </div>

              <div className="mt-2 text-sm text-muted-foreground truncate">
                {data.courseName}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="inline-block bg-emerald-500/20 px-2 py-0.5 rounded text-xs font-medium text-emerald-300">
                  FINAL
                </span>
                <span className="text-sm text-muted-foreground">
                  Apr 30 – May 3, 2026
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Summary Stat Cards */}
          <div className="grid grid-cols-3 gap-2 min-w-0">
            {/* Total Score */}
            <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                Score
              </span>
              <div className={cn('text-2xl font-semibold tabular-nums', getToParColor(data.totalToPar))}>
                {formatToParDisplay(data.totalToPar)}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Par</span>
            </div>

            {/* Position */}
            <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">
                Position
              </span>
              <div className="text-2xl font-semibold text-white tabular-nums">
                {data.currentPosition ? `${data.currentPosition}${data.currentPosition.includes('T') ? '' : 'st'}` : '—'}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Place</span>
            </div>

            {/* DK Points */}
            <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <DraftKingsMark className="h-4 w-auto mb-1" />
              <div className="text-2xl font-semibold text-orange-400 tabular-nums">
                {data.totalDkPoints?.toFixed(1) ?? '—'}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Fantasy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Round Tabs */}
      <div className="flex-shrink-0 px-0 mt-6">
        <div className="flex flex-col gap-4">
          <div className="w-[360px] rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02] grid grid-cols-4">
            {[1, 2, 3, 4].map((round) => (
              <button
                key={round}
                onClick={() => onRoundChange(round)}
                className={cn(
                  'py-3 px-4 text-sm font-medium transition-colors border-r border-white/[0.05] last:border-r-0',
                  selectedRound === round
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-white/60 hover:text-white'
                )}
              >
                R{round}
              </button>
            ))}
          </div>

          {/* Enhanced Round DNA Chart */}
          {(frontNine.length > 0 || backNine.length > 0) && (
            <div className="mt-4">
              <EnhancedRoundDnaCell
                holes={[...frontNine, ...backNine]}
                round={selectedRound}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto mt-5">
        <div className="min-w-0">
          {/* Scorecards */}
          <div className="min-w-0 flex flex-col gap-4">
            {/* Front 9 and Back 9 Side by Side */}
            <div className="grid min-w-0 grid-cols-2 gap-4">
              <NineHoleScorecard
                label="FRONT 9"
                holes={frontNine}
                courseHoles={data.courseHoles?.slice(0, 9)}
                total={outTotal}
                isDesktop={true}
              />
              <NineHoleScorecard
                label="BACK 9"
                holes={backNine}
                courseHoles={data.courseHoles?.slice(9, 18)}
                total={inTotal}
                totTotal={totTotal}
                isDesktop={true}
              />
            </div>

            {/* Legend */}
            <div className="pt-2">
              <ScorecardLegend isDesktop={true} />
            </div>

            {/* Bottom Stat Strip */}
            <div className="grid grid-cols-8 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] divide-x divide-white/[0.05]">
              <StatSegment label="Eagles" value={frontNine.filter(h => h.toPar! < -1).length + backNine.filter(h => h.toPar! < -1).length} />
              <StatSegment label="Birdies" value={frontNine.filter(h => h.toPar === -1).length + backNine.filter(h => h.toPar === -1).length} color="emerald" />
              <StatSegment label="Pars" value={frontNine.filter(h => h.toPar === 0).length + backNine.filter(h => h.toPar === 0).length} />
              <StatSegment label="Bogeys" value={frontNine.filter(h => h.toPar === 1).length + backNine.filter(h => h.toPar === 1).length} color="red" />
              <StatSegment label="Double+" value={frontNine.filter(h => h.toPar! > 1).length + backNine.filter(h => h.toPar! > 1).length} />
              <StatSegment label="Fairways" value="9/14" />
              <StatSegment label="GIR" value="14/18" color="emerald" />
              <StatSegment label="Putts" value="29" />
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

function StatSegment({
  label,
  value,
  color = 'default',
}: {
  label: string
  value: number | string
  color?: 'default' | 'emerald' | 'red'
}) {
  const valueColor = {
    default: 'text-white',
    emerald: 'text-emerald-400',
    red: 'text-red-500',
  }[color]

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2">
      <div className={cn('text-lg font-semibold tabular-nums', valueColor)}>
        {value}
      </div>
      <div className="text-xs text-white/60 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  )
}
