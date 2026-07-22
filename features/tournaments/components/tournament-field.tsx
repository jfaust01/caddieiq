'use client'

import { Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { SearchBar } from '@/components/shared/search-bar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CountryFlag } from '@/features/players/components/country-flag'
import { FieldAnalyticsSummary } from '@/features/tournaments/components/field-analytics-summary'
import { ScoreCell } from '@/features/tournaments/components/score-cell'
import { TotalCell } from '@/features/tournaments/components/total-cell'
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
  | 'proj-asc'
  | 'proj-desc'
  | 'dk-asc'
  | 'dk-desc'
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
  { value: 'proj-asc', label: 'Projection (↑)' },
  { value: 'proj-desc', label: 'Projection (↓)' },
  { value: 'dk-asc', label: 'DK Points (Low)' },
  { value: 'dk-desc', label: 'DK Points (High)' },
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
  const projDisplay = formatMissing(entrant.projection)
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

  return (
    <tr className="group border-b border-border hover:bg-muted/40 transition-colors h-[68px]">
      {/* POS */}
      <td className="px-2 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {positionDisplay}
      </td>

      {/* PLAYER - STICKY with image, flag */}
      <td className="sticky left-0 z-10 px-2 sm:px-3 py-3 text-left text-sm font-medium bg-background group-hover:bg-muted/40 border-r border-border/50 align-middle">
        <div className="flex items-center gap-2 min-w-0">
          {/* Headshot Avatar */}
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={entrant.headshotUrl ?? undefined} alt={entrant.playerName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          
          {/* Name + Country Flag */}
          <div className="flex items-center gap-1 min-w-0">
            <Link
              href={`/players/${entrant.playerId}`}
              className="truncate text-primary hover:underline text-xs sm:text-sm"
              title={entrant.playerName}
            >
              {entrant.playerName}
            </Link>
            {entrant.countryCode && (
              <CountryFlag countryCode={entrant.countryCode} className="h-4 w-4 flex-shrink-0" />
            )}
          </div>
        </div>
      </td>

      {/* TOTAL - Single value relative-to-par with color coding */}
      <td className="px-2 sm:px-3 py-3 text-center align-middle">
        <TotalCell relToPar={entrant.total} />
      </td>

      {/* R1 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell score={entrant.round1} relToPar={entrant.round1RelToPar} dkPoints={entrant.round1DkPoints} />
      </td>

      {/* R2 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell score={entrant.round2} relToPar={entrant.round2RelToPar} dkPoints={entrant.round2DkPoints} />
      </td>

      {/* R3 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell score={entrant.round3} relToPar={entrant.round3RelToPar} dkPoints={entrant.round3DkPoints} />
      </td>

      {/* R4 - Three-line score cell */}
      <td className="px-3 py-3 text-center align-middle">
        <ScoreCell score={entrant.round4} relToPar={entrant.round4RelToPar} dkPoints={entrant.round4DkPoints} />
      </td>

      {/* PROJ. */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums align-middle">
        {projDisplay}
      </td>

      {/* DK POINTS */}
      <td className="px-3 py-3 text-right text-sm font-mono tabular-nums text-muted-foreground align-middle">
        {entrant.dkFantasyPoints == null ? '—' : entrant.dkFantasyPoints.toFixed(1)}
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

      // Projection sorting (treat as text for now, as format varies)
      if (sort === 'proj-asc' || sort === 'proj-desc') {
        return a.playerName.localeCompare(b.playerName)
      }

      // DK Fantasy Points sorting (nulls after real values)
      if (sort === 'dk-asc') {
        const dkA = a.dkFantasyPoints ?? Number.MAX_VALUE
        const dkB = b.dkFantasyPoints ?? Number.MAX_VALUE
        return dkA !== dkB ? dkA - dkB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'dk-desc') {
        const dkA = a.dkFantasyPoints ?? Number.MIN_VALUE
        const dkB = b.dkFantasyPoints ?? Number.MIN_VALUE
        return dkB !== dkA ? dkB - dkA : a.playerName.localeCompare(b.playerName)
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
                <th className="px-2 sm:px-3 py-3 text-center text-xs font-semibold">TOTAL</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R1</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R2</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R3</th>
                <th className="px-3 py-3 text-center text-xs font-semibold">R4</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">PROJ.</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">DK POINTS</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">OWNERSHIP %</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">ODDS TO WIN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entrant) => (
                <LeaderboardRow key={entrant.playerId} entrant={entrant} />
              ))}
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
