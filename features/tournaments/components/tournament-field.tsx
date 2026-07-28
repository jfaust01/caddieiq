'use client'

import { Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { FieldAnalyticsSummary } from '@/features/tournaments/components/field-analytics-summary'
import { ScorecardDrawer } from '@/features/tournaments/components/scorecard-drawer'
import { FantasyFilterChips } from '@/features/tournaments/components/fantasy-table/fantasy-filter-chips'
import { FantasyPlayerTable } from '@/features/tournaments/components/fantasy-table/fantasy-player-table'
import { FavoritesTable } from '@/features/tournaments/components/fantasy-table/favorites-table'
import {
  TournamentPlayerToolbar,
  type StatusOption,
} from '@/features/tournaments/components/fantasy-table/tournament-player-toolbar'
import { parseOdds, courseFitScore } from '@/features/tournaments/components/fantasy-table/helpers'
import {
  type FilterContext,
  type SortKey,
  classifyPhase,
  phaseTableConfig,
} from '@/features/tournaments/config/phase-table-config'
import type { FieldEntrant, FieldEntryStatus, TournamentField } from '@/features/tournaments/types'
import { fieldStatusLabel } from '@/features/tournaments/utils/format'
import { enrichEntrantsWithMockData } from '@/features/tournaments/utils/mock-entrant-data'
import type { DfsValueField, DfsValueResult } from '@/lib/dfs-value'

const STATUS_ORDER: Record<FieldEntryStatus, number> = {
  CONFIRMED: 0,
  ALTERNATE: 1,
  FINISHED: 2,
  WITHDRAWN: 3,
  CUT: 4,
  DISQUALIFIED: 5,
}

interface TournamentFieldProps {
  field: TournamentField
  tournamentId: string
  /** Tournament status string; classified into scheduled | live | completed. */
  status?: string | null
  /** DFS Value Model field, used for the scheduled fantasy columns. */
  dfsField?: DfsValueField | null
}

/**
 * Tournament Field: the status-aware fantasy workflow. This component is a lean
 * orchestrator — it owns filter/sort/chip state and derives the data sets, then
 * delegates all rendering to the shared fantasy-table components driven by
 * `phaseTableConfig`. Scheduled / Live / Completed are configurations of one
 * table, not separate implementations.
 */
export function TournamentField({ field, tournamentId, status, dfsField }: TournamentFieldProps) {
  const phase = classifyPhase(status)
  const config = phaseTableConfig[phase]

  // Enrich entrants with mock data for missing fields
  const enrichedEntrants = useMemo(() => enrichEntrantsWithMockData(field.entrants), [field.entrants])

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FieldEntryStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortKey>(() => config.defaultSort)
  const [chip, setChip] = useState<string>('all')
  const [selectedScorecardPlayer, setSelectedScorecardPlayer] = useState<string | null>(null)
  const [selectedScorecardRound, setSelectedScorecardRound] = useState<number>(1)
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)

  // Load favorites from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem(`favorites-${tournamentId}`)
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)))
    }
    setFavoritesLoaded(true)
  }, [tournamentId])

  // Persist favorites to localStorage
  useEffect(() => {
    if (favoritesLoaded) {
      localStorage.setItem(`favorites-${tournamentId}`, JSON.stringify([...favorites]))
    }
  }, [favorites, tournamentId, favoritesLoaded])

  // Prevent background scroll when scorecard modal is open
  useEffect(() => {
    if (isScorecardModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isScorecardModalOpen])

  const handleToggleFavorite = (playerId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }

  // Status options limited to those actually present in this field.
  const statusOptions = useMemo<StatusOption[]>(() => {
    const present = new Set<FieldEntryStatus>()
    for (const entrant of enrichedEntrants) present.add(entrant.status)
    const ordered = [...present].sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b])
    return [
      { value: 'ALL', label: 'All statuses' },
      ...ordered.map((s) => ({ value: s, label: fieldStatusLabel(s) })),
    ]
  }, [enrichedEntrants])

  // DFS Value Model lookups for the scheduled fantasy table + Elite/Value chips.
  const dfsByPlayer = useMemo(() => {
    const map = new Map<string, DfsValueResult>()
    for (const p of dfsField?.players ?? []) map.set(p.playerId, p)
    return map
  }, [dfsField])

  const valuePlayIds = useMemo(() => {
    const board = dfsField?.boards.find((b) => b.key === 'valuePlays')
    return new Set((board?.entries ?? []).map((e) => e.playerId))
  }, [dfsField])

  // Top 20 by CaddieIQ fantasy rating actually present.
  const topRatedIds = useMemo(() => {
    const rated = enrichedEntrants
      .filter((e) => e.fantasyScore != null)
      .sort((a, b) => (b.fantasyScore ?? 0) - (a.fantasyScore ?? 0))
      .slice(0, 20)
    return new Set(rated.map((e) => e.playerId))
  }, [enrichedEntrants])

  // Top 20 by in-progress tournament DK points (live phase).
  const topLiveDkIds = useMemo(() => {
    const scored = enrichedEntrants
      .filter((e) => e.totalDkFantasyPoints != null)
      .sort((a, b) => (b.totalDkFantasyPoints ?? 0) - (a.totalDkFantasyPoints ?? 0))
      .slice(0, 20)
    return new Set(scored.map((e) => e.playerId))
  }, [enrichedEntrants])

  // Top 20 by final DK points (completed phase).
  const topFinalDkIds = useMemo(() => {
    const scored = enrichedEntrants
      .filter((e) => e.dkFantasyPoints != null)
      .sort((a, b) => (b.dkFantasyPoints ?? 0) - (a.dkFantasyPoints ?? 0))
      .slice(0, 20)
    return new Set(scored.map((e) => e.playerId))
  }, [enrichedEntrants])

  // Top 20 by final DK points per $1k salary (needs both real values).
  const topValueIds = useMemo(() => {
    const eligible = enrichedEntrants
      .filter((e) => e.dkFantasyPoints != null && e.dfsSalary != null && e.dfsSalary > 0)
      .sort(
        (a, b) =>
          (b.dkFantasyPoints ?? 0) / (b.dfsSalary ?? 1) - (a.dkFantasyPoints ?? 0) / (a.dfsSalary ?? 1),
      )
      .slice(0, 20)
    return new Set(eligible.map((e) => e.playerId))
  }, [enrichedEntrants])

  // Everything the config's filter predicates/availability checks may read.
  const filterContext = useMemo<FilterContext>(
    () => ({
      entrants: enrichedEntrants,
      dfsByPlayer,
      valuePlayIds,
      topRatedIds,
      topLiveDkIds,
      topFinalDkIds,
      topValueIds,
    }),
    [enrichedEntrants, dfsByPlayer, valuePlayIds, topRatedIds, topLiveDkIds, topFinalDkIds, topValueIds],
  )

  // Search + status filter, then sort. Position/total sorts are meaningless
  // pre-tournament, so the scheduled phase falls back to CaddieIQ rating.
  const baseFiltered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = enrichedEntrants.filter((entrant) => {
      const matchesQuery =
        normalizedQuery === '' || entrant.playerName.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'ALL' || entrant.status === statusFilter
      return matchesQuery && matchesStatus
    })

    const name = (a: FieldEntrant, b: FieldEntrant) => a.playerName.localeCompare(b.playerName)

    const posLikeSort = ['pos-asc', 'pos-desc', 'total-asc', 'total-desc'].includes(sort)
    if (phase === 'scheduled' && posLikeSort) {
      result.sort((a, b) => {
        const ra = a.fantasyScore ?? -Infinity
        const rb = b.fantasyScore ?? -Infinity
        return rb !== ra ? rb - ra : name(a, b)
      })
      return result
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'pos-asc': {
          const posA = a.position ?? Number.MAX_VALUE
          const posB = b.position ?? Number.MAX_VALUE
          return posA !== posB ? posA - posB : name(a, b)
        }
        case 'pos-desc': {
          const posA = a.position ?? Number.MIN_VALUE
          const posB = b.position ?? Number.MIN_VALUE
          return posB !== posA ? posB - posA : name(a, b)
        }
        case 'name-asc':
          return name(a, b)
        case 'name-desc':
          return name(b, a)
        case 'rating-desc': {
          const ra = a.rankingScore ?? Number.MIN_VALUE
          const rb = b.rankingScore ?? Number.MIN_VALUE
          return rb !== ra ? rb - ra : name(a, b)
        }
        case 'rating-asc': {
          const ra = a.rankingScore ?? Number.MAX_VALUE
          const rb = b.rankingScore ?? Number.MAX_VALUE
          return ra !== rb ? ra - rb : name(a, b)
        }
        case 'total-asc': {
          const totA = a.total ?? Number.MAX_VALUE
          const totB = b.total ?? Number.MAX_VALUE
          return totA !== totB ? totA - totB : name(a, b)
        }
        case 'total-desc': {
          const totA = a.total ?? Number.MIN_VALUE
          const totB = b.total ?? Number.MIN_VALUE
          return totB !== totA ? totB - totA : name(a, b)
        }
        case 'salary-asc': {
          const salA = a.dfsSalary ?? Number.MAX_VALUE
          const salB = b.dfsSalary ?? Number.MAX_VALUE
          return salA !== salB ? salA - salB : name(a, b)
        }
        case 'salary-desc': {
          const salA = a.dfsSalary ?? Number.MIN_VALUE
          const salB = b.dfsSalary ?? Number.MIN_VALUE
          return salB !== salA ? salB - salA : name(a, b)
        }
        case 'own-asc': {
          const ownA = a.ownershipPercent ?? Number.MAX_VALUE
          const ownB = b.ownershipPercent ?? Number.MAX_VALUE
          return ownA !== ownB ? ownA - ownB : name(a, b)
        }
        case 'own-desc': {
          const ownA = a.ownershipPercent ?? Number.MIN_VALUE
          const ownB = b.ownershipPercent ?? Number.MIN_VALUE
          return ownB !== ownA ? ownB - ownA : name(a, b)
        }
        case 'odds-asc': {
          const oddsA = parseOdds(a.oddsToWin)
          const oddsB = parseOdds(b.oddsToWin)
          return oddsA !== oddsB ? oddsA - oddsB : name(a, b)
        }
        case 'odds-desc': {
          const oddsA = parseOdds(a.oddsToWin)
          const oddsB = parseOdds(b.oddsToWin)
          return oddsB !== oddsA ? oddsB - oddsA : name(a, b)
        }
        case 'fit-desc': {
          const fitA = courseFitScore(dfsByPlayer.get(a.playerId)) ?? Number.MIN_VALUE
          const fitB = courseFitScore(dfsByPlayer.get(b.playerId)) ?? Number.MIN_VALUE
          return fitB !== fitA ? fitB - fitA : name(a, b)
        }
        case 'fit-asc': {
          const fitA = courseFitScore(dfsByPlayer.get(a.playerId)) ?? Number.MAX_VALUE
          const fitB = courseFitScore(dfsByPlayer.get(b.playerId)) ?? Number.MAX_VALUE
          return fitA !== fitB ? fitA - fitB : name(a, b)
        }
        default:
          return 0
      }
    })
    return result
  }, [field.entrants, query, statusFilter, sort, phase])

  // Chips: the config declares them per phase; we hide unavailable ones (backing
  // data absent) and compute counts over the current search/status result.
  const chips = useMemo(() => {
    return config.filters
      .filter((f) => f.available(filterContext))
      .map((f) => ({
        id: f.id,
        label: f.label,
        count:
          f.id === 'all'
            ? baseFiltered.length
            : baseFiltered.filter((e) => f.predicate(e, filterContext)).length,
      }))
  }, [config.filters, filterContext, baseFiltered])

  // Apply the active chip (falls back to "all").
  const filtered = useMemo(() => {
    const active = config.filters.find((f) => f.id === chip)
    if (!active || active.id === 'all') return baseFiltered
    return baseFiltered.filter((e) => active.predicate(e, filterContext))
  }, [baseFiltered, config.filters, chip, filterContext])



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

  const toolbar = (
    <TournamentPlayerToolbar
      query={query}
      onQueryChange={setQuery}
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      statusOptions={statusOptions}
      sort={sort}
      onSortChange={setSort}
      sortOptions={config.sortOptions}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      <FieldAnalyticsSummary summary={field.analyticsSummary} />

      <div className="flex flex-col gap-3">
        <FantasyFilterChips chips={chips} active={chip} onSelect={setChip} accent={config.accent} />
      </div>

      {/* Favorites Table */}
      {favorites.size > 0 && (
        <FavoritesTable
          favoriteIds={favorites}
          allEntrants={enrichedEntrants}
          fieldSize={field.size}
          dfsByPlayer={dfsByPlayer}
          phase={phase}
          tournamentId={tournamentId}
          onToggleFavorite={handleToggleFavorite}
          onRowClick={(playerId) => {
            setSelectedScorecardPlayer(playerId)
            setIsScorecardModalOpen(true)
          }}
          onRoundSelect={(playerId, round) => {
            setSelectedScorecardPlayer(playerId)
            setSelectedScorecardRound(round)
            setIsScorecardModalOpen(true)
          }}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players match your filters"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <FantasyPlayerTable
          phase={phase}
          entrants={filtered}
          allEntrants={field.entrants}
          fieldSize={field.size}
          dfsByPlayer={dfsByPlayer}
          tournamentId={tournamentId}
          favoriteIds={favorites}
          toolbar={toolbar}
          onRowClick={(playerId) => {
            setSelectedScorecardPlayer(playerId)
            setIsScorecardModalOpen(true)
          }}
          onToggleFavorite={handleToggleFavorite}
          onRoundSelect={(playerId, round) => {
            setSelectedScorecardPlayer(playerId)
            setSelectedScorecardRound(round)
            setIsScorecardModalOpen(true)
          }}
        />
      )}

      <ScorecardDrawer
        isOpen={isScorecardModalOpen}
        onOpenChange={setIsScorecardModalOpen}
        selectedPlayerId={selectedScorecardPlayer}
        onPlayerChange={setSelectedScorecardPlayer}
        players={field.entrants}
        tournamentId={tournamentId}
        visiblePlayers={filtered}
        status={status}
        initialRound={selectedScorecardRound}
      />
    </div>
  )
}
