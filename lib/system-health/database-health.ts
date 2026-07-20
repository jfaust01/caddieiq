import "server-only"

import { prisma } from "@/lib/prisma"
import { getTableConfig } from "./table-config"

/** Status of a database table for display and filtering. */
export type TableStatus = "Healthy" | "Waiting" | "Expected Empty" | "Import Pending" | "Unused" | "Future Feature" | "Error" | "Critical"

/** Health severity level. */
export type Severity = "info" | "warning" | "critical"

/** Data provider for a table. */
export type DataProvider = "sportsdataio" | "golfcourseapi" | "internal" | "multiple"

/** Sync state for a table. */
export type SyncState = "synced" | "awaiting-import" | "pending-verification" | "not-generated" | "error"

/** A single table's health snapshot. */
export interface TableHealthReport {
  tableName: string
  rowCount: number
  status: TableStatus
  purpose: string
  expected: boolean
  lastUpdatedAt: string | null
  healthScore: number
  provider: DataProvider
  syncState: SyncState
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
  if (criticalWarningCount > 0 || healthPercentage < 50) {
    return "Critical"
  }
  if (healthPercentage < 75) {
    return "Warning"
  }
  return "Healthy"
}

/**
 * Helper to safely query a table with error handling and structured logging.
 */
async function safeCountTable(
  name: string,
  countFn: () => Promise<number>,
): Promise<{ count: number; error: string | null }> {
  try {
    console.log(`[v0] [DatabaseHealth] Loading ${name}...`)
    const count = await countFn()
    console.log(`[v0] [DatabaseHealth] ✓ ${name}: ${count} rows`)
    return { count, error: null }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[v0] [DatabaseHealth] ✗ ${name} failed: ${errorMsg}`)
    return { count: 0, error: errorMsg }
  }
}

/**
 * Factory function to create TableHealthReport with provider and sync state.
 */
function createTableReport(
  tableName: string,
  rowCount: number,
  status: TableStatus,
  purpose: string,
  expected: boolean,
  healthScore: number,
  lastUpdatedAt: string | null = null,
  explanation?: string,
): TableHealthReport {
  const config = getTableConfig(tableName)
  return {
    tableName,
    rowCount,
    status,
    purpose,
    expected,
    lastUpdatedAt,
    healthScore,
    provider: config.provider,
    syncState: config.syncState,
    explanation,
  }
}

/**
 * Get table metrics for database health report with graceful degradation.
 * If one table query fails, the page still renders with remaining tables and error indicators.
 */
async function getTableMetrics(): Promise<{ tables: TableHealthReport[]; totalRows: number }> {
  const tables: TableHealthReport[] = []
  let totalRows = 0

  // User management tables
  const usersResult = await safeCountTable("users", () => prisma.user.count())
  if (!usersResult.error) {
    tables.push(
      createTableReport(
        "users",
        usersResult.count,
        usersResult.count > 0 ? "Healthy" : "Expected Empty",
        "User accounts",
        false,
        usersResult.count > 0 ? 100 : 50,
        null,
        usersResult.count === 0 ? "Create users to access the system" : undefined,
      ),
    )
    totalRows += usersResult.count
  } else {
    tables.push(
      createTableReport(
        "users",
        0,
        "Error",
        "User accounts",
        false,
        0,
        null,
        `⚠ Failed to load: ${usersResult.error}`,
      ),
    )
  }

  // Golf tour/event tables
  const toursResult = await safeCountTable("tours", () => prisma.tour.count())
  if (!toursResult.error) {
    tables.push(
    createTableReport(
      "tours",
      toursResult.count,
      toursResult.count > 0 ? "Healthy" : "Waiting",
      "Golf tours (PGA, DP World Tour, etc.)",
      false,
      toursResult.count > 0 ? 100 : 50,
      toursResult.count > 0 ? new Date().toISOString() : null,
      toursResult.count === 0 ? "Populated by external data import" : undefined,
    ),
  )
    totalRows += toursResult.count
  } else {
tables.push(
    createTableReport(
      "tours",
      0,
      "Error",
      "Golf tours (PGA, DP World Tour, etc.)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  // GolfCourseAPI integration tables
  const coursesResult = await safeCountTable("courses", () =>
    prisma.course.count({
      where: { deletedAt: null },
    }),
  )

  if (!coursesResult.error) {
    const coursesNoLocationResult = await safeCountTable("courses without location", () =>
      prisma.course.count({
        where: {
          deletedAt: null,
          OR: [{ latitude: null }, { longitude: null }],
        },
      }),
    )

tables.push(
    createTableReport(
      "courses",
      coursesResult.count,
      coursesResult.count > 0 ? "Healthy" : "Waiting",
      "Golf courses from GolfCourseAPI",
      false,
      coursesResult.count > 0 && !coursesNoLocationResult.error,
      coursesResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += coursesResult.count
  } else {
tables.push(
    createTableReport(
      "courses",
      0,
      "Error",
      "Golf courses from GolfCourseAPI",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  const tournamentsResult = await safeCountTable("tournaments", () =>
    prisma.tournament.count({
      where: { deletedAt: null },
    }),
  )
  if (!tournamentsResult.error) {
    tables.push(
    createTableReport(
      "tournaments",
      tournamentsResult.count,
      tournamentsResult.count > 0 ? "Healthy" : "Waiting",
      "Tournament events",
      false,
      tournamentsResult.count > 0 ? 100 : 50,
      tournamentsResult.count > 0 ? new Date().toISOString() : null,
      tournamentsResult.count === 0 ? "Run tournament import for upcoming season" : undefined,
    ),
  )
    totalRows += tournamentsResult.count
  } else {
tables.push(
    createTableReport(
      "tournaments",
      0,
      "Error",
      "Tournament events",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  const playersResult = await safeCountTable("players", () =>
    prisma.player.count({
      where: { deletedAt: null },
    }),
  )
  if (!playersResult.error) {
    tables.push(
    createTableReport(
      "players",
      playersResult.count,
      playersResult.count > 0 ? "Healthy" : "Waiting",
      "Professional golfers",
      false,
      playersResult.count > 0 ? 100 : 50,
      playersResult.count > 0 ? new Date().toISOString() : null,
      playersResult.count === 0 ? "Run player import" : undefined,
    ),
  )
    totalRows += playersResult.count
  } else {
tables.push(
    createTableReport(
      "players",
      0,
      "Error",
      "Professional golfers",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  // Rounds (user generated content)
  const roundsResult = await safeCountTable("rounds", () => prisma.round.count())
  if (!roundsResult.error) {
    tables.push(
    createTableReport(
      "rounds",
      roundsResult.count,
      roundsResult.count > 0 ? "Healthy" : "Expected Empty",
      "User-recorded golf rounds",
      false,
      roundsResult.count > 0 ? 100 : 50,
      roundsResult.count > 0 ? new Date().toISOString() : null,
      roundsResult.count === 0 ? "Users will create rounds as they play" : undefined,
    ),
  )
    totalRows += roundsResult.count
  } else {
tables.push(
    createTableReport(
      "rounds",
      0,
      "Error",
      "User-recorded golf rounds",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  // Course characteristics / ratings
  const courseCharacteristicsResult = await safeCountTable("courseCharacteristics", () =>
    prisma.courseCharacteristic.count(),
  )
  if (!courseCharacteristicsResult.error) {
    tables.push(
    createTableReport(
      "courseCharacteristics",
      courseCharacteristicsResult.count,
      courseCharacteristicsResult.count > 0 ? "Healthy" : "Waiting",
      "Course difficulty ratings (USGA course/slope)",
      false,
      courseCharacteristicsResult.count > 0 ? 100 : 50,
      courseCharacteristicsResult.count > 0 ? new Date().toISOString() : null,
      courseCharacteristicsResult.count === 0 ? "Populated with course intelligence" : undefined,
    ),
  )
    totalRows += courseCharacteristicsResult.count
  } else {
tables.push(
    createTableReport(
      "courseCharacteristics",
      0,
      "Error",
      "Course difficulty ratings (USGA course/slope)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  // Weather data
  const weatherSnapshotsResult = await safeCountTable("weatherSnapshots", () =>
    prisma.weatherSnapshot.count(),
  )
  if (!weatherSnapshotsResult.error) {
    tables.push(
    createTableReport(
      "weatherSnapshots",
      weatherSnapshotsResult.count,
      weatherSnapshotsResult.count > 0 ? "Healthy" : "Waiting",
      "Weather forecast snapshots (one per tournament per day)",
      false,
      weatherSnapshotsResult.count > 0 ? 100 : 50,
      weatherSnapshotsResult.count > 0 ? new Date().toISOString() : null,
      weatherSnapshotsResult.count === 0 ? "No tournaments within 6-day forecast window - expected off-season" : undefined,
    ),
  )
    totalRows += weatherSnapshotsResult.count
  } else {
tables.push(
    createTableReport(
      "weatherSnapshots",
      0,
      "Error",
      "Weather forecast snapshots (one per tournament per day)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  const weatherPeriodsResult = await safeCountTable("weatherPeriods", () => prisma.weatherPeriod.count())
  if (!weatherPeriodsResult.error) {
    tables.push(
    createTableReport(
      "weatherPeriods",
      weatherPeriodsResult.count,
      weatherPeriodsResult.count > 0 ? "Healthy" : "Waiting",
      "Individual weather periods (3-hour forecast blocks)",
      false,
      weatherPeriodsResult.count > 0 ? 100 : 50,
      weatherPeriodsResult.count > 0 ? new Date().toISOString() : null,
      weatherPeriodsResult.count === 0
          ? "Populated with weather snapshots when tournaments are in forecast window"
          : undefined,
    ),
  )
    totalRows += weatherPeriodsResult.count
  } else {
tables.push(
    createTableReport(
      "weatherPeriods",
      0,
      "Error",
      "Individual weather periods (3-hour forecast blocks)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  // Phase 13.1: Normalized GolfCourseAPI Entities - with graceful degradation
  const courseDetailsResult = await safeCountTable("courseDetails", () => prisma.courseDetails.count())
  let courseDetailsCount = 0
  if (!courseDetailsResult.error) {
    courseDetailsCount = courseDetailsResult.count
    tables.push(
    createTableReport(
      "courseDetails",
      courseDetailsCount,
      courseDetailsCount > 0 ? "Healthy" : "Waiting",
      "GolfCourseAPI course details (anchor)",
      false,
      courseDetailsCount > 0 ? 100 : 50,
      courseDetailsCount > 0 ? new Date().toISOString() : null,
      courseDetailsCount === 0
          ? "Awaiting course intelligence import - run when courses are synced"
          : undefined,
    ),
  )
    totalRows += courseDetailsCount
  } else {
    tables.push(
    createTableReport(
      "courseDetails",
      0,
      "Waiting",
      "GolfCourseAPI course details (anchor)",
      false,
      0,
      null,
      `Phase 13.1 tables not yet migrated: Run 'pnpm prisma migrate deploy'`,
    ),
  )
  }

  const courseHolesResult = await safeCountTable("courseHoles", () => prisma.courseHole.count())
  let courseHolesCount = 0
  if (!courseHolesResult.error) {
    courseHolesCount = courseHolesResult.count
    const courseHolesBySplit = courseDetailsCount > 0 ? Math.floor(courseHolesCount / courseDetailsCount) : 0
    const holesHealthy = courseHolesBySplit === 18
tables.push(
    createTableReport(
      "courseHoles",
      courseHolesCount,
      courseHolesCount > courseDetailsCount * 17 ? "Healthy" : "Waiting",
      "Individual golf holes (1-18 per course)",
      false,
      holesHealthy ? 100 : 60,
      courseHolesCount > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseHolesCount
  } else {
tables.push(
    createTableReport(
      "courseHoles",
      0,
      "Error",
      "Individual golf holes (1-18 per course)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  const courseTeesResult = await safeCountTable("courseTees", () => prisma.courseTee.count())
  let courseTeesCount = 0
  if (!courseTeesResult.error) {
    courseTeesCount = courseTeesResult.count
    const courseTeesPerCourse = courseDetailsCount > 0 ? Math.floor(courseTeesCount / courseDetailsCount) : 0
tables.push(
    createTableReport(
      "courseTees",
      courseTeesCount,
      courseTeesCount > courseDetailsCount ? "Healthy" : "Waiting",
      "Tee boxes per course (Blue, White, Red, etc.)",
      false,
      courseTeesCount > courseDetailsCount * 2 ? 100 : 60,
      courseTeesCount > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseTeesCount
  } else {
tables.push(
    createTableReport(
      "courseTees",
      0,
      "Error",
      "Tee boxes per course (Blue, White, Red, etc.)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  const mappingsResult = await safeCountTable("tournamentCourseMappings", () =>
    prisma.tournamentCourseMapping.count(),
  )
  if (!mappingsResult.error) {
    let verifiedMappingsCount = 0
    try {
      verifiedMappingsCount = await prisma.tournamentCourseMapping.count({
        where: { verified: true },
      })
    } catch {
      verifiedMappingsCount = 0
    }
    const mappingScore = mappingsResult.count > 0 ? Math.floor((verifiedMappingsCount / mappingsResult.count) * 100) : 0
tables.push(
    createTableReport(
      "tournamentCourseMappings",
      mappingsResult.count,
      mappingsResult.count > 0 && mappingScore >= 80 ? "Healthy" : mappingsResult.count > 0 ? "Warning" : "Waiting",
      "Tournament → GolfCourseAPI course mappings",
      false,
      mappingScore,
      mappingsResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += mappingsResult.count
  } else {
tables.push(
    createTableReport(
      "tournamentCourseMappings",
      0,
      "Error",
      "Tournament → GolfCourseAPI course mappings",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  const courseIntelligenceResult = await safeCountTable("courseIntelligence", () =>
    prisma.courseIntelligence.count(),
  )
  if (!courseIntelligenceResult.error) {
tables.push(
    createTableReport(
      "courseIntelligence",
      courseIntelligenceResult.count,
      courseIntelligenceResult.count === courseDetailsCount,
      "Calculated course metrics (difficulty, driving importance, etc.)",
      false,
      courseDetailsCount > 0 ? Math.floor((courseIntelligenceResult.count / courseDetailsCount) * 100) : 50,
      courseIntelligenceResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseIntelligenceResult.count
  } else {
tables.push(
    createTableReport(
      "courseIntelligence",
      0,
      "Error",
      "Calculated course metrics (difficulty, driving importance, etc.)",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

  // Phase 13.1: Normalized GolfCourseAPI Entities - Safe queries with fallback
  const courseAddressesResult = await safeCountTable("courseAddresses", () => prisma.courseAddress.count())
  if (!courseAddressesResult.error) {
tables.push(
    createTableReport(
      "courseAddresses",
      courseAddressesResult.count,
      courseAddressesResult.count === courseDetailsCount,
      "Normalized addresses (city, state, country, phone, website)",
      false,
      courseDetailsCount > 0 ? Math.floor((courseAddressesResult.count / courseDetailsCount) * 100) : 50,
      courseAddressesResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseAddressesResult.count
  } else {
    tables.push(
    createTableReport(
      "courseAddresses",
      0,
      "Waiting",
      "Normalized addresses (city, state, country, phone, website)",
      false,
      0,
      null,
      "Phase 13.1: Run 'pnpm prisma migrate deploy'",
    ),
  )
  }

  const courseCoordinatesResult = await safeCountTable("courseCoordinates", () =>
    prisma.courseCoordinates.count(),
  )
  if (!courseCoordinatesResult.error) {
tables.push(
    createTableReport(
      "courseCoordinates",
      courseCoordinatesResult.count,
      courseCoordinatesResult.count === courseDetailsCount,
      "Normalized GPS coordinates (latitude, longitude, elevation)",
      false,
      courseDetailsCount > 0 ? Math.floor((courseCoordinatesResult.count / courseDetailsCount) * 100) : 50,
      courseCoordinatesResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseCoordinatesResult.count
  } else {
    tables.push(
    createTableReport(
      "courseCoordinates",
      0,
      "Waiting",
      "Normalized GPS coordinates (latitude, longitude, elevation)",
      false,
      0,
      null,
      "Phase 13.1: Run 'pnpm prisma migrate deploy'",
    ),
  )
  }

  const courseSpecificationsResult = await safeCountTable("courseSpecifications", () =>
    prisma.courseSpecifications.count(),
  )
  if (!courseSpecificationsResult.error) {
tables.push(
    createTableReport(
      "courseSpecifications",
      courseSpecificationsResult.count,
      courseSpecificationsResult.count === courseDetailsCount,
      "Normalized specs (par, yardage, USGA rating, slope)",
      false,
      courseDetailsCount > 0 ? Math.floor((courseSpecificationsResult.count / courseDetailsCount) * 100) : 50,
      courseSpecificationsResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseSpecificationsResult.count
  } else {
    tables.push(
    createTableReport(
      "courseSpecifications",
      0,
      "Waiting",
      "Normalized specs (par, yardage, USGA rating, slope)",
      false,
      0,
      null,
      "Phase 13.1: Run 'pnpm prisma migrate deploy'",
    ),
  )
  }

  const courseMetadataResult = await safeCountTable("courseMetadata", () => prisma.courseMetadata.count())
  if (!courseMetadataResult.error) {
tables.push(
    createTableReport(
      "courseMetadata",
      courseMetadataResult.count,
      courseMetadataResult.count === courseDetailsCount,
      "Normalized metadata (architect, year built, style, facilities)",
      false,
      courseDetailsCount > 0 ? Math.floor((courseMetadataResult.count / courseDetailsCount) * 100) : 50,
      courseMetadataResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += courseMetadataResult.count
  } else {
    tables.push(
    createTableReport(
      "courseMetadata",
      0,
      "Waiting",
      "Normalized metadata (architect, year built, style, facilities)",
      false,
      0,
      null,
      "Phase 13.1: Run 'pnpm prisma migrate deploy'",
    ),
  )
  }

  const playingConditionsResult = await safeCountTable("playingConditions", () =>
    prisma.playingConditions.count(),
  )
  if (!playingConditionsResult.error) {
tables.push(
    createTableReport(
      "playingConditions",
      playingConditionsResult.count,
      playingConditionsResult.count > 0 ? "Healthy" : "Waiting",
      "Playing conditions (grass types, green conditions, historical)",
      false,
      playingConditionsResult.count > 0 ? 100 : 50,
      playingConditionsResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += playingConditionsResult.count
  } else {
    tables.push(
    createTableReport(
      "playingConditions",
      0,
      "Waiting",
      "Playing conditions (grass types, green conditions, historical)",
      false,
      0,
      null,
      "Phase 13.1: Run 'pnpm prisma migrate deploy'",
    ),
  )
  }

  const teeHoleYardagesResult = await safeCountTable("teeHoleYardages", () => prisma.teeHoleYardage.count())
  if (!teeHoleYardagesResult.error) {
    const expectedYardages = Math.max(courseHolesCount * (courseTeesCount / (courseDetailsCount || 1)), 1)
tables.push(
    createTableReport(
      "teeHoleYardages",
      teeHoleYardagesResult.count,
      teeHoleYardagesResult.count > expectedYardages,
      "Per-tee per-hole yardages (matrix: tees × holes)",
      false,
      expectedYardages > 0 ? Math.floor((teeHoleYardagesResult.count / expectedYardages) * 100) : 50,
      teeHoleYardagesResult.count > 0 ? new Date().toISOString() : null,
      undefined,
    ),
  )
    totalRows += teeHoleYardagesResult.count
  } else {
    tables.push(
    createTableReport(
      "teeHoleYardages",
      0,
      "Waiting",
      "Per-tee per-hole yardages (matrix: tees × holes)",
      false,
      0,
      null,
      "Phase 13.1: Run 'pnpm prisma migrate deploy'",
    ),
  )
  }

  const dfsSalariesResult = await safeCountTable("dfsSalaries", () => prisma.dfsSalary.count())
  if (!dfsSalariesResult.error) {
    tables.push(
    createTableReport(
      "dfsSalaries",
      dfsSalariesResult.count,
      dfsSalariesResult.count > 0 ? "Healthy" : "Expected Empty",
      "DraftKings salary data for upcoming tournaments",
      false,
      dfsSalariesResult.count > 0 ? 100 : 50,
      dfsSalariesResult.count > 0 ? new Date().toISOString() : null,
      dfsSalariesResult.count === 0
          ? "DraftKings releases salaries ~3 days before tournament start - expected before week"
          : undefined,
    ),
  )
    totalRows += dfsSalariesResult.count
  } else {
tables.push(
    createTableReport(
      "dfsSalaries",
      0,
      "Error",
      "DraftKings salary data for upcoming tournaments",
      false,
      0,
      null,
      undefined,
    ),
  )
  }

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
 * Generate the complete database health report with graceful degradation.
 */
export async function getDatabaseHealthReport(): Promise<DatabaseHealthReport> {
  console.log("[v0] [DatabaseHealth] === Starting database health check ===")
  const startTime = Date.now()

  const [{ tables, totalRows }, pipelines, warnings, kpis] = await Promise.all([
    getTableMetrics(),
    getImportPipelines(),
    generateWarnings(),
    getDatabaseKpis(),
  ])

  const duration = Date.now() - startTime
  console.log(`[v0] [DatabaseHealth] === Completed in ${duration}ms ===`)

  const healthPercentage = calculateHealthPercentage(tables, pipelines, warnings)
  const overallStatus = determineOverallStatus(healthPercentage, warnings.filter((w) => w.severity === "critical").length)

  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    healthPercentage,
    kpis: { ...kpis, totalRows },
    tables,
    pipelines,
    warnings,
  }
}
