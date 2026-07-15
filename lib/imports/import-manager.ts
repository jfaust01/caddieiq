/**
 * Import Manager — the pipeline orchestrator.
 *
 * Runs the complete ingestion workflow for one entity kind:
 *
 *   SportsDataIO Provider → Domain Mapper → Data Quality → Repositories → Report
 *
 * The manager owns ONLY orchestration: timing, structured logging, stage
 * sequencing, and aggregation into an {@link ImportResult}. It delegates every
 * unit of real work to the existing layers via an {@link ImportDefinition}, so
 * no provider access, mapping, validation, or persistence logic is duplicated
 * here. The per-entity wiring lives in `player-import.ts`, `course-import.ts`,
 * and `tournament-import.ts`.
 */

import type { EntityKind, ValidationOutcome } from "@/lib/data-quality"
import type { ProviderListResponse } from "@/lib/providers/provider"
import type { BulkRepositoryResult } from "@/lib/repositories"

import {
  MappingImportError,
  ProviderImportError,
  RepositoryImportError,
  ValidationImportError,
} from "./import-errors"
import {
  createImportLogger,
  type ImportLogger,
  type ImportLogSink,
} from "./import-logger"
import {
  finalizeImportResult,
  startImportRun,
  type ImportResult,
} from "./import-result"
import {
  createCourseImportDefinition,
  type CourseImportDeps,
} from "./course-import"
import {
  createPlayerImportDefinition,
  type PlayerImportDeps,
} from "./player-import"
import {
  createTournamentImportDefinition,
  type TournamentImportDeps,
} from "./tournament-import"

/**
 * A declarative description of one entity's pipeline. The manager runs these
 * four steps in order; each step is implemented by an existing layer.
 *
 * @typeParam TRaw    - The provider's raw record shape.
 * @typeParam TDomain - The mapped CaddieIQ domain object (must be persistable).
 */
export interface ImportDefinition<TRaw, TDomain> {
  entity: EntityKind
  /** Fetch raw records from the provider layer. */
  fetch: () => Promise<ProviderListResponse<TRaw>>
  /** Translate one raw record into a domain object (domain mapper layer). */
  map: (raw: TRaw) => TDomain
  /** Evaluate the mapped batch (data-quality layer). Never re-implemented here. */
  validate: (domain: TDomain[]) => ValidationOutcome<TDomain>
  /** Persist the valid domain objects (repository layer). */
  persist: (domain: TDomain[]) => Promise<BulkRepositoryResult<unknown>>
}

/** Injectable manager dependencies. */
export interface ImportManagerDeps {
  logger?: ImportLogger
  sink?: ImportLogSink
}

export class ImportManager {
  private readonly logger: ImportLogger

  constructor(deps: ImportManagerDeps = {}) {
    this.logger = deps.logger ?? createImportLogger(deps.sink)
  }

  /**
   * Execute a single import definition end-to-end and return its report. This
   * method never throws for data-level failures — provider, mapping,
   * validation, and persistence failures are all captured into the result so
   * the Operations Center gets one uniform, inspectable outcome.
   */
  async run<TRaw, TDomain>(
    definition: ImportDefinition<TRaw, TDomain>,
    provider: string,
  ): Promise<ImportResult> {
    const acc = startImportRun(provider, definition.entity)
    this.logger.start({ provider, entity: definition.entity })

    // --- Stage 1: fetch (provider layer) ----------------------------------
    let raw: TRaw[]
    try {
      const response = await definition.fetch()
      raw = response.data
    } catch (error) {
      acc.errors.push(
        ProviderImportError.wrap(error, { entity: definition.entity, provider }),
      )
      const result = finalizeImportResult(acc)
      this.logger.failure({ provider, entity: definition.entity, stage: "fetch" }, result)
      return result
    }

    acc.processed = raw.length

    // --- Stage 2: map (domain layer) --------------------------------------
    const mapped: TDomain[] = []
    for (const record of raw) {
      try {
        mapped.push(definition.map(record))
      } catch (error) {
        acc.failed += 1
        acc.errors.push(
          MappingImportError.wrap(error, { entity: definition.entity, provider }),
        )
      }
    }

    // --- Stage 3: validate (data-quality layer) ---------------------------
    // The validator is called as-is; we only partition its output. No
    // validation rules are re-implemented in the pipeline.
    const outcome = definition.validate(mapped)
    const valid: TDomain[] = []
    for (const { entity, report } of outcome.evaluated) {
      acc.scores.push(report.score)
      acc.warnings += report.warnings.length
      if (report.isValid) {
        valid.push(entity)
      } else {
        acc.skipped += 1
        acc.errors.push(
          new ValidationImportError(
            `Rejected by data quality (score ${report.score}).`,
            {
              entity: definition.entity,
              provider,
              reference: report.reference.externalId,
              issues: report.errors.map((issue) => issue.message),
            },
          ),
        )
      }
    }

    // --- Stage 4: persist (repository layer) ------------------------------
    if (valid.length > 0) {
      try {
        const bulk = await definition.persist(valid)
        acc.inserted += bulk.inserted
        acc.updated += bulk.updated
        acc.skipped += bulk.skipped
        acc.failed += bulk.failed
        for (const item of bulk.errors) {
          acc.errors.push(
            RepositoryImportError.wrap(item.error, {
              entity: definition.entity,
              provider,
              reference: item.reference,
            }),
          )
        }
      } catch (error) {
        // A bulk operation should not throw wholesale, but guard anyway so a
        // repository-level surprise still produces a report instead of a crash.
        acc.failed += valid.length
        acc.errors.push(
          RepositoryImportError.wrap(error, { entity: definition.entity, provider }),
        )
      }
    }

    const result = finalizeImportResult(acc)
    this.logger.finish({ provider, entity: definition.entity }, result)
    return result
  }

  /** Run the player pipeline. */
  runPlayerImport(
    deps: PlayerImportDeps,
    query?: Parameters<typeof createPlayerImportDefinition>[1],
  ): Promise<ImportResult> {
    return this.run(createPlayerImportDefinition(deps, query), deps.provider.providerName)
  }

  /** Run the course pipeline. */
  runCourseImport(
    deps: CourseImportDeps,
    query?: Parameters<typeof createCourseImportDefinition>[1],
  ): Promise<ImportResult> {
    return this.run(createCourseImportDefinition(deps, query), deps.provider.providerName)
  }

  /** Run the tournament pipeline. */
  runTournamentImport(
    deps: TournamentImportDeps,
    query?: Parameters<typeof createTournamentImportDefinition>[1],
  ): Promise<ImportResult> {
    return this.run(
      createTournamentImportDefinition(deps, query),
      deps.provider.providerName,
    )
  }
}
