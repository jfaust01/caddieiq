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
import { importWeather, type WeatherImportSummary } from "./weather-import"
import { importOdds, type OddsImportSummary } from "./odds-import"
import {
  importCourseCoordinates,
  type GeolocationSummary,
} from "./course-geolocation"
import { recordImportRun, normalizeImportResult } from "./run-recorder"

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
export {
  importWeather,
  type WeatherImportSummary,
  type ImportWeatherOptions,
} from "./weather-import"
export {
  CourseGeolocationService,
  importCourseCoordinates,
  type GeolocationSummary,
  type GeolocationOutcome,
  type GeolocationSkipReason,
  type GeolocateOptions,
} from "./course-geolocation"
export {
  importOdds,
  type OddsImportSummary,
  type ImportOddsOptions,
} from "./odds-import"
export { recordImportRun, type RunOutcome } from "./run-recorder"

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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "player",
    run: () =>
      manager.runPlayerImport(
        { provider: SportsDataProvider.fromEnv(), repository: getPlayerRepository() },
        options.query,
      ),
    normalize: normalizeImportResult,
  })
}

/** Run the full course pipeline against SportsDataIO and the Course repository. */
export function runCourseImport(options: RunImportOptions = {}): Promise<ImportResult> {
  const manager = resolveManager(options)
  return recordImportRun({
    provider: "sportsdataio",
    entity: "course",
    run: () =>
      manager.runCourseImport(
        { provider: SportsDataProvider.fromEnv(), repository: getCourseRepository() },
        options.query,
      ),
    normalize: normalizeImportResult,
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "tournament",
    run: () =>
      manager.runTournamentImport(
        {
          provider: SportsDataProvider.fromEnv(),
          repository: getTournamentRepository(),
          resolveRelations,
        },
        options.query,
      ),
    normalize: normalizeImportResult,
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "course-link",
    run: async () => {
      const provider = SportsDataProvider.fromEnv()
      const response = await provider.listCourses(options.query)
      return linkTournamentCourses(response.data)
    },
    normalize: (s) => ({
      processed: s.processed,
      inserted: s.linked,
      updated: s.updated,
      skipped: s.skipped,
      failed: s.failed,
      summary: `${s.linked} linked, ${s.updated} updated, ${s.skipped} skipped, ${s.failed} failed`,
      error: s.failed > 0 ? (s.notes[0] ?? null) : null,
    }),
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "field",
    run: () => importTournamentFields(),
    normalize: (s) => ({
      processed: s.entriesSeen,
      inserted: s.inserted,
      updated: s.updated,
      skipped: s.entriesUnmatchedPlayer,
      failed: s.entriesInvalid,
      summary: `${s.tournamentsWithField}/${s.tournamentsConsidered} fields; ${s.inserted} inserted, ${s.updated} updated, ${s.entriesUnmatchedPlayer} unmatched, ${s.entriesInvalid} invalid`,
    }),
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "statistics",
    run: () => importPlayerStatistics({ seasons }),
    normalize: (s) => ({
      processed: s.rowsSeen,
      inserted: s.inserted,
      updated: s.updated,
      skipped: s.rowsUnmatchedPlayer,
      failed: s.rowsInvalid,
      // Some seasons can be unreachable (the trial-tier key 401s on prior
      // seasons). That is not a per-row failure, but a run that could not fetch
      // every requested season is honestly PARTIAL, not a clean SUCCESS.
      status:
        s.rowsInvalid > 0
          ? undefined
          : s.seasonsWithData < s.seasonsConsidered
            ? "PARTIAL"
            : undefined,
      summary: `${s.seasonsWithData}/${s.seasonsConsidered} seasons; ${s.inserted} inserted, ${s.updated} updated, ${s.rowsUnmatchedPlayer} unmatched, ${s.rowsInvalid} invalid`,
      error: s.seasonsWithData < s.seasonsConsidered ? (s.notes[0] ?? null) : null,
    }),
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "news",
    run: () => importNews(),
    normalize: (s) => ({
      processed: s.articlesSeen,
      inserted: s.inserted,
      updated: s.updated,
      failed: s.failed,
      summary: `${s.inserted} inserted, ${s.updated} updated, ${s.linkedToPlayer} player-linked, ${s.general} general, ${s.failed} failed`,
      error: s.failed > 0 ? (s.notes[0] ?? null) : null,
    }),
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "betting",
    run: () => importBetting({ dates }),
    normalize: (s) => {
      // Trial-tier payout VALUES arrive scrambled; the structure imports but no
      // real odds are available, so a run with zero available outcomes is
      // honestly PARTIAL rather than a clean SUCCESS — and only then do we
      // surface a note as the run error (never SUCCESS-with-error).
      const scrambledOnly = s.availableOutcomes === 0 && s.scrambledOutcomes > 0
      // A run that saw no events at all but logged notes means the feed itself
      // could not be fetched (the endpoint 404s on the trial tier) — that is a
      // degraded run, not a clean "no events scheduled today".
      const fetchFailed = s.eventsSeen === 0 && s.notes.length > 0
      const degraded = scrambledOnly || fetchFailed
      const status = s.failed > 0 ? undefined : degraded ? "PARTIAL" : undefined
      return {
        processed: s.eventsSeen,
        inserted: s.inserted,
        updated: s.updated,
        failed: s.failed,
        skipped: s.scrambledOutcomes,
        status,
        summary: `${s.inserted} inserted, ${s.updated} updated; ${s.availableOutcomes} available / ${s.scrambledOutcomes} scrambled outcomes`,
        error: s.failed > 0 || degraded ? (s.notes[0] ?? null) : null,
      }
    },
  })
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
  return recordImportRun({
    provider: "sportsdataio",
    entity: "fantasy",
    run: () => importFantasy({ tournamentExternalIds }),
    normalize: (s) => {
      const inserted = s.projectionsInserted + s.salariesInserted
      const updated = s.projectionsUpdated + s.salariesUpdated
      const failed = s.projectionsFailed + s.salariesFailed
      // DFS salaries are real and import cleanly. Projections are unavailable on
      // the trial tier (the endpoint 404s / scrambles), so a run that landed
      // salaries but no projections is honestly PARTIAL, and only then do we
      // surface the projection note as the run error — never SUCCESS-with-error.
      const projectionsMissing =
        s.projectionsAvailable === 0 && (s.projectionsScrambled > 0 || s.notes.length > 0)
      const status =
        failed > 0 ? undefined : projectionsMissing ? "PARTIAL" : undefined
      return {
        processed: s.projectionsSeen + s.salariesSeen,
        inserted,
        updated,
        failed,
        skipped: s.projectionsScrambled,
        status,
        summary: `salaries: ${s.salariesInserted}+${s.salariesUpdated} (real); projections: ${s.projectionsAvailable} available / ${s.projectionsScrambled} scrambled`,
        error: failed > 0 || projectionsMissing ? (s.notes[0] ?? null) : null,
      }
    },
  })
}

/**
 * Give every golf course a VERIFIED latitude/longitude via the Course
 * Geolocation Engine — the prerequisite for weather, maps, and travel.
 *
 * Run this AFTER {@link runCourseImport} has populated the course catalog, and
 * BEFORE {@link runWeatherImport} (weather fetches for any course with a
 * usable coordinate — VERIFIED or APPROXIMATE). Idempotent and incremental:
 * only courses without a usable coordinate are looked up, so re-running
 * processes just the remaining backlog and never downgrades a better
 * coordinate. Coordinates are never fabricated — the two-tier provider persists
 * a course-precise (OSM, VERIFIED) match when it finds one, else a city-level
 * (OpenWeather, APPROXIMATE) fallback, else leaves the course UNKNOWN. `limit`
 * bounds one run; pass `includeApproximate` to retry upgrading city-level rows.
 */
export async function runCourseGeolocation(
  limit?: number,
  options: { includeApproximate?: boolean } = {},
): Promise<GeolocationSummary> {
  return recordImportRun({
    provider: "osm-nominatim + openweather",
    entity: "geolocation",
    run: () => importCourseCoordinates({ limit, includeApproximate: options.includeApproximate }),
    // A course with no confident public match (course-precise OR city-level) is
    // legitimately left UNKNOWN and skipped — that is the honest, non-
    // fabricating behavior, NOT an error. Both VERIFIED and APPROXIMATE
    // successes count as `updated`. The run only carries an error when a lookup
    // actually threw (`failed`).
    normalize: (s) => ({
      processed: s.coursesConsidered,
      updated: s.verified + s.approximate,
      skipped: s.skippedNotFound,
      failed: s.failed,
      summary: `${s.verified} verified (course-precise), ${s.approximate} approximate (city-level), ${s.skippedNotFound} not found, ${s.failed} failed`,
      error: s.failed > 0 ? (s.notes[0] ?? null) : null,
    }),
  })
}

/**
 * Import OpenWeather forecasts into `weather_snapshots` / `weather_periods`, one
 * snapshot per tournament, keyed off its linked host course's VERIFIED
 * coordinates.
 *
 * Run this AFTER {@link runTournamentImport}, {@link runCourseLinking}, and
 * {@link runCourseGeolocation} so each event has a venue with verified
 * coordinates to locate a forecast for. Tournaments with no host course or no
 * verified coordinates are skipped (never fetched for a fabricated location).
 * Idempotent — re-running atomically replaces each snapshot. When
 * `tournamentIds` is omitted, upcoming/in-progress events within the provider's
 * useful forecast horizon are refreshed.
 */
export async function runWeatherImport(
  tournamentIds?: readonly string[],
): Promise<WeatherImportSummary> {
  return recordImportRun({
    provider: "openweather",
    entity: "weather",
    run: () => importWeather({ tournamentIds }),
    normalize: (s) => ({
      processed: s.tournamentsConsidered,
      updated: s.stored,
      skipped: s.skippedNoCourse + s.skippedNoCoordinates,
      failed: s.failed,
      summary:
        s.tournamentsConsidered === 0 && s.emptyReason
          ? s.emptyReason
          : `${s.stored} snapshots (${s.periodsStored} periods, ${s.storedCityLevel} city-level); ${s.skippedNoCourse} no-course, ${s.skippedNoCoordinates} no-coords, ${s.failed} failed`,
      error: s.failed > 0 ? (s.notes[0] ?? null) : null,
    }),
  })
}

/**
 * Import golf betting odds from The Odds API into `odds_events` / `odds_quotes`,
 * then link each event to a CaddieIQ tournament and each quote to a known player.
 *
 * Prices are real bookmaker quotes — nothing is fabricated. Run this AFTER
 * {@link runTournamentImport} and {@link runPlayerImport} so the tournament and
 * player id bridges resolve (unlinked events/quotes are still stored, they just
 * won't surface on a hub until a future run links them). Idempotent: the
 * repository reconciles on stable keys and only overwrites a quote when the
 * incoming price is newer, so re-running is safe and cheap. This is the feed
 * behind both the tournament and player Odds Intelligence cards.
 */
export async function runOddsImport(): Promise<OddsImportSummary> {
  return recordImportRun({
    provider: "the-odds-api",
    entity: "odds",
    run: () => importOdds(),
    normalize: (s) => ({
      processed: s.eventsSeen,
      inserted: s.inserted,
      updated: s.updated,
      failed: s.failed,
      summary: `${s.inserted} inserted, ${s.updated} updated; ${s.quotesBuilt} quotes, ${s.linkedToTournament} events linked, ${s.quotesLinkedToPlayer} quotes player-linked, ${s.distinctBookmakers} books`,
      error: s.failed > 0 ? (s.notes[0] ?? null) : null,
    }),
  })
}
