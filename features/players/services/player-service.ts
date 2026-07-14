/**
 * PlayerService — placeholder data access for the Player domain.
 *
 * Every method returns deterministic mock data. No external APIs, database, or
 * network calls are made here. When the data platform is connected, replace the
 * bodies below with provider-backed reads while keeping these signatures stable
 * so the UI does not change.
 *
 * TODO(data): back these methods with the provider layer / Prisma reads.
 */

import type {
  ActivityEntry,
  CareerSummary,
  CourseHistoryEntry,
  FilterOption,
  PaginatedResult,
  Player,
  PlayerDetail,
  PlayerQuery,
  PlayerRanking,
  PlayerStatistic,
  RankingBand,
  Tour,
  TournamentHistoryEntry,
} from '@/features/players/types'
import { MOCK_NATIONALITIES, MOCK_PLAYERS } from './mock-data'

const TOUR_LABELS: Record<Tour, string> = {
  PGA: 'PGA Tour',
  DP_WORLD: 'DP World Tour',
  LIV: 'LIV Golf',
  KORN_FERRY: 'Korn Ferry Tour',
  CHAMPIONS: 'PGA Tour Champions',
}

const RANKING_BAND_LIMIT: Record<RankingBand, number> = {
  ALL: Number.POSITIVE_INFINITY,
  TOP_10: 10,
  TOP_25: 25,
  TOP_50: 50,
  TOP_100: 100,
}

/** Simple deterministic hash so derived detail data is stable per player. */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function seededValue(seed: number, min: number, max: number): number {
  const normalized = (Math.sin(seed) + 1) / 2
  return min + normalized * (max - min)
}

function matchesQuery(player: Player, query: PlayerQuery): boolean {
  const { filters } = query
  const search = filters.search.trim().toLowerCase()

  if (search && !player.fullName.toLowerCase().includes(search)) return false
  if (filters.tour !== 'ALL' && player.tour !== filters.tour) return false
  if (
    filters.nationality !== 'ALL' &&
    player.nationality.code !== filters.nationality
  ) {
    return false
  }
  if (
    filters.handedness !== 'ALL' &&
    player.handedness !== filters.handedness
  ) {
    return false
  }
  if (filters.status !== 'ALL' && player.status !== filters.status) return false
  if (player.worldRanking > RANKING_BAND_LIMIT[filters.rankingBand]) return false

  return true
}

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

function buildStatistics(player: Player): PlayerStatistic[] {
  const seed = hashString(player.id)
  const fieldSize = 156
  const rankFor = (offset: number) =>
    Math.max(1, Math.round(seededValue(seed + offset, 1, 70)))

  return [
    { key: 'sg-total', label: 'SG: Total', value: `+${seededValue(seed + 1, 0.4, 2.6).toFixed(2)}`, rank: rankFor(1), category: 'STROKES_GAINED' },
    { key: 'sg-ott', label: 'SG: Off The Tee', value: `+${seededValue(seed + 2, 0.1, 1.1).toFixed(2)}`, rank: rankFor(2), category: 'STROKES_GAINED' },
    { key: 'sg-app', label: 'SG: Approach', value: `+${seededValue(seed + 3, 0.2, 1.3).toFixed(2)}`, rank: rankFor(3), category: 'STROKES_GAINED' },
    { key: 'sg-arg', label: 'SG: Around Green', value: `+${seededValue(seed + 4, -0.1, 0.8).toFixed(2)}`, rank: rankFor(4), category: 'STROKES_GAINED' },
    { key: 'sg-putt', label: 'SG: Putting', value: `+${seededValue(seed + 5, -0.2, 0.9).toFixed(2)}`, rank: rankFor(5), category: 'STROKES_GAINED' },
    { key: 'driving-accuracy', label: 'Driving Accuracy', value: `${seededValue(seed + 6, 52, 72).toFixed(1)}%`, rank: rankFor(6), category: 'TRADITIONAL' },
    { key: 'driving-distance', label: 'Driving Distance', value: `${Math.round(seededValue(seed + 7, 292, 322))} yds`, rank: rankFor(7), category: 'TRADITIONAL' },
    { key: 'gir', label: 'Greens in Regulation', value: `${seededValue(seed + 8, 62, 74).toFixed(1)}%`, rank: rankFor(8), category: 'TRADITIONAL' },
    { key: 'scrambling', label: 'Scrambling', value: `${seededValue(seed + 9, 54, 68).toFixed(1)}%`, rank: rankFor(9), category: 'TRADITIONAL' },
    { key: 'fieldSize', label: 'Field Size', value: `${fieldSize}`, rank: null, category: 'TRADITIONAL' },
  ].filter((stat) => stat.key !== 'fieldSize')
}

function buildRankings(player: Player): PlayerRanking[] {
  const seed = hashString(player.id)
  const dgRank = Math.max(1, player.worldRanking + Math.round(seededValue(seed + 11, -4, 4)))
  const ciqRank = Math.max(1, player.worldRanking + Math.round(seededValue(seed + 12, -6, 6)))
  const movement = (offset: number): PlayerRanking['movement'] => {
    const v = seededValue(seed + offset, -1, 1)
    if (v > 0.33) return 'up'
    if (v < -0.33) return 'down'
    return 'flat'
  }

  return [
    { system: 'OWGR', label: 'Official World Golf Ranking', rank: player.worldRanking, movement: movement(21), delta: Math.round(seededValue(seed + 21, 0, 3)) },
    { system: 'DATAGOLF', label: 'DataGolf Rank', rank: dgRank, movement: movement(22), delta: Math.round(seededValue(seed + 22, 0, 4)) },
    { system: 'CADDIEIQ', label: 'CaddieIQ Composite', rank: ciqRank, movement: movement(23), delta: Math.round(seededValue(seed + 23, 0, 5)) },
    { system: 'MODEL', label: 'Your Model Rank', rank: null, movement: 'flat', delta: 0, comingSoon: true },
  ]
}

function buildCareerSummary(player: Player): CareerSummary {
  const seed = hashString(player.id)
  const events = Math.round(seededValue(seed + 31, 120, 380))
  const cutsMade = Math.round(events * seededValue(seed + 32, 0.68, 0.9))
  const wins = Math.max(0, Math.round(seededValue(seed + 33, 0, 14)))
  return {
    events,
    wins,
    topTens: Math.round(seededValue(seed + 34, 20, 90)),
    cutsMade,
    cutsPossible: events,
    careerEarnings: `$${seededValue(seed + 35, 8, 92).toFixed(1)}M`,
    bestFinish: wins > 0 ? '1st' : '2nd',
  }
}

function buildCourseHistory(player: Player): CourseHistoryEntry[] {
  const seed = hashString(player.id)
  const courses = ['Augusta National', 'Pebble Beach', 'St Andrews', 'TPC Sawgrass']
  return courses.map((course, index) => ({
    id: `${player.id}-course-${index}`,
    course,
    rounds: Math.round(seededValue(seed + 41 + index, 8, 40)),
    bestFinish: `T${Math.max(1, Math.round(seededValue(seed + 51 + index, 1, 20)))}`,
    scoringAverage: Number(seededValue(seed + 61 + index, 68.5, 72.4).toFixed(1)),
  }))
}

function buildTournamentHistory(player: Player): TournamentHistoryEntry[] {
  const seed = hashString(player.id)
  const tournaments = [
    { name: 'The Masters', season: 2025 },
    { name: 'PGA Championship', season: 2025 },
    { name: 'U.S. Open', season: 2025 },
    { name: 'The Open Championship', season: 2025 },
    { name: 'The Players Championship', season: 2025 },
  ]
  return tournaments.map((tournament, index) => {
    const finish = Math.max(1, Math.round(seededValue(seed + 71 + index, 1, 45)))
    return {
      id: `${player.id}-event-${index}`,
      tournament: tournament.name,
      season: tournament.season,
      result: finish === 1 ? 'Win' : `T${finish}`,
      toPar: `${seededValue(seed + 81 + index, -18, 6) < 0 ? '' : '+'}${Math.round(seededValue(seed + 81 + index, -18, 6))}`,
    }
  })
}

function buildActivity(player: Player): ActivityEntry[] {
  return player.recentForm.slice(0, 4).map((form) => ({
    id: `${player.id}-activity-${form.id}`,
    label:
      typeof form.position === 'number'
        ? `Finished ${form.position === 1 ? '1st' : `T${form.position}`}`
        : `${form.position} at event`,
    detail: form.event,
    date: form.date,
  }))
}

export const playerService = {
  /** Return a filtered, paginated slice of the player directory. */
  getPlayers(query: PlayerQuery): PaginatedResult<Player> {
    const filtered = MOCK_PLAYERS.filter((player) => matchesQuery(player, query)).sort(
      (a, b) => a.worldRanking - b.worldRanking,
    )
    return paginate(filtered, query.page, query.pageSize)
  },

  /** Return a full profile for a player, or null when not found. */
  getPlayerById(id: string): PlayerDetail | null {
    const player = MOCK_PLAYERS.find((candidate) => candidate.id === id)
    if (!player) return null

    return {
      ...player,
      careerSummary: buildCareerSummary(player),
      rankings: buildRankings(player),
      statistics: buildStatistics(player),
      courseHistory: buildCourseHistory(player),
      tournamentHistory: buildTournamentHistory(player),
      activity: buildActivity(player),
    }
  },

  /** All player ids — useful for future static generation. */
  getPlayerIds(): string[] {
    return MOCK_PLAYERS.map((player) => player.id)
  },

  /** Tour filter options, including the "All" sentinel. */
  getTourOptions(): FilterOption<Tour | 'ALL'>[] {
    return [
      { value: 'ALL', label: 'All tours' },
      ...(Object.entries(TOUR_LABELS) as [Tour, string][]).map(
        ([value, label]) => ({ value, label }),
      ),
    ]
  },

  /** Nationality filter options, including the "All" sentinel. */
  getNationalityOptions(): FilterOption[] {
    return [
      { value: 'ALL', label: 'All nationalities' },
      ...MOCK_NATIONALITIES.map((nationality) => ({
        value: nationality.code,
        label: nationality.name,
      })),
    ]
  },
}

export { TOUR_LABELS }
