import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'
import { parseOdds } from '@/features/tournaments/components/fantasy-table/helpers'

/**
 * Single source of truth for the status-aware fantasy tables.
 *
 * A tournament is normalized into one of three phases; the phase drives the
 * accent color, the visible columns, the quick-filter chips, and the sort
 * options. There is exactly one table implementation (FantasyPlayerTable) that
 * reads this config — Scheduled / Live / Completed are configurations, not
 * separate components.
 */
export type TablePhase = 'scheduled' | 'live' | 'completed'

export function classifyPhase(status: string | null | undefined): TablePhase {
  const s = (status ?? '').trim().toLowerCase()
  const completed = ['completed', 'complete', 'final', 'finished', 'official']
  const live = ['active', 'in_progress', 'in progress', 'live', 'playing', 'suspended']
  if (completed.some((k) => s.includes(k))) return 'completed'
  if (live.some((k) => s.includes(k))) return 'live'
  return 'scheduled'
}

// ---------------------------------------------------------------------------
// Accents
// ---------------------------------------------------------------------------

export interface PhaseAccent {
  /** Active chip styling. */
  chipActive: string
  /** Active chip count-pill styling. */
  chipCount: string
  /** Table header accent line (gradient `via-` color). */
  headerLine: string
  /** Decorative table glow color. */
  glow: string
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

/**
 * Declarative column descriptor. `FantasyPlayerTable` maps these into the
 * <colgroup> and <thead>, so adding/removing a column here changes the table
 * for that phase — no duplicated per-phase table markup.
 */
export interface ColumnDescriptor {
  id: string
  label: string
  subtitle?: string
  tooltip?: string
  /** `<col>` width class. */
  colClassName: string
  /** `<th>` class (widths, borders, alignment, typography). */
  thClassName: string
  /** Special header rendering: DraftKings mark, or dynamic "Players (n)". */
  headerKind?: 'dk' | 'player'
}

const TH_CENTER =
  'h-[50px] text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80'
const TH_CENTER_NUM =
  'h-[50px] text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] tabular-nums text-muted-foreground/80'
const TH_SCORE =
  'h-[50px] text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] tabular-nums text-muted-foreground/80'

// Scorecard column (common to all phases)
/**
 * Scheduled (pre-tournament) columns for fantasy lineup building.
 * Sorted by mobile priority: Player, Salary, Odds, World Ranking first,
 * then Recent Form, Tee Time, Course Fit via horizontal scroll.
 */
const scheduledColumns: ColumnDescriptor[] = [
  {
    id: 'player',
    label: 'Players',
    headerKind: 'player',
    colClassName: '[width:var(--player-column-width,240px)]',
    thClassName:
      'px-2 sm:px-3 h-[50px] text-left text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80',
  },
  {
    id: 'toPar',
    label: 'To Par',
    tooltip: 'Score relative to par (scheduled phase placeholder)',
    colClassName: 'w-[85px] sm:w-[100px]',
    thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
  },
  {
    id: 'salary',
    label: 'Salary',
    headerKind: 'dk',
    colClassName: 'w-[105px] sm:w-[115px]',
    thClassName: `px-1 sm:px-3 ${TH_CENTER}`,
  },
  {
    id: 'odds',
    label: 'Odds',
    tooltip: 'Betting Odds to Win Tournament',
    colClassName: 'w-[90px] sm:w-[110px]',
    thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
  },
  {
    id: 'worldRank',
    label: 'World Rank',
    tooltip: 'Most recent season World Golf Ranking',
    colClassName: 'w-[100px] sm:w-[120px]',
    thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
  },
  {
    id: 'form',
    label: 'Form',
    tooltip: 'Recent Form score (0–100) — how well they are playing',
    colClassName: 'w-[85px] sm:w-[100px]',
    thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
  },
  {
    id: 'teeTime',
    label: 'Tee Time',
    tooltip: 'Scheduled first-round tee time',
    colClassName: 'w-[95px] sm:w-[110px]',
    thClassName: `border-l border-white/[0.055] px-1 sm:px-2 h-[50px] text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80`,
  },
  {
    id: 'fit',
    label: 'Fit',
    tooltip: 'Course Fit signal from the DFS Value Model (0–100)',
    colClassName: 'w-[85px] sm:w-[100px]',
    thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
  },
]

/** Shared leading columns for the scoring phases (live + completed). */
const posColumn: ColumnDescriptor = {
  id: 'pos',
  label: 'POS',
  colClassName: 'w-[54px] sm:w-[64px]',
  thClassName: `px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const scoringPlayerColumn: ColumnDescriptor = {
  id: 'player',
  label: 'Players',
  headerKind: 'player',
  colClassName: '[width:var(--player-column-width,300px)]',
  thClassName:
    'px-2 sm:px-3 h-[50px] text-left text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80',
}
const toParColumn: ColumnDescriptor = {
  id: 'toPar',
  label: 'To Par',
  tooltip: 'Score relative to par',
  colClassName: 'w-[85px] sm:w-[100px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const totalColumn: ColumnDescriptor = {
  id: 'total',
  label: 'TOTAL',
  colClassName: 'w-[110px] sm:w-[125px]',
  thClassName: `px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const thruColumn: ColumnDescriptor = {
  id: 'thru',
  label: 'THRU',
  tooltip: 'Holes completed this round + current round score',
  colClassName: 'w-[85px] sm:w-[100px]',
  thClassName: `px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const roundColumns: ColumnDescriptor[] = [1, 2, 3, 4].map((n) => ({
  id: `r${n}`,
  label: `R${n}`,
  colClassName: 'w-[76px] sm:w-[82px]',
  thClassName: `px-1 sm:px-3 ${TH_SCORE}`,
}))
const dfsColumn: ColumnDescriptor = {
  id: 'dfs',
  label: 'DFS',
  headerKind: 'dk',
  colClassName: 'w-[110px] sm:w-[126px]',
  thClassName: `border-l border-white/[0.055] px-2 sm:px-4 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground`,
}
const oddsScoringColumn: ColumnDescriptor = {
  id: 'odds',
  label: 'ODDS',
  tooltip: 'Betting Odds to Win Tournament',
  colClassName: 'w-[76px] sm:w-[80px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_SCORE}`,
}
const resultColumn: ColumnDescriptor = {
  id: 'result',
  label: 'RESULT',
  tooltip: 'Final placement (Won / T-position / MC / WD / DQ)',
  colClassName: 'w-[90px] sm:w-[100px]',
  thClassName: `px-1 sm:px-3 ${TH_CENTER}`,
}
const favoritesColumn: ColumnDescriptor = {
  id: 'favorites',
  label: '',
  tooltip: 'Mark as favorite player',
  colClassName: 'w-[45px]',
  thClassName: `px-1 sm:px-3 ${TH_CENTER}`,
}

/**
 * Live (in-progress) columns for real-time fantasy tracking.
 * Mobile priority: Position, Player, Live DK, Tournament Score visible first.
 * Through, Today, Salary, Ownership, Odds available via horizontal scroll.
 * Unsupported columns (Birdies, Eagles, Position Change) omitted entirely.
 */
const liveColumn: ColumnDescriptor = {
  id: 'liveDk',
  label: 'Live DK',
  headerKind: 'dk',
  colClassName: 'w-[110px] sm:w-[130px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}
const todayColumn: ColumnDescriptor = {
  id: 'today',
  label: 'Today',
  tooltip: 'Current round score relative to par',
  colClassName: 'w-[85px] sm:w-[100px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const salaryLiveColumn: ColumnDescriptor = {
  id: 'salary',
  label: 'Salary',
  headerKind: 'dk',
  colClassName: 'w-[100px] sm:w-[110px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER}`,
}

const dkScoreLiveColumn: ColumnDescriptor = {
  id: 'dkScore',
  label: 'DK Score',
  headerKind: 'dk',
  tooltip: 'Total DraftKings fantasy points this tournament',
  colClassName: 'w-[110px] sm:w-[130px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const draftedColumn: ColumnDescriptor = {
  id: 'drafted',
  label: 'Drafted %',
  tooltip: 'DFS ownership percentage',
  colClassName: 'w-[95px] sm:w-[110px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
}

// New columns for enhanced LIVE phase display
const aiRatingColumn: ColumnDescriptor = {
  id: 'aiRating',
  label: 'AI Rating',
  tooltip: 'Overall player rating (0-100 scale)',
  colClassName: 'w-[100px] sm:w-[120px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const courseFitColumn: ColumnDescriptor = {
  id: 'courseFit',
  label: 'Course Fit',
  tooltip: 'Course fit score relative to current field',
  colClassName: 'w-[130px] sm:w-[160px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const tournamentFormColumn: ColumnDescriptor = {
  id: 'tournamentForm',
  label: 'Round DNA',
  subtitle: 'Hole by Hole',
  tooltip: 'Hole-by-hole scoring visualization - scoring fingerprint',
  colClassName: 'w-[300px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER}`,
}

const liveValueColumn: ColumnDescriptor = {
  id: 'value',
  label: 'Value PTS/$1K',
  tooltip: 'Fantasy points per $1,000 salary',
  colClassName: 'w-[110px] sm:w-[130px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const liveOwnershipColumn: ColumnDescriptor = {
  id: 'ownership',
  label: 'Ownership',
  tooltip: 'Expected DFS ownership %',
  colClassName: 'w-[95px] sm:w-[110px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const leverageColumn: ColumnDescriptor = {
  id: 'leverage',
  label: 'Leverage (Down Prob)',
  tooltip: 'Leverage / Downside probability',
  colClassName: 'w-[120px] sm:w-[140px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const aiIntelligenceColumn: ColumnDescriptor = {
  id: 'aiIntelligence',
  label: 'AI Rating',
  tooltip: 'Combined AI Rating and Course Fit',
  colClassName: 'w-[100px] sm:w-[120px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const fantasyOutlookColumn: ColumnDescriptor = {
  id: 'fantasyOutlook',
  label: 'Fantasy Outlook',
  tooltip: 'Combined Salary, DK Score, and Value',
  colClassName: 'w-[220px] sm:w-[250px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER}`,
}

const marketColumn: ColumnDescriptor = {
  id: 'market',
  label: 'Market',
  tooltip: 'Combined Ownership and Odds to Win',
  colClassName: 'w-[100px] sm:w-[120px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const recentFormLiveColumn: ColumnDescriptor = {
  id: 'recentForm',
  label: 'Recent Form',
  tooltip: 'Recent form score (0–100)',
  colClassName: 'w-[100px] sm:w-[120px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const liveColumns: ColumnDescriptor[] = [
  posColumn,
  scoringPlayerColumn,
  toParColumn,
  tournamentFormColumn,
  aiIntelligenceColumn,
  recentFormLiveColumn,
  salaryLiveColumn,
  dkScoreLiveColumn,
  liveOwnershipColumn,
  marketColumn,
]

/**
 * Completed (finished) columns for fantasy recap and analysis.
 * Mobile priority: Position, Player, Total DK Points, Final Score visible first.
 * Salary, Value, Ownership, Result, Odds available via horizontal scroll.
 */
const totalDkColumn: ColumnDescriptor = {
  id: 'totalDk',
  label: 'Total DK',
  headerKind: 'dk',
  tooltip: 'Final fantasy points earned in this tournament',
  colClassName: 'w-[110px] sm:w-[130px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}
const finalScoreColumn: ColumnDescriptor = {
  id: 'score',
  label: 'Score',
  tooltip: 'Final tournament score relative to par',
  colClassName: 'w-[110px] sm:w-[125px]',
  thClassName: `px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const salaryCompletedColumn: ColumnDescriptor = {
  id: 'salary',
  label: 'Salary',
  headerKind: 'dk',
  colClassName: 'w-[105px] sm:w-[115px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER}`,
}

const dkScoreCompletedColumn: ColumnDescriptor = {
  id: 'dkScore',
  label: 'DK Score',
  headerKind: 'dk',
  tooltip: 'Total DraftKings fantasy points this tournament',
  colClassName: 'w-[110px] sm:w-[130px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const valueColumn: ColumnDescriptor = {
  id: 'value',
  label: 'PTS/$1K',
  tooltip: 'Fantasy points per $1,000 of salary (value efficiency)',
  colClassName: 'w-[100px] sm:w-[115px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
}
const ownershipCompletedColumn: ColumnDescriptor = {
  id: 'ownership',
  label: 'Owned %',
  tooltip: 'DFS ownership percentage',
  colClassName: 'w-[95px] sm:w-[110px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-2 ${TH_CENTER_NUM}`,
}

// Enhanced COMPLETED phase columns (12 columns matching reference design)
const aiRatingCompletedColumn: ColumnDescriptor = {
  id: 'aiRating',
  label: 'AI RATING',
  tooltip: 'Overall player rating (0-100 scale)',
  colClassName: 'w-[100px] sm:w-[120px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const courseFitCompletedColumn: ColumnDescriptor = {
  id: 'courseFit',
  label: 'COURSE FIT',
  tooltip: 'Course fit score relative to current field',
  colClassName: 'w-[95px] sm:w-[110px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const tournamentFormCompletedColumn: ColumnDescriptor = {
  id: 'tournamentForm',
  label: 'Round DNA',
  subtitle: 'Hole by Hole',
  tooltip: 'Hole-by-hole scoring visualization - scoring fingerprint',
  colClassName: 'w-[300px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER}`,
}

const valueCompletedColumn: ColumnDescriptor = {
  id: 'value',
  label: 'VALUE — PTS/$1K',
  tooltip: 'Fantasy points per $1,000 salary',
  colClassName: 'w-[110px] sm:w-[130px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const leverageCompletedColumn: ColumnDescriptor = {
  id: 'leverage',
  label: '% OWNED',
  headerKind: 'dk',
  tooltip: 'DraftKings ownership percentage',
  colClassName: 'w-[130px] sm:w-[150px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const recentFormCompletedColumn: ColumnDescriptor = {
  id: 'recentForm',
  label: 'Recent Form',
  tooltip: 'Recent form score (0–100)',
  colClassName: 'w-[100px] sm:w-[120px]',
  thClassName: `border-l border-white/[0.055] px-1 sm:px-3 ${TH_CENTER_NUM}`,
}

const completedColumns: ColumnDescriptor[] = [
  resultColumn,
  favoritesColumn,
  scoringPlayerColumn,
  toParColumn,
  tournamentFormCompletedColumn,
  aiIntelligenceColumn,
  recentFormCompletedColumn,
  salaryCompletedColumn,
  dkScoreCompletedColumn,
  ownershipCompletedColumn,
  marketColumn,
]

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export type SortKey =
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
  | 'rating-asc'
  | 'rating-desc'

export interface SortOption {
  value: SortKey
  label: string
}

// Scoring (live/completed) sort anchors on position/total.
const scoringSortOptions: SortOption[] = [
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

// Scheduled sort anchors on CaddieIQ rating and fantasy signals (no scores yet).
const scheduledSortOptions: SortOption[] = [
  { value: 'rating-desc', label: 'CaddieIQ Rating (High)' },
  { value: 'rating-asc', label: 'CaddieIQ Rating (Low)' },
  { value: 'salary-desc', label: 'DK Salary (High)' },
  { value: 'salary-asc', label: 'DK Salary (Low)' },
  { value: 'own-desc', label: 'Proj Ownership (High)' },
  { value: 'own-asc', label: 'Proj Ownership (Low)' },
  { value: 'odds-asc', label: 'Odds (Favorable)' },
  { value: 'odds-desc', label: 'Odds (Long)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
]

// ---------------------------------------------------------------------------
// Filters (quick-filter chips)
// ---------------------------------------------------------------------------

/**
 * Everything a filter predicate/availability check may need. All values are
 * authoritative — predicates never fabricate data. A chip whose backing data
 * is absent (`available` → false) is hidden entirely; a supported chip with no
 * current matches is disabled by the consumer.
 */
export interface FilterContext {
  entrants: FieldEntrant[]
  dfsByPlayer: Map<string, DfsValueResult>
  valuePlayIds: Set<string>
  topRatedIds: Set<string>
  topLiveDkIds: Set<string>
  topFinalDkIds: Set<string>
  topValueIds: Set<string>
}

export interface FilterDescriptor {
  id: string
  label: string
  available: (ctx: FilterContext) => boolean
  predicate: (e: FieldEntrant, ctx: FilterContext) => boolean
}

const hasOwnership = (ctx: FilterContext) => ctx.entrants.some((e) => e.ownershipPercent != null)
const hasOdds = (ctx: FilterContext) => ctx.entrants.some((e) => e.oddsToWin != null)
const hasPosition = (ctx: FilterContext) => ctx.entrants.some((e) => e.position != null)
const hasCutFlag = (ctx: FilterContext) =>
  ctx.entrants.some((e) => e.cutMade != null || e.status === 'CUT')

const allPlayersFilter: FilterDescriptor = {
  id: 'all',
  label: 'All Players',
  available: () => true,
  predicate: () => true,
}

const scheduledFilters: FilterDescriptor[] = [
  allPlayersFilter,
  {
    id: 'elite',
    label: 'Elite',
    available: (ctx) => ctx.dfsByPlayer.size > 0,
    predicate: (e, ctx) => {
      const t = ctx.dfsByPlayer.get(e.playerId)?.tier
      return t === 'A_PLUS' || t === 'A'
    },
  },
  {
    id: 'value',
    label: 'Value',
    available: (ctx) => ctx.valuePlayIds.size > 0,
    predicate: (e, ctx) => ctx.valuePlayIds.has(e.playerId),
  },
  // Leverage: not backed by real data in current schema — hidden
  // Cash Game: not backed by real data �� hidden
  // GPP: not backed by real data — hidden
  {
    id: 'toprated',
    label: 'Top 20',
    available: (ctx) => ctx.topRatedIds.size > 0,
    predicate: (e, ctx) => ctx.topRatedIds.has(e.playerId),
  },
  // My Lineup: not backed by real data — hidden
]

const liveFilters: FilterDescriptor[] = [
  allPlayersFilter,
  // Hot, Risers, Fallers: not backed by real scoring velocity data — hidden
  // Near Cut, On Bubble: complex cut-line calculations not in schema — hidden
  {
    id: 'making',
    label: 'Making Cut',
    available: hasCutFlag,
    predicate: (e) => e.cutMade === true,
  },
  {
    id: 'topdk',
    label: 'Top DK',
    available: (ctx) => ctx.topLiveDkIds.size > 0,
    predicate: (e, ctx) => ctx.topLiveDkIds.has(e.playerId),
  },
  // My Lineup: not backed by real data — hidden
]

const completedFilters: FilterDescriptor[] = [
  allPlayersFilter,
  {
    id: 'topfin',
    label: 'Top Finishers',
    available: hasPosition,
    predicate: (e) =>
      e.position != null && e.position <= 10 && e.status !== 'CUT' && e.cutMade !== false,
  },
  {
    id: 'bestvalue',
    label: 'Best Value',
    available: (ctx) => ctx.topValueIds.size > 0,
    predicate: (e, ctx) => ctx.topValueIds.has(e.playerId),
  },
  {
    id: 'lowowned',
    label: 'Low Owned',
    available: hasOwnership,
    predicate: (e) => e.ownershipPercent != null && e.ownershipPercent < 10,
  },
  {
    id: 'highowned',
    label: 'High Owned',
    available: hasOwnership,
    predicate: (e) => e.ownershipPercent != null && e.ownershipPercent >= 20,
  },
  {
    id: 'missed',
    label: 'Missed Cut',
    available: hasCutFlag,
    predicate: (e) => e.cutMade === false || e.status === 'CUT',
  },
  {
    id: 'topdk',
    label: 'Top DK',
    available: (ctx) => ctx.topFinalDkIds.size > 0,
    predicate: (e, ctx) => ctx.topFinalDkIds.has(e.playerId),
  },
  // My Lineup: not backed by real data — hidden
]

// ---------------------------------------------------------------------------
// Phase config
// ---------------------------------------------------------------------------

export interface PhaseTableConfigEntry {
  accent: PhaseAccent
  columns: ColumnDescriptor[]
  filters: FilterDescriptor[]
  sortOptions: SortOption[]
  /** Default sort applied when the phase is first shown. */
  defaultSort: SortKey
  /** Footer note shown beneath the table. */
  footnote: string
}

export const phaseTableConfig: Record<TablePhase, PhaseTableConfigEntry> = {
  scheduled: {
    accent: {
      chipActive:
        'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,209,122,0.15)]',
      chipCount: 'bg-emerald-500/20 text-emerald-100',
      headerLine: 'via-emerald-400/40',
      glow: 'bg-emerald-500/[0.04]',
    },
    columns: scheduledColumns,
    filters: scheduledFilters,
    sortOptions: scheduledSortOptions,
    defaultSort: 'rating-desc',
    footnote:
      'Fantasy ratings, course fit, and value reflect the DFS Value Model; blanks mean the platform holds no signal yet.',
  },
  live: {
    accent: {
      chipActive:
        'border-amber-400/40 bg-amber-500/15 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]',
      chipCount: 'bg-amber-500/20 text-amber-100',
      headerLine: 'via-amber-400/45',
      glow: 'bg-amber-500/[0.05]',
    },
    columns: liveColumns,
    filters: liveFilters,
    sortOptions: scoringSortOptions,
    defaultSort: 'pos-asc',
    footnote:
      'Live scoring, thru-hole, and DraftKings points update automatically as official results arrive.',
  },
  completed: {
    accent: {
      chipActive:
        'border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]',
      chipCount: 'bg-sky-500/20 text-sky-100',
      headerLine: 'via-sky-400/40',
      glow: 'bg-sky-500/[0.05]',
    },
    columns: completedColumns,
    filters: completedFilters,
    sortOptions: scoringSortOptions,
    defaultSort: 'pos-asc',
    footnote: 'Final placements and DraftKings points are shown from official results.',
  },
}
