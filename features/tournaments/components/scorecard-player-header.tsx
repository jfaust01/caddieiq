'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TourChip } from './tour-chip'

interface ScorecardPlayerHeaderProps {
  playerName: string
  headshotUrl?: string | null
  tour?: string | null
  position?: string | null
  scoreToPar?: number | null
  round1?: number | null
  round2?: number | null
  round3?: number | null
  round4?: number | null
  dfsSalary?: number | null
  ownershipPercent?: number | null
  isDesktop?: boolean
}

export function ScorecardPlayerHeader({
  playerName,
  headshotUrl,
  tour,
  position,
  scoreToPar,
  round1,
  round2,
  round3,
  round4,
  dfsSalary,
  ownershipPercent,
  isDesktop = true,
}: ScorecardPlayerHeaderProps) {
  const initials = playerName
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
    if (value < 0) return 'text-[#22C55E]'
    if (value === 0) return 'text-white'
    return 'text-[#EF4444]'
  }

  if (!isDesktop) {
    // Mobile header is handled by sticky header in main component
    return null
  }

  return (
    <div className="px-6 py-4 border-b border-[#343944] flex items-center justify-between gap-6">
      {/* Left: Player info */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={headshotUrl || ''} alt={playerName} />
          <AvatarFallback className="text-sm bg-[#222836]">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold truncate">{playerName}</div>
          <div className="flex items-center gap-2 text-xs text-[#9EA5B1]">
            {tour && <TourChip tour={tour} />}
            {position && <span>{position}</span>}
            {scoreToPar !== null && (
              <span className={`font-medium ${getToParColor(scoreToPar)}`}>
                {formatToParDisplay(scoreToPar)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Round scores and DFS data */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-3 text-center">
          <div>
            <div className="text-xs text-[#9EA5B1] mb-1">R1</div>
            <div className="font-semibold">{round1 !== null ? round1 : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-[#9EA5B1] mb-1">R2</div>
            <div className="font-semibold">{round2 !== null ? round2 : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-[#9EA5B1] mb-1">R3</div>
            <div className="font-semibold">{round3 !== null ? round3 : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-[#9EA5B1] mb-1">R4</div>
            <div className="font-semibold">{round4 !== null ? round4 : '—'}</div>
          </div>
        </div>

        <div className="w-px h-8 bg-[#343944]"></div>

        <div className="flex items-center gap-6">
          {dfsSalary != null && typeof dfsSalary === 'number' && Number.isFinite(dfsSalary) && (
            <div>
              <div className="text-xs text-[#9EA5B1] mb-1">SALARY</div>
              <div className="font-semibold">${(dfsSalary / 1000).toFixed(1)}k</div>
            </div>
          )}
          {ownershipPercent != null && typeof ownershipPercent === 'number' && Number.isFinite(ownershipPercent) && (
            <div>
              <div className="text-xs text-[#9EA5B1] mb-1">OWN</div>
              <div className="font-semibold">{ownershipPercent.toFixed(0)}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
