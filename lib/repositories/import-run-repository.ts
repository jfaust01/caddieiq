/**
 * Import-run repository.
 *
 * The durable audit trail for every import execution. Unlike the domain
 * repositories this one is append-only: each row is an immutable fact about one
 * run (see the `ImportRun` model). It is the single source the admin Data
 * Coverage dashboard reads to show REAL import health — status, row counts, and
 * the last error per entity — instead of inferring "last import" from a table's
 * `max(updatedAt)`, which cannot tell a successful run from an empty or failed
 * one.
 *
 * Writes go through {@link recordImportRun} (see `lib/imports/run-recorder.ts`);
 * this module owns persistence and the read queries the dashboard needs.
 */

import type { ImportRun, ImportRunStatus, PrismaClient } from "@/lib/generated/prisma/client"
import { Prisma } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

/** The persisted fields of a single import run (id/createdAt are assigned by the DB). */
export interface ImportRunInput {
  provider: string
  entity: string
  status: ImportRunStatus
  startedAt: Date
  finishedAt: Date
  durationMs: number
  processed: number
  inserted: number
  updated: number
  skipped: number
  failed: number
  warnings: number
  summary: string | null
  error: string | null
}

/** The latest run for one entity, as the dashboard renders it. */
export interface LatestEntityRun {
  entity: string
  provider: string
  status: ImportRunStatus
  startedAt: Date
  finishedAt: Date
  durationMs: number
  processed: number
  inserted: number
  updated: number
  skipped: number
  failed: number
  warnings: number
  summary: string | null
  error: string | null
}

export class ImportRunRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  /** Persist one completed (or failed) import run. Returns the stored row. */
  async record(input: ImportRunInput): Promise<ImportRun> {
    return this.prisma.importRun.create({ data: input })
  }

  /** Alias for record() for convenience. */
  async create(input: ImportRunInput): Promise<ImportRun> {
    return this.record(input)
  }

  /**
   * The most recent run for every entity that has ever run, newest first. Uses
   * `DISTINCT ON (entity)` so the dashboard gets exactly one row per pipeline —
   * the current health of each feed — in a single query.
   */
  async latestPerEntity(): Promise<LatestEntityRun[]> {
    return this.prisma.$queryRaw<LatestEntityRun[]>(Prisma.sql`
      SELECT DISTINCT ON (entity)
        entity,
        provider,
        status,
        "startedAt",
        "finishedAt",
        "durationMs",
        processed,
        inserted,
        updated,
        skipped,
        failed,
        warnings,
        summary,
        error
      FROM import_runs
      ORDER BY entity, "startedAt" DESC
    `)
  }

  /** The most recent runs across all entities (for an activity feed). */
  async listRecent(limit = 50): Promise<ImportRun[]> {
    return this.prisma.importRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    })
  }

  /** The most recent run for a single entity, or null when it has never run. */
  async latestForEntity(entity: string): Promise<ImportRun | null> {
    return this.prisma.importRun.findFirst({
      where: { entity },
      orderBy: { startedAt: "desc" },
    })
  }
}

let _importRunRepository: ImportRunRepository | undefined
export function getImportRunRepository(): ImportRunRepository {
  return (_importRunRepository ??= new ImportRunRepository())
}
