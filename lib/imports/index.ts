/**
 * Import Pipeline — public surface.
 *
 * The pipeline orchestrates the existing layers end-to-end:
 *
 *   SportsDataIO Provider → Domain Mapper → Data Quality → Repositories → Report
 *
 * It duplicates none of their logic. The three service functions below are the
 * entry points the (future) Operations Center calls; each builds a default
 * SportsDataIO provider (from env) and the default repositories, then runs the
 * corresponding pipeline and returns a uniform {@link ImportResult}.
 */

import { SportsDataProvider } from "@/lib/providers/sportsdataio"
import {
  getCourseRepository,
  getPlayerRepository,
  getTournamentRepository,
} from "@/lib/repositories"
import type { ProviderQuery } from "@/lib/providers/provider"

import { ImportManager, type ImportManagerDeps } from "./import-manager"
import type { ImportResult } from "./import-result"
import type { TournamentImportDeps } from "./tournament-import"
import { createTournamentRelationResolver } from "./tournament-relations"
import { linkTournamentCourses, type CourseLinkSummary } from "./course-relations"
import { importTournamentFields, type FieldImportSummary } from "./field-relations"
import {
  importPlayerStatistics,
  type StatisticsImportSummary,
} from "./statistics-relations"
import { importNews, type NewsImportSummary } from "./news-import"
import { importBetting, type BettingImportSummary } from "./betting-import"
import { importFantasy, type FantasyImportSummary } from "./fantasy-import"

// Types & building blocks
export type { ImportDefinition, ImportManagerDeps } from "./import-manager"
export { ImportManager } from "./import-manager"
export type { ImportResult, ImportEntity } from "./import-result"
export {
  startImportRun,
  finalizeImportResult,
  type ImportRunAccumulator,
} from "./import-result"
export {
  ImportError,
  ProviderImportError,
  MappingImportError,
  ValidationImportError,
  RepositoryImportError,
  type ImportStage,
  type SerializedImportError,
} from "./import-errors"
export {
  ImportLogger,
  createImportLogger,
  consoleImportSink,
  silentImportSink,
  type ImportLogEntry,
  type ImportLogSink,
} from "./import-logger"
export { createPlayerImportDefinition, type PlayerImportDeps } from "./player-import"
export { createCourseImportDefinition, type CourseImportDeps } from "./course-import"
export {
  createTournamentImportDefinition,
  type TournamentImportDeps,
} from "./tournament-import"
export {
  createTournamentRelationResolver,
  type TournamentRelationResolver,
  type TournamentRelationResolverOptions,
  type TournamentRelationResolution,
} from "./tournament-relations"
export {
  linkTournamentCourses,
  type CourseLinkSummary,
  type LinkCoursesOptions,
} from "./course-relations"
export {
  importTournamentFields,
  type FieldImportSummary,
  type ImportFieldsOptions,
} from "./field-relations"
export {
  importPlayerStatistics,
  DEFAULT_STAT_SEASONS,
  type StatisticsImportSummary,
  type ImportStatisticsOptions,
} from "./statistics-relations"
export {
  importNews,
  type NewsImportSummary,
  type ImportNewsOptions,
} from "./news-import"
export {
  importBetting,
  type BettingImportSummary,
  type ImportBettingOptions,
} from "./betting-import"
export {
  importFantasy,
  type FantasyImportSummary,
  type ImportFantasyOptions,
} from "./fantasy-import"

/** Options accepted by the top-level service functions. */
export interface RunImportOptions {
  /** Provider-native query (season/limit/cursor). */
  query?: ProviderQuery
  /** Override the manager (e.g. to inject a custom log sink). */
  manager?: ImportManager
  /** Manager dependencies used when no `manager` is supplied. */
  managerDeps?: ImportManagerDeps
}

/** Build the manager to use for a service call. */
function resolveManager(options: RunImportOptions): ImportManager {
  return options.manager ?? new ImportManager(options.managerDeps)
}

/**
 * Run the full player pipeline against SportsDataIO and the Player repository.
 *
 * @example
 *   const report = await runPlayerImport()
 *   // report.inserted / report.updated / report.qualityScoreAverage …
 */
export function runPlayerImport(options: RunImportOptions = {}): Promise<ImportResult> {
  const manager = resolveManager(options)
  return manager.runPlayerImport(
    { provider: SportsDataProvider.fromEnv(), repository: getPlayerRepository() },
    options.query,
  )
}

/** Run the full course pipeline against SportsDataIO and the Course repository. */
export function runCourseImport(options: RunImportOptions = {}): Promise<ImportResult> {
  const manager = resolveManager(options)
  return manager.runCourseImport(
    { provider: SportsDataProvider.fromEnv(), repository: getCourseRepository() },
    options.query,
  )
}

/**
 * Run the full tournament pipeline against SportsDataIO and the Tournament
 * repository.
 *
 * Tour/season linkage is a required-FK concern the base mapping intentionally
 * omits, so this runner resolves it before persistence: unless a caller injects
 * a custom `resolveRelations`, it builds the default database-backed resolver
 * ({@link createTournamentRelationResolver}), which supplies the required
 * `tourId` (and optional `seasonId`) for every tournament. This is the piece
 * that was previously missing — without a resolver, brand-new tournaments were
 * rejected as relationship failures and nothing persisted.
 */
export async function runTournamentImport(
  options: RunImportOptions & {
    resolveRelations?: TournamentImportDeps["resolveRelations"]
    /** Business key of the tour the schedule belongs to (default `"PGA"`). */
    tourCode?: string
  } = {},
): Promise<ImportResult> {
  const manager = resolveManager(options)
  const resolveRelations =
    options.resolveRelations ??
    (await createTournamentRelationResolver({ tourCode: options.tourCode }))
  return manager.runTournamentImport(
    {
      provider: SportsDataProvider.fromEnv(),
      repository: getTournamentRepository(),
      resolveRelations,
    },
    options.query,
  )
}

/**
 * Populate the `tournament_courses` join table by matching the venue-bearing
 * SportsDataIO feed against already-imported tournaments and courses.
 *
 * Run this AFTER both {@link runTournamentImport} and {@link runCourseImport}
 * have populated their tables. Idempotent — safe to re-run; it reconciles each
 * link on the `(tournamentId, year)` key. Returns a {@link CourseLinkSummary}
 * describing how many links were created/updated/skipped.
 */
export async function runCourseLinking(
  options: RunImportOptions = {},
): Promise<CourseLinkSummary> {
  const provider = SportsDataProvider.fromEnv()
  const response = await provider.listCourses(options.query)
  return linkTournamentCourses(response.data)
}

/**
 * Import every tournament's player field into `tournament_fields`, wiring the
 * Tournament ↔ Player relationship.
 *
 * Run this AFTER {@link runTournamentImport} and {@link runPlayerImport} have
 * populated their tables — entries link only to players that already exist.
 * Drives the field pipeline per tournament (Provider → Mapper → Validation →
 * Repository). Idempotent — reconciles each entry on `(tournamentId, playerId)`.
 * Returns a {@link FieldImportSummary} describing the run.
 */
export async function runFieldImport(): Promise<FieldImportSummary> {
  return importTournamentFields()
}

/**
 * Import player season statistics into `player_season_statistics`, attaching
 * each season's aggregate performance to an existing `Player`.
 *
 * Run this AFTER {@link runPlayerImport} has populated the player catalog —
 * rows link only to players that already exist. Drives the statistics pipeline
 * per season (Provider → Mapper → Validation → Repository). Idempotent —
 * reconciles each row on `(playerId, season)`. Returns a
 * {@link StatisticsImportSummary} describing the run.
 *
 * @param seasons - Seasons to import; defaults to {@link DEFAULT_STAT_SEASONS}.
 */
export async function runStatisticsImport(
  seasons?: readonly number[],
): Promise<StatisticsImportSummary> {
  return importPlayerStatistics({ seasons })
}

/**
 * Import recent news into `news_articles`, linking each article to a player
 * when its provider `PlayerID` resolves to one in our catalog.
 *
 * Run this AFTER {@link runPlayerImport} has populated the player catalog so the
 * `PlayerID → slug → Player.id` bridge can resolve. Unresolvable articles are
 * still stored as general news. Idempotent — reconciles each article on its
 * provider `externalId` (NewsID). Returns a {@link NewsImportSummary}.
 */
export async function runNewsImport(): Promise<NewsImportSummary> {
  return importNews()
}

/**
 * Import betting events (with markets + outcomes) into `betting_events` /
 * `betting_markets` / `betting_outcomes`, linking events to tournaments and
 * outcomes to players.
 *
 * On the current SportsDataIO trial tier payout VALUES arrive scrambled; the
 * pipeline stores the full structure with `available:false` + null payouts so
 * nothing fake is surfaced and real odds flow automatically once a production
 * key is installed. Run AFTER {@link runTournamentImport} and
 * {@link runPlayerImport} so the id bridges resolve. Idempotent. `dates` are
 * `YYYY-MM-DD`; defaults to today (UTC).
 */
export async function runBettingImport(
  dates?: readonly string[],
): Promise<BettingImportSummary> {
  return importBetting({ dates })
}

/**
 * Import fantasy projections into `fantasy_projections` and DFS salaries into
 * `dfs_salaries`, linking both to tournaments and players.
 *
 * Projection VALUES are scrambled on the trial tier and stored with
 * `available:false` + null points; DFS salaries are real and stored as-is. Run
 * AFTER {@link runTournamentImport} and {@link runPlayerImport}. Idempotent.
 * When `tournamentExternalIds` is omitted every bridgeable catalog tournament
 * is imported.
 */
export async function runFantasyImport(
  tournamentExternalIds?: readonly string[],
): Promise<FantasyImportSummary> {
  return importFantasy({ tournamentExternalIds })
}
