'use client'

import { Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { SearchBar } from '@/components/shared/search-bar'
import { useDragScroll } from '@/features/tournaments/hooks/use-drag-scroll'
import { usePlayerColumnWidth } from '@/features/tournaments/hooks/use-player-column-width'
import styles from './tournament-field.module.css'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FieldAnalyticsSummary } from '@/features/tournaments/components/field-analytics-summary'
import { PlayerFlag } from '@/features/tournaments/components/player-flag'
import { ScoreCell } from '@/features/tournaments/components/score-cell'
import { TourChip } from '@/features/tournaments/components/tour-chip'
import { ScorecardLoader } from '@/features/tournaments/components/scorecard-loader'
import { ExpandedPlayerScorecard } from '@/features/tournaments/components/expanded-player-scorecard'
import { buildPositionCountMap, formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'
import type { FieldEntrant, FieldEntryStatus, TournamentField } from '@/features/tournaments/types'
import { fieldStatusLabel } from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

type SortKey =
  | 'pos-asc'
  | 'pos-desc'
  | 'name-asc'
  | 'name-desc'
  | 'total-asc'
  | 'total-desc'
  | 'salary-asc'
  | 'salary-desc'
  | 'own-asc'
  | 'own-desc'
  | 'odds-asc'
  | 'odds-desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'pos-asc', label: 'Position (↑)' },
  { value: 'pos-desc', label: 'Position (↓)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'total-asc', label: 'Total (Low)' },
  { value: 'total-desc', label: 'Total (High)' },
  { value: 'salary-asc', label: 'DK Salary (Low)' },
  { value: 'salary-desc', label: 'DK Salary (High)' },
  { value: 'own-asc', label: 'Ownership (Low)' },
  { value: 'own-desc', label: 'Ownership (High)' },
  { value: 'odds-asc', label: 'Odds (Favorable)' },
  { value: 'odds-desc', label: 'Odds (Long)' },
]

const STATUS_ORDER: Record<FieldEntryStatus, number> = {
  CONFIRMED: 0,
  FINISHED: 1,
  ALTERNATE: 2,
  CUT: 3,
  WITHDRAWN: 4,
  DISQUALIFIED: 5,
}

// Tournament DFS table has 10 visible columns: POS, PLAYER, TOTAL, R1, R2, R3, R4, DK SALARY, OWN %, ODDS
const VISIBLE_COLUMN_COUNT = 10

/**
 * Format a number as "—" if null/undefined, else return the value
 */
function formatMissing<T>(value: T | null | undefined): T | string {
  return value == null ? '—' : value
}

/**
 * Parse betting odds string to numeric value for sorting
 */
function parseOdds(odds: string | null): number {
  if (!odds) return Number.MAX_VALUE
  const num = parseInt(odds.replace(/[^\d-]/g, ''), 10)
  return isNaN(num) ? Number.MAX_VALUE : num
}

/**
 * Tournament leaderboard row: displays all scoring columns with proper alignment
 */
function LeaderboardRow({
  entrant,
  positionCountMap = new Map(),
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap)
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : '—'
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  
  // Extract initials from player name for avatar fallback
  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Format ownership percentage
  const ownershipDisplay = entrant.ownershipPercent == null 
    ? '—' 
    : entrant.ownershipPercent.toFixed(1) + '%'

  // Use real tour data from dfs_salaries operator; display "No Tour" if unavailable
  const tour = entrant.tour

  return (
    <tr className="group border-b border-border hover:bg-muted/40 transition-colors">
      {/* POS */}
      <td className="px-2 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {positionDisplay}
      </td>

      {/* PLAYER - with two-row layout: headshot+name / flag+tour */}
      <td 
        className="px-3 py-2.5 text-left align-middle"
        style={{ width: 'var(--player-column-width, 220px)', minWidth: 'var(--player-column-width, 220px)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Headshot Avatar - larger size: 44px desktop, 42px tablet, 40px mobile */}
          <Avatar className="h-11 w-11 sm:h-11 flex-shrink-0">
            <AvatarImage src={entrant.headshotUrl ?? undefined} alt={entrant.playerName} />
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          
          {/* Two-row text block - vertically centered with headshot */}
          <div className="flex flex-col gap-1 min-w-0">
            {/* Row 1: Player Name */}
            <div className="text-xs sm:text-sm font-medium leading-tight whitespace-nowrap">
              {entrant.playerName}
            </div>
            
            {/* Row 2: Country Flag Image + Tour Chip (always renders) */}
            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
              <PlayerFlag countryCode={entrant.countryCode} />
              <TourChip tour={tour} />
            </div>
          </div>
        </div>
      </td>

      {/* TOTAL - Three-line score cell with tournament strokes, rel-to-par, and DK points */}
      <td className="px-2 sm:px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.totalStrokes} relativeToPar={entrant.total} dkPoints={entrant.totalDkFantasyPoints} emphasis="total" />
      </td>

      {/* R1 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round1} relativeToPar={entrant.round1RelToPar} dkPoints={entrant.round1DkPoints} />
      </td>

      {/* R2 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round2} relativeToPar={entrant.round2RelToPar} dkPoints={entrant.round2DkPoints} />
      </td>

      {/* R3 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round3} relativeToPar={entrant.round3RelToPar} dkPoints={entrant.round3DkPoints} />
      </td>

      {/* R4 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round4} relativeToPar={entrant.round4RelToPar} dkPoints={entrant.round4DkPoints} />
      </td>

      {/* DK SALARY */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums align-middle">
        {salaryDisplay}
      </td>

      {/* OWNERSHIP % */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {ownershipDisplay}
      </td>

      {/* ODDS TO WIN */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {oddsDisplay}
      </td>
    </tr>
  )
}

/**
 * Internal component to render player row with all cells.
 * Extracted to avoid fragment issues in tbody.
 */
function PlayerRowCells({
  entrant,
  positionCountMap,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap)
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const ownershipDisplay = formatMissing(entrant.ownershipPercent ? `${entrant.ownershipPercent.toFixed(1)}%` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)

  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      {/* POS column */}
      <td className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground align-middle">
        <span>{positionDisplay}</span>
      </td>

      {/* PLAYER column - becomes sticky at left edge when scrolled */}
      <td 
        className="sticky left-0 z-20 bg-background px-2 sm:px-3 py-3 text-left align-middle min-w-0 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.8)]"
        style={{ width: 'var(--player-column-width, 220px)', minWidth: 'var(--player-column-width, 220px)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={entrant.headshotUrl || ''} alt={entrant.playerName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{entrant.playerName}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {entrant.countryCode && <PlayerFlag code={entrant.countryCode} />}
              {entrant.tour && <TourChip tour={entrant.tour} />}
            </div>
          </div>
        </div>
      </td>

      {/* TOTAL column */}
      <td className="px-2 sm:px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.totalStrokes} relativeToPar={entrant.total} dkPoints={entrant.dkFantasyPoints} emphasis="total" />
      </td>

      {/* R1 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round1} relativeToPar={entrant.round1RelToPar} dkPoints={entrant.round1DkPoints} />
      </td>

      {/* R2 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round2} relativeToPar={entrant.round2RelToPar} dkPoints={entrant.round2DkPoints} />
      </td>

      {/* R3 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round3} relativeToPar={entrant.round3RelToPar} dkPoints={entrant.round3DkPoints} />
      </td>

      {/* R4 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell strokes={entrant.round4} relativeToPar={entrant.round4RelToPar} dkPoints={entrant.round4DkPoints} />
      </td>

      {/* DK SALARY */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums align-middle">
        {salaryDisplay}
      </td>

      {/* OWNERSHIP % */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {ownershipDisplay}
      </td>

      {/* ODDS TO WIN */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {oddsDisplay}
      </td>
    </>
  )
}



interface TournamentFieldProps {
  field: TournamentField
}

/**
 * Tournament Field leaderboard: a searchable, sortable, paginated table showing
 * all players with live tournament scoring, round-by-round results, and projections.
 */
export function TournamentField({ field }: TournamentFieldProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FieldEntryStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortKey>('pos-asc')
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState<number>(1)

  // Enable drag-to-scroll on the table container
  const scrollContainerRef = useDragScroll({ dragThreshold: 5 })

  // Calculate PLAYER column width based on longest visible name
  const playerColumnWidth = usePlayerColumnWidth(field.entrants, '.tournament-table-container')

  // Status options limited to those actually present in this field.
  const statusOptions = useMemo(() => {
    const present = new Set<FieldEntryStatus>()
    for (const entrant of field.entrants) present.add(entrant.status)
    const ordered = [...present].sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b])
    return [
      { value: 'ALL' as const, label: 'All statuses' },
      ...ordered.map((status) => ({ value: status, label: fieldStatusLabel(status) })),
    ]
  }, [field.entrants])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = field.entrants.filter((entrant) => {
      const matchesQuery =
        normalizedQuery === '' || entrant.playerName.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'ALL' || entrant.status === statusFilter
      return matchesQuery && matchesStatus
    })

    result.sort((a, b) => {
      // Position sorting (default)
      if (sort === 'pos-asc') {
        const posA = a.position ?? Number.MAX_VALUE
        const posB = b.position ?? Number.MAX_VALUE
        return posA !== posB ? posA - posB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'pos-desc') {
        const posA = a.position ?? Number.MIN_VALUE
        const posB = b.position ?? Number.MIN_VALUE
        return posB !== posA ? posB - posA : a.playerName.localeCompare(b.playerName)
      }

      // Name sorting
      if (sort === 'name-asc') return a.playerName.localeCompare(b.playerName)
      if (sort === 'name-desc') return b.playerName.localeCompare(a.playerName)

      // Total score sorting
      if (sort === 'total-asc') {
        const totA = a.total ?? Number.MAX_VALUE
        const totB = b.total ?? Number.MAX_VALUE
        return totA !== totB ? totA - totB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'total-desc') {
        const totA = a.total ?? Number.MIN_VALUE
        const totB = b.total ?? Number.MIN_VALUE
        return totB !== totA ? totB - totA : a.playerName.localeCompare(b.playerName)
      }

      // DK Salary sorting (numeric, nulls after real values)
      if (sort === 'salary-asc') {
        const salA = a.dfsSalary ?? Number.MAX_VALUE
        const salB = b.dfsSalary ?? Number.MAX_VALUE
        return salA !== salB ? salA - salB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'salary-desc') {
        const salA = a.dfsSalary ?? Number.MIN_VALUE
        const salB = b.dfsSalary ?? Number.MIN_VALUE
        return salB !== salA ? salB - salA : a.playerName.localeCompare(b.playerName)
      }

      // Ownership % sorting (nulls after real values)
      if (sort === 'own-asc') {
        const ownA = a.ownershipPercent ?? Number.MAX_VALUE
        const ownB = b.ownershipPercent ?? Number.MAX_VALUE
        return ownA !== ownB ? ownA - ownB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'own-desc') {
        const ownA = a.ownershipPercent ?? Number.MIN_VALUE
        const ownB = b.ownershipPercent ?? Number.MIN_VALUE
        return ownB !== ownA ? ownB - ownA : a.playerName.localeCompare(b.playerName)
      }

      // Odds sorting
      if (sort === 'odds-asc') {
        const oddsA = parseOdds(a.oddsToWin)
        const oddsB = parseOdds(b.oddsToWin)
        return oddsA !== oddsB ? oddsA - oddsB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'odds-desc') {
        const oddsA = parseOdds(a.oddsToWin)
        const oddsB = parseOdds(b.oddsToWin)
        return oddsB !== oddsA ? oddsB - oddsA : a.playerName.localeCompare(b.playerName)
      }

      return 0
    })
    return result
  }, [field.entrants, query, statusFilter, sort])

  // Build position count map for tie detection
  const positionCountMap = useMemo(() => buildPositionCountMap(field.entrants), [field.entrants])

  // Field genuinely empty (nothing imported yet).
  if (field.size === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Field not imported yet"
        description="Once the field for this tournament is imported from your data source, the players will appear here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldAnalyticsSummary summary={field.analyticsSummary} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          placeholder="Search players by name..."
          onSearch={(value) => setQuery(value)}
          className="sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as FieldEntryStatus | 'ALL')}
          >
            <SelectTrigger aria-label="Filter by status" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortKey)}
          >
            <SelectTrigger aria-label="Sort players" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length === field.size
          ? `${field.size} ${field.size === 1 ? 'player' : 'players'} in the field`
          : `${filtered.length} of ${field.size} players`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players match your filters"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <div className="w-full min-w-0 tournament-table-container" style={{ '--player-column-width': playerColumnWidth || '220px' } as React.CSSProperties}>
          <div className="sm:hidden text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <span>Scroll for more →</span>
          </div>
          <div
            ref={scrollContainerRef}
            className={cn('w-full min-w-0 overflow-x-auto border rounded-md select-none', styles.scrollContainer)}
            style={{ userSelect: 'none' }}
          >
            <table className="w-full min-w-max text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border bg-muted/40 sticky top-0 z-20">
                <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground">POS</th>
                <th 
                  className="sticky left-0 z-30 bg-muted/40 px-2 sm:px-3 py-3 text-left text-xs font-semibold"
                  style={{ width: 'var(--player-column-width, 220px)', minWidth: 'var(--player-column-width, 220px)' }}
                >
                  PLAYER
                </th>
                <th className="px-2 sm:px-3 py-3 text-center text-xs font-semibold">TOTAL</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R1</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R2</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R3</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R4</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">DK SALARY</th>
                <th className="px-2 py-3 text-right text-xs font-semibold">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">OWN %</span>
                      </TooltipTrigger>
                      <TooltipContent>Projected Ownership Percentage</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="px-2 py-3 text-right text-xs font-semibold">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">ODDS</span>
                      </TooltipTrigger>
                      <TooltipContent>Betting Odds to Win Tournament</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.flatMap((entrant) => {
                const isExpanded = expandedPlayerId === entrant.playerId
                return [
                  <tr
                    key={`player-${entrant.playerId}`}
                    onClick={(event) => {
                      const target = event.target as HTMLElement
                      // Prevent toggle if clicking on buttons, links, inputs, etc.
                      if (target.closest('button, a, input, select, textarea, [role="button"], [data-stop-row-toggle]')) {
                        return
                      }
                      setExpandedPlayerId(isExpanded ? null : entrant.playerId)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setExpandedPlayerId(isExpanded ? null : entrant.playerId)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`player-scorecard-${entrant.playerId}`}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <PlayerRowCells entrant={entrant} positionCountMap={positionCountMap} />
                  </tr>,
                  isExpanded && (
                    <tr key={`scorecard-${entrant.playerId}`} className="bg-background hover:bg-background">
                      <td colSpan={VISIBLE_COLUMN_COUNT} className="p-4" id={`player-scorecard-${entrant.playerId}`}>
                        <div className="rounded-md border border-border bg-card">
                          <ScorecardLoader
                            playerId={entrant.playerId}
                            playerName={entrant.playerName}
                            tournamentId={field.tournamentId}
                            roundNumber={selectedRound}
                          />
                        </div>
                      </td>
                    </tr>
                  ),
                ].filter(Boolean)
              })}
            </tbody>
          </table>
          </div>
          <div className="text-xs text-muted-foreground italic">
            Final DraftKings points are unavailable for this tournament.
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Server component that fetches and displays player round scorecard data.
 * This component is called inside a Suspense boundary for loading state management.
 */
async function ScorecardContent({
  playerRoundId,
  playerName,
  tournamentId,
}: {
  playerRoundId: string
  playerName: string
  tournamentId: string
}) {
  // Fetch the scorecard data (hole-by-hole scores)
  const scorecard = await getPlayerRoundScorecard(playerRoundId)

  if (!scorecard) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Hole-by-hole scorecard unavailable for this round.
      </div>
    )
  }

  return (
    <ExpandedPlayerScorecard data={scorecard} />
  )
}
