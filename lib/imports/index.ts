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
 * repository. Tour/season resolution can be supplied via `resolveRelations`;
 * without it, existing tournaments update and brand-new ones are reported as
 * relationship failures (see `tournament-import.ts`).
 */
export function runTournamentImport(
  options: RunImportOptions & {
    resolveRelations?: TournamentImportDeps["resolveRelations"]
  } = {},
): Promise<ImportResult> {
  const manager = resolveManager(options)
  return manager.runTournamentImport(
    {
      provider: SportsDataProvider.fromEnv(),
      repository: getTournamentRepository(),
      resolveRelations: options.resolveRelations,
    },
    options.query,
  )
}
