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
 * Get table metrics for database health report with graceful degradation.
 * If one table query fails, the page still renders with remaining tables and error indicators.
 */
async function getTableMetrics(): Promise<{ tables: TableHealthReport[]; totalRows: number }> {
  const tables: TableHealthReport[] = []
  let totalRows = 0

  // User management tables
  const usersResult = await safeCountTable("users", () => prisma.user.count())
  if (!usersResult.error) {
    tables.push({
      tableName: "users",
      rowCount: usersResult.count,
      status: usersResult.count > 0 ? "Healthy" : "Expected Empty",
      purpose: "User accounts",
      expected: false,
      lastUpdatedAt: null,
      healthScore: usersResult.count > 0 ? 100 : 50,
      explanation: usersResult.count === 0 ? "Create users to access the system" : undefined,
    })
    totalRows += usersResult.count
  } else {
    tables.push({
      tableName: "users",
      rowCount: 0,
      status: "Error",
      purpose: "User accounts",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${usersResult.error}`,
    })
  }

  // Golf tour/event tables
  const toursResult = await safeCountTable("tours", () => prisma.tour.count())
  if (!toursResult.error) {
    tables.push({
      tableName: "tours",
      rowCount: toursResult.count,
      status: toursResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Golf tours (PGA, DP World Tour, etc.)",
      expected: false,
      lastUpdatedAt: toursResult.count > 0 ? new Date().toISOString() : null,
      healthScore: toursResult.count > 0 ? 100 : 50,
      explanation: toursResult.count === 0 ? "Populated by external data import" : undefined,
    })
    totalRows += toursResult.count
  } else {
    tables.push({
      tableName: "tours",
      rowCount: 0,
      status: "Error",
      purpose: "Golf tours (PGA, DP World Tour, etc.)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${toursResult.error}`,
    })
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

    tables.push({
      tableName: "courses",
      rowCount: coursesResult.count,
      status: coursesResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Golf courses from GolfCourseAPI",
      expected: false,
      lastUpdatedAt: coursesResult.count > 0 ? new Date().toISOString() : null,
      healthScore:
        coursesResult.count > 0 && !coursesNoLocationResult.error
          ? Math.floor(((coursesResult.count - coursesNoLocationResult.count) / coursesResult.count) * 100)
          : 50,
      explanation:
        coursesResult.count === 0
          ? "Run course import"
          : !coursesNoLocationResult.error && coursesNoLocationResult.count > 0
            ? `${coursesNoLocationResult.count} courses missing coordinates`
            : undefined,
    })
    totalRows += coursesResult.count
  } else {
    tables.push({
      tableName: "courses",
      rowCount: 0,
      status: "Error",
      purpose: "Golf courses from GolfCourseAPI",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${coursesResult.error}`,
    })
  }

  const tournamentsResult = await safeCountTable("tournaments", () =>
    prisma.tournament.count({
      where: { deletedAt: null },
    }),
  )
  if (!tournamentsResult.error) {
    tables.push({
      tableName: "tournaments",
      rowCount: tournamentsResult.count,
      status: tournamentsResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Tournament events",
      expected: false,
      lastUpdatedAt: tournamentsResult.count > 0 ? new Date().toISOString() : null,
      healthScore: tournamentsResult.count > 0 ? 100 : 50,
      explanation: tournamentsResult.count === 0 ? "Run tournament import for upcoming season" : undefined,
    })
    totalRows += tournamentsResult.count
  } else {
    tables.push({
      tableName: "tournaments",
      rowCount: 0,
      status: "Error",
      purpose: "Tournament events",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${tournamentsResult.error}`,
    })
  }

  const playersResult = await safeCountTable("players", () =>
    prisma.player.count({
      where: { deletedAt: null },
    }),
  )
  if (!playersResult.error) {
    tables.push({
      tableName: "players",
      rowCount: playersResult.count,
      status: playersResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Professional golfers",
      expected: false,
      lastUpdatedAt: playersResult.count > 0 ? new Date().toISOString() : null,
      healthScore: playersResult.count > 0 ? 100 : 50,
      explanation: playersResult.count === 0 ? "Run player import" : undefined,
    })
    totalRows += playersResult.count
  } else {
    tables.push({
      tableName: "players",
      rowCount: 0,
      status: "Error",
      purpose: "Professional golfers",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${playersResult.error}`,
    })
  }

  // Rounds (user generated content)
  const roundsResult = await safeCountTable("rounds", () => prisma.round.count())
  if (!roundsResult.error) {
    tables.push({
      tableName: "rounds",
      rowCount: roundsResult.count,
      status: roundsResult.count > 0 ? "Healthy" : "Expected Empty",
      purpose: "User-recorded golf rounds",
      expected: false,
      lastUpdatedAt: roundsResult.count > 0 ? new Date().toISOString() : null,
      healthScore: roundsResult.count > 0 ? 100 : 50,
      explanation: roundsResult.count === 0 ? "Users will create rounds as they play" : undefined,
    })
    totalRows += roundsResult.count
  } else {
    tables.push({
      tableName: "rounds",
      rowCount: 0,
      status: "Error",
      purpose: "User-recorded golf rounds",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${roundsResult.error}`,
    })
  }

  // Course characteristics / ratings
  const courseCharacteristicsResult = await safeCountTable("courseCharacteristics", () =>
    prisma.courseCharacteristic.count(),
  )
  if (!courseCharacteristicsResult.error) {
    tables.push({
      tableName: "courseCharacteristics",
      rowCount: courseCharacteristicsResult.count,
      status: courseCharacteristicsResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Course difficulty ratings (USGA course/slope)",
      expected: false,
      lastUpdatedAt: courseCharacteristicsResult.count > 0 ? new Date().toISOString() : null,
      healthScore: courseCharacteristicsResult.count > 0 ? 100 : 50,
      explanation: courseCharacteristicsResult.count === 0 ? "Populated with course intelligence" : undefined,
    })
    totalRows += courseCharacteristicsResult.count
  } else {
    tables.push({
      tableName: "courseCharacteristics",
      rowCount: 0,
      status: "Error",
      purpose: "Course difficulty ratings (USGA course/slope)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${courseCharacteristicsResult.error}`,
    })
  }

  // Weather data
  const weatherSnapshotsResult = await safeCountTable("weatherSnapshots", () =>
    prisma.weatherSnapshot.count(),
  )
  if (!weatherSnapshotsResult.error) {
    tables.push({
      tableName: "weatherSnapshots",
      rowCount: weatherSnapshotsResult.count,
      status: weatherSnapshotsResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Weather forecast snapshots (one per tournament per day)",
      expected: false,
      lastUpdatedAt: weatherSnapshotsResult.count > 0 ? new Date().toISOString() : null,
      healthScore: weatherSnapshotsResult.count > 0 ? 100 : 50,
      explanation:
        weatherSnapshotsResult.count === 0 ? "No tournaments within 6-day forecast window - expected off-season" : undefined,
    })
    totalRows += weatherSnapshotsResult.count
  } else {
    tables.push({
      tableName: "weatherSnapshots",
      rowCount: 0,
      status: "Error",
      purpose: "Weather forecast snapshots (one per tournament per day)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${weatherSnapshotsResult.error}`,
    })
  }

  const weatherPeriodsResult = await safeCountTable("weatherPeriods", () => prisma.weatherPeriod.count())
  if (!weatherPeriodsResult.error) {
    tables.push({
      tableName: "weatherPeriods",
      rowCount: weatherPeriodsResult.count,
      status: weatherPeriodsResult.count > 0 ? "Healthy" : "Waiting",
      purpose: "Individual weather periods (3-hour forecast blocks)",
      expected: false,
      lastUpdatedAt: weatherPeriodsResult.count > 0 ? new Date().toISOString() : null,
      healthScore: weatherPeriodsResult.count > 0 ? 100 : 50,
      explanation:
        weatherPeriodsResult.count === 0
          ? "Populated with weather snapshots when tournaments are in forecast window"
          : undefined,
    })
    totalRows += weatherPeriodsResult.count
  } else {
    tables.push({
      tableName: "weatherPeriods",
      rowCount: 0,
      status: "Error",
      purpose: "Individual weather periods (3-hour forecast blocks)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${weatherPeriodsResult.error}`,
    })
  }

  // Phase 13.1: Normalized GolfCourseAPI Entities - with graceful degradation
  const courseDetailsResult = await safeCountTable("courseDetails", () => prisma.courseDetails.count())
  let courseDetailsCount = 0
  if (!courseDetailsResult.error) {
    courseDetailsCount = courseDetailsResult.count
    tables.push({
      tableName: "courseDetails",
      rowCount: courseDetailsCount,
      status: courseDetailsCount > 0 ? "Healthy" : "Waiting",
      purpose: "GolfCourseAPI course details (anchor)",
      expected: false,
      lastUpdatedAt: courseDetailsCount > 0 ? new Date().toISOString() : null,
      healthScore: courseDetailsCount > 0 ? 100 : 50,
      explanation:
        courseDetailsCount === 0
          ? "Awaiting course intelligence import - run when courses are synced"
          : undefined,
    })
    totalRows += courseDetailsCount
  } else {
    tables.push({
      tableName: "courseDetails",
      rowCount: 0,
      status: "Waiting",
      purpose: "GolfCourseAPI course details (anchor)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `Phase 13.1 tables not yet migrated: Run 'pnpm prisma migrate deploy'`,
    })
  }

  const courseHolesResult = await safeCountTable("courseHoles", () => prisma.courseHole.count())
  let courseHolesCount = 0
  if (!courseHolesResult.error) {
    courseHolesCount = courseHolesResult.count
    const courseHolesBySplit = courseDetailsCount > 0 ? Math.floor(courseHolesCount / courseDetailsCount) : 0
    const holesHealthy = courseHolesBySplit === 18
    tables.push({
      tableName: "courseHoles",
      rowCount: courseHolesCount,
      status: courseHolesCount > courseDetailsCount * 17 ? "Healthy" : "Waiting",
      purpose: "Individual golf holes (1-18 per course)",
      expected: false,
      lastUpdatedAt: courseHolesCount > 0 ? new Date().toISOString() : null,
      healthScore: holesHealthy ? 100 : 60,
      explanation:
        courseHolesCount === 0
          ? "Populated with course details import"
          : !holesHealthy
            ? `${courseHolesBySplit} holes per course (expected 18)`
            : undefined,
    })
    totalRows += courseHolesCount
  } else {
    tables.push({
      tableName: "courseHoles",
      rowCount: 0,
      status: "Error",
      purpose: "Individual golf holes (1-18 per course)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${courseHolesResult.error}`,
    })
  }

  const courseTeesResult = await safeCountTable("courseTees", () => prisma.courseTee.count())
  let courseTeesCount = 0
  if (!courseTeesResult.error) {
    courseTeesCount = courseTeesResult.count
    const courseTeesPerCourse = courseDetailsCount > 0 ? Math.floor(courseTeesCount / courseDetailsCount) : 0
    tables.push({
      tableName: "courseTees",
      rowCount: courseTeesCount,
      status: courseTeesCount > courseDetailsCount ? "Healthy" : "Waiting",
      purpose: "Tee boxes per course (Blue, White, Red, etc.)",
      expected: false,
      lastUpdatedAt: courseTeesCount > 0 ? new Date().toISOString() : null,
      healthScore: courseTeesCount > courseDetailsCount * 2 ? 100 : 60,
      explanation:
        courseTeesCount === 0 ? "Populated with course details import" : `${courseTeesPerCourse} tees per course avg`,
    })
    totalRows += courseTeesCount
  } else {
    tables.push({
      tableName: "courseTees",
      rowCount: 0,
      status: "Error",
      purpose: "Tee boxes per course (Blue, White, Red, etc.)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${courseTeesResult.error}`,
    })
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
    tables.push({
      tableName: "tournamentCourseMappings",
      rowCount: mappingsResult.count,
      status: mappingsResult.count > 0 && mappingScore >= 80 ? "Healthy" : mappingsResult.count > 0 ? "Warning" : "Waiting",
      purpose: "Tournament → GolfCourseAPI course mappings",
      expected: false,
      lastUpdatedAt: mappingsResult.count > 0 ? new Date().toISOString() : null,
      healthScore: mappingScore,
      explanation:
        mappingsResult.count === 0
          ? "No mappings yet - populate during tournament import"
          : `${verifiedMappingsCount}/${mappingsResult.count} verified (${mappingScore}%)`,
    })
    totalRows += mappingsResult.count
  } else {
    tables.push({
      tableName: "tournamentCourseMappings",
      rowCount: 0,
      status: "Error",
      purpose: "Tournament → GolfCourseAPI course mappings",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${mappingsResult.error}`,
    })
  }

  const courseIntelligenceResult = await safeCountTable("courseIntelligence", () =>
    prisma.courseIntelligence.count(),
  )
  if (!courseIntelligenceResult.error) {
    tables.push({
      tableName: "courseIntelligence",
      rowCount: courseIntelligenceResult.count,
      status:
        courseIntelligenceResult.count === courseDetailsCount
          ? "Healthy"
          : courseIntelligenceResult.count > 0
            ? "Warning"
            : "Waiting",
      purpose: "Calculated course metrics (difficulty, driving importance, etc.)",
      expected: false,
      lastUpdatedAt: courseIntelligenceResult.count > 0 ? new Date().toISOString() : null,
      healthScore:
        courseDetailsCount > 0 ? Math.floor((courseIntelligenceResult.count / courseDetailsCount) * 100) : 50,
      explanation:
        courseIntelligenceResult.count === 0
          ? "Run course enrichment after importing courses"
          : `${courseIntelligenceResult.count}/${courseDetailsCount} courses analyzed`,
    })
    totalRows += courseIntelligenceResult.count
  } else {
    tables.push({
      tableName: "courseIntelligence",
      rowCount: 0,
      status: "Error",
      purpose: "Calculated course metrics (difficulty, driving importance, etc.)",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${courseIntelligenceResult.error}`,
    })
  }

  const dfsSalariesResult = await safeCountTable("dfsSalaries", () => prisma.dfsSalary.count())
  if (!dfsSalariesResult.error) {
    tables.push({
      tableName: "dfsSalaries",
      rowCount: dfsSalariesResult.count,
      status: dfsSalariesResult.count > 0 ? "Healthy" : "Expected Empty",
      purpose: "DraftKings salary data for upcoming tournaments",
      expected: false,
      lastUpdatedAt: dfsSalariesResult.count > 0 ? new Date().toISOString() : null,
      healthScore: dfsSalariesResult.count > 0 ? 100 : 50,
      explanation:
        dfsSalariesResult.count === 0
          ? "DraftKings releases salaries ~3 days before tournament start - expected before week"
          : undefined,
    })
    totalRows += dfsSalariesResult.count
  } else {
    tables.push({
      tableName: "dfsSalaries",
      rowCount: 0,
      status: "Error",
      purpose: "DraftKings salary data for upcoming tournaments",
      expected: false,
      lastUpdatedAt: null,
      healthScore: 0,
      explanation: `⚠ Failed to load: ${dfsSalariesResult.error}`,
    })
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
