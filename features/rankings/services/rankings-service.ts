/**
 * RankingsService — the feature-level read API for the live Rankings directory.
 *
 * It turns the CaddieIQ Ranking Engine's output into a render-ready
 * {@link RankingView}: it asks the shared {@link rankingService} for the global
 * board set (ordered by the season-normalized analytics every surface shares),
 * selects the board for the requested category, and joins each row with live
 * player display metadata (name, country, tour) from the player repository.
 *
 * It never fabricates data. Ordering, scores, grades, bands, and confidence all
 * come from the engine; labels come from the database. Filter options are
 * derived from the players actually present, so a control never offers a value
 * that would return nothing. `server-only` keeps it out of the client bundle —
 * the UI reaches it through a server component.
 */

import 'server-only'

import { rankingService } from '@/lib/rankings'
import type { RankingBoard, RankingBoardSet } from '@/lib/rankings/types'
import { getPlayerRepository } from '@/lib/repositories/player-repository'

import { rankingTypeFromSlug, DEFAULT_RANKING_TYPE } from '../categories'
import type { FilterOption, RankingRow, RankingView } from '../types'

/** Human labels for the tour enum values that can appear on ranked players. */
const TOUR_LABELS: Record<string, string> = {
  PGA: 'PGA Tour',
  DP_WORLD: 'DP World Tour',
  LIV: 'LIV Golf',
  KORN_FERRY: 'Korn Ferry Tour',
  LPGA: 'LPGA Tour',
}

function tourLabel(type: string): string {
  return TOUR_LABELS[type] ?? type
}

/** The empty view returned when a board has no ranked players. */
function emptyView(
  slug: string,
  boards: RankingBoardSet,
  board: RankingBoard,
  typeLabel: string,
  typeDescription: string,
): RankingView {
  const seasonOptions: FilterOption[] =
    boards.season === null
      ? []
      : [{ value: String(boards.season), label: String(boards.season) }]
  return {
    slug,
    category: board.category,
    typeLabel,
    typeDescription,
    season: boards.season,
    totalRanked: 0,
    rows: [],
    tourOptions: [{ value: 'ALL', label: 'All tours' }],
    seasonOptions: [{ value: 'ALL', label: 'All seasons' }, ...seasonOptions],
  }
}

/**
 * Load a fully-enriched live ranking view for a route slug. Falls back to the
 * default (overall) type when the slug is unknown, so callers can pass raw
 * params. Runs the engine once (shared request cache) and issues a single
 * batched metadata query for the ranked players.
 */
export async function getRankingView(slug: string): Promise<RankingView> {
  const type = rankingTypeFromSlug(slug) ?? DEFAULT_RANKING_TYPE

  const boards = await rankingService.getGlobalBoards()
  const board = boards.boards.find((entry) => entry.category === type.category)

  // The engine always produces every category, so a missing board means an
  // empty population — render an honest empty state rather than inventing rows.
  if (!board || board.rows.length === 0) {
    return emptyView(type.slug, boards, board ?? boards.boards[0], type.label, type.description)
  }

  const playerIds = board.rows.map((row) => row.playerId)
  const metadata = await getPlayerRepository().findDirectoryMetadataByIds(playerIds)
  const metaById = new Map(metadata.map((entry) => [entry.id, entry]))

  const rows: RankingRow[] = board.rows.map((row) => {
    const meta = metaById.get(row.playerId)
    return {
      rank: row.rank,
      playerId: row.playerId,
      // A ranked player should always resolve; fall back to the id so the row
      // still renders rather than throwing if metadata is unexpectedly missing.
      name: meta?.fullName ?? row.playerId,
      countryCode: meta?.countryCode ?? null,
      tour: meta?.tourType ?? null,
      score: row.score,
      grade: row.grade,
      band: row.band,
      confidence: row.confidence,
      percentile: row.percentile,
    }
  })

  // Tour options: only the tours actually held by ranked players, so the filter
  // can never offer an empty partition.
  const tours = new Map<string, string>()
  for (const row of rows) {
    if (row.tour) tours.set(row.tour, tourLabel(row.tour))
  }
  const tourOptions: FilterOption[] = [
    { value: 'ALL', label: 'All tours' },
    ...[...tours.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ]

  const seasonOptions: FilterOption[] = [
    { value: 'ALL', label: 'All seasons' },
    ...(boards.season === null
      ? []
      : [{ value: String(boards.season), label: String(boards.season) }]),
  ]

  return {
    slug: type.slug,
    category: type.category,
    typeLabel: type.label,
    typeDescription: type.description,
    season: boards.season,
    totalRanked: board.totalRanked,
    rows,
    tourOptions,
    seasonOptions,
  }
}
