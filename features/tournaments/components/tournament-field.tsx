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

type SortKey = 'name-asc' | 'name-desc' | 'status' | 'rank'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'rank', label: 'World rank' },
  { value: 'status', label: 'Status' },
]

/** Order statuses so the "most notable" participation states sort first. */
const STATUS_ORDER: Record<FieldEntryStatus, number> = {
  CONFIRMED: 0,
  FINISHED: 1,
  ALTERNATE: 2,
  CUT: 3,
  WITHDRAWN: 4,
  DISQUALIFIED: 5,
}

interface CountryChipProps {
  code: string | null
}

/**
 * Compact country code chip. Renders the raw ISO code the field feed supplies;
 * shows a neutral placeholder rather than fabricating a country when unknown.
 */
function CountryChip({ code }: CountryChipProps) {
  const label = code && code.trim() ? code.trim().toUpperCase() : null
  return (
    <span
      aria-hidden
      className="inline-flex h-5 min-w-8 items-center justify-center rounded-[3px] bg-muted px-1 text-[10px] font-semibold tracking-wide text-muted-foreground tabular-nums"
    >
      {label ?? '??'}
    </span>
  )
}

interface FieldRowProps {
  entrant: FieldEntrant
}

/**
 * The player's most recent world rank, shown as a compact `#N` chip. Renders a
 * muted em-dash when no ranking has been imported, so the column stays aligned
 * without implying a rank we do not have.
 */
function RankChip({ rank }: { rank: number | null }) {
  return (
    <span
      className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground"
      title={rank === null ? 'No world ranking available' : `World rank #${rank}`}
    >
      {rank === null ? '—' : `#${rank}`}
    </span>
  )
}

/** A single entrant row: country, name (links to the player), world rank, status. */
function FieldRow({ entrant }: FieldRowProps) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <CountryChip code={entrant.countryCode} />
      <Link
        href={`/players/${entrant.playerId}`}
        className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight outline-none hover:underline focus-visible:underline"
      >
        {entrant.playerName}
      </Link>
      <RankChip rank={entrant.worldRanking} />
      <FieldStatusBadge status={entrant.status} />
    </li>
  )
}

interface TournamentFieldProps {
  field: TournamentField
}

/**
 * The tournament Field tab: a searchable, sortable, paginated roster of every
 * player in the field, each linking to their profile.
 *
 * Presented as a roster with participation status — NOT a leaderboard —
 * because the provider tier obfuscates finishing positions. Ordering,
 * filtering, and paging run client-side: a field is at most a few hundred
 * players, so the full roster is sent once and manipulated locally.
 */
export function TournamentField({ field }: TournamentFieldProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FieldEntryStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortKey>('name-asc')
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
      if (sort === 'name-desc') return b.playerName.localeCompare(a.playerName)
      if (sort === 'status') {
        const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        return byStatus !== 0 ? byStatus : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'rank') {
        // Lower world-ranking number is better; unranked players sort last, then
        // fall back to alphabetical so the order is stable.
        const ra = a.worldRanking ?? Number.POSITIVE_INFINITY
        const rb = b.worldRanking ?? Number.POSITIVE_INFINITY
        return ra !== rb ? ra - rb : a.playerName.localeCompare(b.playerName)
      }
      return a.playerName.localeCompare(b.playerName)
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
        <ul className={cn('divide-y divide-border')}>
          {pageItems.map((entrant) => (
            <FieldRow key={entrant.playerId} entrant={entrant} />
          ))}
        </ul>
      )}

      <TournamentPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
