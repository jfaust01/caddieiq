/**
 * Repository layer — the only layer permitted to write to the database.
 *
 * All persistence logic is centralized here. Repositories accept already-
 * validated CaddieIQ domain objects (`lib/domain`) and translate them into
 * Prisma writes. They never call providers, never map from raw payloads, and
 * never validate — those concerns live in `lib/providers`, `lib/domain`, and
 * `lib/data-quality` respectively.
 *
 * Future import jobs should depend only on these repositories to persist data.
 */

// Result & error contracts
export * from "./repository-result"
export * from "./errors"
export {
  RepositoryLogger,
  consoleRepositorySink,
  silentRepositorySink,
  type RepositoryLogEntry,
  type RepositoryLogLevel,
  type RepositoryLogSink,
} from "./logger"

// Base plumbing (exported for testing / custom repositories)
export { BaseRepository, type UpsertPlan, type SlugDelegate } from "./base-repository"

// Concrete repositories + lazily-constructed default instances
export { PlayerRepository, getPlayerRepository } from "./player-repository"
export {
  CourseRepository,
  getCourseRepository,
  type CourseGeocodeTargetRow,
  type VerifiedCoordinatesInput,
} from "./course-repository"
export {
  TournamentRepository,
  getTournamentRepository,
  type TournamentPersistInput,
} from "./tournament-repository"
export {
  FieldRepository,
  getFieldRepository,
  type ResolvedFieldEntry,
  type FieldEntryRow,
  type FieldPreviewRow,
} from "./field-repository"
export {
  StatisticsRepository,
  getStatisticsRepository,
  type ResolvedSeasonStat,
  type PlayerSeasonStatRow,
} from "./statistics-repository"
export {
  NewsRepository,
  getNewsRepository,
  type ResolvedNewsArticle,
  type NewsArticleView,
} from "./news-repository"
export {
  BettingRepository,
  getBettingRepository,
  type ResolvedBettingEvent,
  type BettingOutcomeView,
} from "./betting-repository"
export {
  FantasyRepository,
  getFantasyRepository,
  type ResolvedFantasyProjection,
  type ResolvedDfsSalary,
  type FantasyProjectionView,
  type DfsSalaryRow,
  type DfsSalaryCoverageCounts,
} from "./fantasy-repository"
export {
  WeatherRepository,
  getWeatherRepository,
  type WeatherSnapshotInput,
  type WeatherPeriodInput,
  type WeatherSnapshotRow,
  type WeatherPeriodRow,
  type WeatherVenueRow,
} from "./weather-repository"
export {
  OddsRepository,
  getOddsRepository,
  type OddsMarket,
  type ResolvedOddsQuote,
  type ResolvedOddsEvent,
  type OddsQuoteRow,
  type OddsEventRow,
  type PlayerOddsQuoteRow,
  type OddsCoverageCounts,
} from "./odds-repository"
export {
  PlayerSkillRepository,
  getPlayerSkillRepository,
  type PlayerSkillCoverageCounts,
} from "./player-skill-repository"
