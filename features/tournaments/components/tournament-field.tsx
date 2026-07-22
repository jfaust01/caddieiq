'use client'

import { Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { SearchBar } from '@/components/shared/search-bar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldAnalyticsSummary } from '@/features/tournaments/components/field-analytics-summary'
import { FieldStatusBadge } from '@/features/tournaments/components/field-status-badge'
import { TournamentPagination } from '@/features/tournaments/components/tournament-pagination'
import type { FieldEntrant, FieldEntryStatus, TournamentField } from '@/features/tournaments/types'
import { fieldStatusLabel } from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

type SortKey =
  | 'pos-asc'
  | 'pos-desc'
  | 'name-asc'
  | 'name-desc'
  | 'total-asc'
  | 'total-desc'
  | 'round-asc'
  | 'round-desc'
  | 'strokes-asc'
  | 'strokes-desc'
  | 'proj-asc'
  | 'proj-desc'
  | 'starting-asc'
  | 'starting-desc'
  | 'odds-asc'
  | 'odds-desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'pos-asc', label: 'Position (↑)' },
  { value: 'pos-desc', label: 'Position (↓)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'total-asc', label: 'Total (Low)' },
  { value: 'total-desc', label: 'Total (High)' },
  { value: 'round-asc', label: 'Round (Low)' },
  { value: 'round-desc', label: 'Round (High)' },
  { value: 'strokes-asc', label: 'Strokes (Low)' },
  { value: 'strokes-desc', label: 'Strokes (High)' },
  { value: 'proj-asc', label: 'Projection (↑)' },
  { value: 'proj-desc', label: 'Projection (↓)' },
  { value: 'starting-asc', label: 'Starting Time (Early)' },
  { value: 'starting-desc', label: 'Starting Time (Late)' },
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
function LeaderboardRow({ entrant }: { entrant: FieldEntrant }) {
  const positionDisplay = formatMissing(entrant.position)
  const totalDisplay = entrant.total == null ? '—' : (entrant.total > 0 ? '+' : '') + entrant.total
  const thruDisplay = formatMissing(entrant.thruHole)
  const roundDisplay = entrant.roundScore == null ? '—' : (entrant.roundScore > 0 ? '+' : '') + entrant.roundScore
  const r1Display = entrant.round1 == null ? '—' : entrant.round1
  const r2Display = entrant.round2 == null ? '—' : entrant.round2
  const r3Display = entrant.round3 == null ? '—' : entrant.round3
  const r4Display = entrant.round4 == null ? '—' : entrant.round4
  const strokesDisplay = formatMissing(entrant.totalStrokes)
  const projDisplay = formatMissing(entrant.projection)
  const startDisplay = formatMissing(entrant.startingTime)
  const oddsDisplay = formatMissing(entrant.oddsToWin)

  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      {/* POS */}
      <td className="px-2 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground">
        {positionDisplay}
      </td>

      {/* PLAYER - STICKY */}
      <td className="sticky left-0 z-10 px-2 sm:px-3 py-3 text-left text-sm font-medium bg-background hover:bg-muted/40 border-r border-border/50">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Link
            href={`/players/${entrant.playerId}`}
            className="truncate text-primary hover:underline text-xs sm:text-sm"
            title={entrant.playerName}
          >
            {entrant.playerName}
          </Link>
          <FieldStatusBadge status={entrant.status} />
        </div>
      </td>

      {/* TOTAL */}
      <td className="px-2 sm:px-3 py-3 text-right text-sm font-mono tabular-nums">
        {totalDisplay}
      </td>

      {/* THRU */}
      <td className="px-3 py-3 text-center text-sm font-mono tabular-nums text-muted-foreground">
        {thruDisplay}
      </td>

      {/* ROUND */}
      <td className="px-3 py-3 text-center text-sm font-mono tabular-nums">
        {roundDisplay}
      </td>

      {/* R1 */}
      <td className="px-3 py-3 text-center text-sm font-mono tabular-nums text-muted-foreground">
        {r1Display}
      </td>

      {/* R2 */}
      <td className="px-3 py-3 text-center text-sm font-mono tabular-nums text-muted-foreground">
        {r2Display}
      </td>

      {/* R3 */}
      <td className="px-3 py-3 text-center text-sm font-mono tabular-nums text-muted-foreground">
        {r3Display}
      </td>

      {/* R4 */}
      <td className="px-3 py-3 text-center text-sm font-mono tabular-nums text-muted-foreground">
        {r4Display}
      </td>

      {/* STROKES */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground">
        {strokesDisplay}
      </td>

      {/* PROJ. */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums">
        {projDisplay}
      </td>

      {/* STARTING */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground">
        {startDisplay}
      </td>

      {/* ODDS TO WIN */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground">
        {oddsDisplay}
      </td>
    </tr>
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
  const [page, setPage] = useState(1)

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

      // Round score sorting
      if (sort === 'round-asc') {
        const roundA = a.roundScore ?? Number.MAX_VALUE
        const roundB = b.roundScore ?? Number.MAX_VALUE
        return roundA !== roundB ? roundA - roundB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'round-desc') {
        const roundA = a.roundScore ?? Number.MIN_VALUE
        const roundB = b.roundScore ?? Number.MIN_VALUE
        return roundB !== roundA ? roundB - roundA : a.playerName.localeCompare(b.playerName)
      }

      // Strokes sorting
      if (sort === 'strokes-asc') {
        const strokesA = a.totalStrokes ?? Number.MAX_VALUE
        const strokesB = b.totalStrokes ?? Number.MAX_VALUE
        return strokesA !== strokesB ? strokesA - strokesB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'strokes-desc') {
        const strokesA = a.totalStrokes ?? Number.MIN_VALUE
        const strokesB = b.totalStrokes ?? Number.MIN_VALUE
        return strokesB !== strokesA ? strokesB - strokesA : a.playerName.localeCompare(b.playerName)
      }

      // Projection sorting (treat as text for now, as format varies)
      if (sort === 'proj-asc' || sort === 'proj-desc') {
        return a.playerName.localeCompare(b.playerName)
      }

      // Starting time sorting
      if (sort === 'starting-asc' || sort === 'starting-desc') {
        return a.playerName.localeCompare(b.playerName)
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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
          onSearch={(value) => {
            setQuery(value)
            setPage(1)
          }}
          className="sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as FieldEntryStatus | 'ALL')
              setPage(1)
            }}
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
            onValueChange={(value) => {
              setSort(value as SortKey)
              setPage(1)
            }}
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

      {pageItems.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players match your filters"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <div className="w-full min-w-0">
          <div className="sm:hidden text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <span>Scroll for more →</span>
          </div>
          <div className="w-full min-w-0 overflow-x-auto border rounded-md">
            <table className="w-full min-w-max text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border bg-muted/40 sticky top-0 z-20">
                <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground">POS</th>
                <th className="sticky left-0 z-20 px-2 sm:px-3 py-3 text-left text-xs font-semibold bg-muted/40 border-r border-border/50">PLAYER</th>
                <th className="px-2 sm:px-3 py-3 text-right text-xs font-semibold">TOTAL</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">THRU</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">ROUND</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R1</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R2</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R3</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R4</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">STROKES</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">PROJ.</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">STARTING</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">ODDS TO WIN</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((entrant) => (
                <LeaderboardRow key={entrant.playerId} entrant={entrant} />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <TournamentPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
