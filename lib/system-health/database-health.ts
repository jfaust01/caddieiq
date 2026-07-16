import "server-only"

import { prisma } from "@/lib/prisma"

/** Status of a database table for display and filtering. */
export type TableStatus = "Healthy" | "Waiting" | "Expected Empty" | "Import Pending" | "Unused" | "Future Feature" | "Error" | "Critical"

/** Health severity level. */
export type Severity = "info" | "warning" | "critical"

/** A single table's health snapshot. */
export interface TableHealthReport {
  tableName: string
  rowCount: number
  status: TableStatus
  purpose: string
  expected: boolean
  lastUpdatedAt: string | null
  healthScore: number
  explanation?: string
}

/** A single import pipeline card. */
export interface ImportPipelineCard {
  name: string
  status: TableStatus
  lastRunAt: string | null
  durationMs: number | null
  rowsImported: number | null
  errors: number | null
  supportsManualRefresh: boolean
}

/** A system warning. */
export interface SystemWarning {
  id: string
  severity: Severity
  title: string
  reason: string
  suggestedAction: string
}

/** KPI metrics for the database. */
export interface DatabaseKpis {
  totalTables: number
  totalRows: number
  databaseSizeGb: number | null
  lastImportAt: string | null
  lastSuccessfulImportAt: string | null
  failedImportsLast24h: number
  averageImportDurationMs: number | null
}

/** Overall database health report. */
export interface DatabaseHealthReport {
  generatedAt: string
  overallStatus: "Healthy" | "Warning" | "Critical"
  healthPercentage: number
  kpis: DatabaseKpis
  tables: TableHealthReport[]
  pipelines: ImportPipelineCard[]
  warnings: SystemWarning[]
}

/**
 * Calculate overall health percentage from various metrics.
 * Weighted scoring: import success (40%), table population (40%), pipeline health (20%).
 */
function calculateHealthPercentage(
  tables: TableHealthReport[],
  pipelines: ImportPipelineCard[],
  warnings: SystemWarning[],
): number {
  // Start with 100
  let score = 100

  // Deduct for warnings (5-15 points per warning based on severity)
  const criticalWarnings = warnings.filter((w) => w.severity === "critical").length
  const normalWarnings = warnings.filter((w) => w.severity === "warning").length
  score -= criticalWarnings * 15
  score -= normalWarnings * 5

  // Deduct for unhealthy tables (10 points per critical/error table)
  const unhealthyTables = tables.filter((t) => t.status === "Error" || t.status === "Critical").length
  score -= unhealthyTables * 10

  // Deduct for stalled imports (5 points per import pending >24h)
  const stalledPipelines = pipelines.filter((p) => p.status === "Import Pending").length
  score -= stalledPipelines * 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Determine overall status from health percentage and warning count.
 */
function determineOverallStatus(
  healthPercentage: number,
  criticalWarningCount: number,
): "Healthy" | "Warning" | "Critical" {
  if (healthPercentage >= 90 && criticalWarningCount === 0) return "Healthy"
  if (healthPercentage >= 70 || criticalWarningCount <= 1) return "Warning"
  return "Critical"
}

/**
 * Get basic table counts and metadata from database.
 */
async function getTableMetrics(): Promise<{
  tables: TableHealthReport[]
  totalRows: number
}> {
  const tables: TableHealthReport[] = []
  let totalRows = 0

  // Core tables - always populated
  const users = await prisma.user.count()
  tables.push({
    tableName: "users",
    rowCount: users,
    status: users > 0 ? "Healthy" : "Error",
    purpose: "Application users and authentication",
    expected: true,
    lastUpdatedAt: new Date().toISOString(),
    healthScore: users > 0 ? 100 : 0,
  })
  totalRows += users

  const tours = await prisma.tour.count()
  tables.push({
    tableName: "tours",
    rowCount: tours,
    status: tours > 0 ? "Healthy" : "Critical",
    purpose: "Golf tours (PGA, LIV, LPGA, etc.)",
    expected: true,
    lastUpdatedAt: new Date().toISOString(),
    healthScore: tours > 0 ? 100 : 0,
    explanation: tours === 0 ? "Foundational data missing - requires initial import" : undefined,
  })
  totalRows += tours

  const courses = await prisma.course.count({
    where: { deletedAt: null },
  })
  tables.push({
    tableName: "courses",
    rowCount: courses,
    status: courses > 0 ? "Healthy" : "Critical",
    purpose: "Golf courses from imported tournaments",
    expected: true,
    lastUpdatedAt: new Date().toISOString(),
    healthScore: courses > 0 ? 100 : 0,
    explanation: courses === 0 ? "No courses imported yet - run tournament import" : undefined,
  })
  totalRows += courses

  // Event-driven tables
  const tournaments = await prisma.tournament.count({
    where: { deletedAt: null },
  })
  tables.push({
    tableName: "tournaments",
    rowCount: tournaments,
    status: tournaments > 0 ? "Healthy" : "Expected Empty",
    purpose: "Tournament schedules and metadata",
    expected: false,
    lastUpdatedAt: tournaments > 0 ? new Date().toISOString() : null,
    healthScore: tournaments > 0 ? 100 : 50,
    explanation: tournaments === 0 ? "Tournaments imported as scheduled - off-season may be empty" : undefined,
  })
  totalRows += tournaments

  const players = await prisma.player.count({
    where: { deletedAt: null },
  })
  tables.push({
    tableName: "players",
    rowCount: players,
    status: players > 0 ? "Healthy" : "Import Pending",
    purpose: "Player roster and career data",
    expected: false,
    lastUpdatedAt: players > 0 ? new Date().toISOString() : null,
    healthScore: players > 0 ? 100 : 30,
    explanation: players === 0 ? "Awaiting player import - check import status" : undefined,
  })
  totalRows += players

  const rounds = await prisma.round.count()
  tables.push({
    tableName: "rounds",
    rowCount: rounds,
    status: rounds > 0 ? "Healthy" : "Expected Empty",
    purpose: "Tournament rounds during events",
    expected: false,
    lastUpdatedAt: rounds > 0 ? new Date().toISOString() : null,
    healthScore: rounds > 0 ? 100 : 50,
    explanation: rounds === 0 ? "Populated during active tournament play" : undefined,
  })
  totalRows += rounds

  const courseCharacteristics = await prisma.courseCharacteristic.count()
  tables.push({
    tableName: "courseCharacteristics",
    rowCount: courseCharacteristics,
    status: courseCharacteristics > 0 ? "Healthy" : "Import Pending",
    purpose: "Derived course intelligence (shot weights, confidence)",
    expected: false,
    lastUpdatedAt: courseCharacteristics > 0 ? new Date().toISOString() : null,
    healthScore: courseCharacteristics > 0 ? 100 : 40,
    explanation:
      courseCharacteristics === 0 ? "Run course enrichment pipeline - see docs/COURSE_CHARACTERISTICS_ENRICHMENT.md" : undefined,
  })
  totalRows += courseCharacteristics

  const weatherSnapshots = await prisma.weatherSnapshot.count()
  tables.push({
    tableName: "weatherSnapshots",
    rowCount: weatherSnapshots,
    status: weatherSnapshots > 0 ? "Healthy" : "Waiting",
    purpose: "Weather forecasts for upcoming tournaments",
    expected: false,
    lastUpdatedAt: weatherSnapshots > 0 ? new Date().toISOString() : null,
    healthScore: weatherSnapshots > 0 ? 100 : 50,
    explanation:
      weatherSnapshots === 0 ? "No tournaments within 6-day forecast window - expected off-season" : undefined,
  })
  totalRows += weatherSnapshots

  const weatherPeriods = await prisma.weatherPeriod.count()
  tables.push({
    tableName: "weatherPeriods",
    rowCount: weatherPeriods,
    status: weatherPeriods > 0 ? "Healthy" : "Waiting",
    purpose: "Individual weather periods (3-hour forecast blocks)",
    expected: false,
    lastUpdatedAt: weatherPeriods > 0 ? new Date().toISOString() : null,
    healthScore: weatherPeriods > 0 ? 100 : 50,
    explanation: weatherPeriods === 0 ? "Populated with weather snapshots when tournaments are in forecast window" : undefined,
  })
  totalRows += weatherPeriods

  const dfsSalaries = await prisma.dfsSalary.count()
  tables.push({
    tableName: "dfsSalaries",
    rowCount: dfsSalaries,
    status: dfsSalaries > 0 ? "Healthy" : "Expected Empty",
    purpose: "DraftKings salary data for upcoming tournaments",
    expected: false,
    lastUpdatedAt: dfsSalaries > 0 ? new Date().toISOString() : null,
    healthScore: dfsSalaries > 0 ? 100 : 50,
    explanation:
      dfsSalaries === 0 ? "DraftKings releases salaries ~3 days before tournament start - expected before week" : undefined,
  })
  totalRows += dfsSalaries

  return { tables, totalRows }
}

/**
 * Get import pipeline status from recent import logs.
 */
async function getImportPipelines(): Promise<ImportPipelineCard[]> {
  const pipelines: ImportPipelineCard[] = []

  // Check for recent import runs
  const recentImports = await prisma.importRun.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Aggregate by entity
  const byEntity: Record<string, (typeof recentImports)[0][]> = {}
  for (const run of recentImports) {
    if (!byEntity[run.entity]) byEntity[run.entity] = []
    byEntity[run.entity].push(run)
  }

  const entities: Array<{
    name: string
    entity: string
    supports_manual: boolean
  }> = [
    { name: "Players", entity: "player", supports_manual: true },
    { name: "Courses", entity: "course", supports_manual: true },
    { name: "Tournaments", entity: "tournament", supports_manual: true },
    { name: "Weather", entity: "weather", supports_manual: true },
    { name: "DFS Salaries", entity: "fantasy", supports_manual: false },
    { name: "Rankings", entity: "ranking", supports_manual: false },
  ]

  for (const entityInfo of entities) {
    const runs = byEntity[entityInfo.entity] || []
    const lastRun = runs[0] || null

    pipelines.push({
      name: entityInfo.name,
      status: lastRun
        ? lastRun.status === "SUCCESS"
          ? "Healthy"
          : lastRun.status === "FAILURE"
            ? "Error"
            : "Import Pending"
        : "Import Pending",
      lastRunAt: lastRun ? lastRun.createdAt.toISOString() : null,
      durationMs: lastRun?.durationMs || null,
      rowsImported: lastRun?.inserted || null,
      errors: lastRun?.failed || null,
      supportsManualRefresh: entityInfo.supports_manual,
    })
  }

  return pipelines
}

/**
 * Generate system warnings based on current database state.
 */
async function generateWarnings(): Promise<SystemWarning[]> {
  const warnings: SystemWarning[] = []

  // Check for courses without coordinates
  const coursesNoCoordinates = await prisma.course.count({
    where: {
      deletedAt: null,
      OR: [{ latitude: null }, { longitude: null }],
    },
  })
  if (coursesNoCoordinates > 0) {
    warnings.push({
      id: "courses_no_coordinates",
      severity: "warning",
      title: "Courses Missing Coordinates",
      reason: `${coursesNoCoordinates} courses lack GPS coordinates, preventing weather forecasts`,
      suggestedAction: "Update course records with coordinates or re-import with location data",
    })
  }

  // Check for stale player imports
  const lastPlayerImport = await prisma.importRun.findFirst({
    where: { entity: "player" },
    orderBy: { createdAt: "desc" },
  })
  if (!lastPlayerImport || Date.now() - lastPlayerImport.createdAt.getTime() > 5 * 24 * 60 * 60 * 1000) {
    warnings.push({
      id: "stale_player_import",
      severity: "warning",
      title: "Stale Player Data",
      reason: "Player import is more than 5 days old - roster may be outdated",
      suggestedAction: "Trigger player import or check import pipeline status",
    })
  }

  // Check for failed imports
  const failedRecently = await prisma.importRun.count({
    where: {
      status: "FAILURE",
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  })
  if (failedRecently > 0) {
    warnings.push({
      id: "recent_import_failures",
      severity: "warning",
      title: "Recent Import Failures",
      reason: `${failedRecently} import runs failed in the last 24 hours`,
      suggestedAction: "Check import logs for error details and investigate",
    })
  }

  // Check for no tournaments when expecting them (mid-season)
  const tournaments = await prisma.tournament.count({
    where: { deletedAt: null },
  })
  const now = new Date()
  const isOffseason = now.getMonth() < 10 // Rough approximation
  if (tournaments === 0 && !isOffseason) {
    warnings.push({
      id: "no_tournaments",
      severity: "critical",
      title: "No Tournaments Found",
      reason: "No tournaments in database during peak season",
      suggestedAction: "Check if tournament import is running or if data source is available",
    })
  }

  return warnings
}

/**
 * Get database KPIs and metrics.
 */
async function getDatabaseKpis(): Promise<DatabaseKpis> {
  const [totalTables, lastImport] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT tablename) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `,
    prisma.importRun.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  ])

  const lastSuccessfulImport = await prisma.importRun.findFirst({
    where: { status: "SUCCESS" },
    orderBy: { createdAt: "desc" },
  })

  const failedLast24h = await prisma.importRun.count({
    where: {
      status: "FAILURE",
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  })

  // Count all rows across major tables for total rows estimate
  const [users, tours, courses, tournaments, players] = await Promise.all([
    prisma.user.count(),
    prisma.tour.count(),
    prisma.course.count(),
    prisma.tournament.count(),
    prisma.player.count(),
  ])
  const totalRows = users + tours + courses + tournaments + players

  // Calculate average import duration from recent successful imports
  const recentSuccessful = await prisma.importRun.findMany({
    where: { status: "SUCCESS" },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  const avgDuration =
    recentSuccessful.length > 0
      ? Math.round(recentSuccessful.reduce((acc, run) => acc + (run.durationMs || 0), 0) / recentSuccessful.length)
      : null

  return {
    totalTables: totalTables[0]?.count || 0,
    totalRows,
    databaseSizeGb: null, // Could query pg_database_size if needed
    lastImportAt: lastImport ? lastImport.createdAt.toISOString() : null,
    lastSuccessfulImportAt: lastSuccessfulImport ? lastSuccessfulImport.createdAt.toISOString() : null,
    failedImportsLast24h: failedLast24h,
    averageImportDurationMs: avgDuration,
  }
}

/**
 * Generate the complete database health report.
 */
export async function getDatabaseHealthReport(): Promise<DatabaseHealthReport> {
  const generatedAt = new Date().toISOString()

  const [{ tables, totalRows }, pipelines, warnings, kpis] = await Promise.all([
    getTableMetrics(),
    getImportPipelines(),
    generateWarnings(),
    getDatabaseKpis(),
  ])

  const healthPercentage = calculateHealthPercentage(tables, pipelines, warnings)
  const overallStatus = determineOverallStatus(healthPercentage, warnings.filter((w) => w.severity === "critical").length)

  return {
    generatedAt,
    overallStatus,
    healthPercentage,
    kpis: { ...kpis, totalRows },
    tables,
    pipelines,
    warnings,
  }
}
