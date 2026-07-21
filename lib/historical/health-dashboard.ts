import { PrismaClient } from "@prisma/client";

export interface DatasetHealth {
  datasetType: string;
  provider: string;
  coveragePercent: number;
  lastUpdateTime?: Date;
  staleDays?: number;
  missingPlayers?: number;
  missingTournaments?: number;
  duplicateCount?: number;
  validationFailures?: number;
  status: "healthy" | "degraded" | "critical" | "unknown";
}

export interface ProviderHealth {
  provider: string;
  version: string;
  healthStatus: string;
  lastSyncTime?: Date;
  successRate: number;
  averageProcessingTime: number;
  datasets: DatasetHealth[];
}

export interface ComprehensiveHealth {
  timestamp: Date;
  overallStatus: "healthy" | "degraded" | "critical";
  providers: ProviderHealth[];
  datasets: DatasetHealth[];
  missingDatasets: string[];
  recommendations: string[];
}

/**
 * Health Dashboard Service
 * Monitors dataset coverage, freshness, data quality, and provider health
 */
export class HealthDashboardService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Record a health snapshot for a dataset
   */
  async recordHealthSnapshot(health: Omit<DatasetHealth, "status">): Promise<DatasetHealth> {
    const status = this.calculateStatus(health);

    await this.prisma.$executeRaw`
      INSERT INTO "dataset_health_snapshots" (
        id, "datasetType", provider, "coveragePercent",
        "lastUpdateTime", "staleDays", "missingPlayers",
        "missingTournaments", "duplicateCount", "validationFailures", "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${health.datasetType},
        ${health.provider},
        ${health.coveragePercent},
        ${health.lastUpdateTime ?? null},
        ${health.staleDays ?? null},
        ${health.missingPlayers ?? null},
        ${health.missingTournaments ?? null},
        ${health.duplicateCount ?? null},
        ${health.validationFailures ?? null},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("datasetType", provider)
      DO UPDATE SET
        "coveragePercent" = EXCLUDED."coveragePercent",
        "lastUpdateTime" = EXCLUDED."lastUpdateTime",
        "staleDays" = EXCLUDED."staleDays",
        "missingPlayers" = EXCLUDED."missingPlayers",
        "missingTournaments" = EXCLUDED."missingTournaments",
        "duplicateCount" = EXCLUDED."duplicateCount",
        "validationFailures" = EXCLUDED."validationFailures",
        "createdAt" = CURRENT_TIMESTAMP
    `;

    return {
      ...health,
      status,
    };
  }

  /**
   * Get health for a specific dataset
   */
  async getDatasetHealth(datasetType: string, provider: string): Promise<DatasetHealth | null> {
    const result = await this.prisma.$queryRaw<
      Array<{
        datasetType: string;
        provider: string;
        coveragePercent: number;
        lastUpdateTime?: Date;
        staleDays?: number;
        missingPlayers?: number;
        missingTournaments?: number;
        duplicateCount?: number;
        validationFailures?: number;
      }>
    >`
      SELECT * FROM "dataset_health_snapshots"
      WHERE "datasetType" = ${datasetType} AND provider = ${provider}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    if (!result[0]) return null;

    const row = result[0];
    return {
      datasetType: row.datasetType,
      provider: row.provider,
      coveragePercent: row.coveragePercent,
      lastUpdateTime: row.lastUpdateTime,
      staleDays: row.staleDays,
      missingPlayers: row.missingPlayers,
      missingTournaments: row.missingTournaments,
      duplicateCount: row.duplicateCount,
      validationFailures: row.validationFailures,
      status: this.calculateStatusFromMetrics(row),
    };
  }

  /**
   * Get all dataset health snapshots
   */
  async getAllDatasetHealth(): Promise<DatasetHealth[]> {
    const results = await this.prisma.$queryRaw<
      Array<{
        datasetType: string;
        provider: string;
        coveragePercent: number;
        lastUpdateTime?: Date;
        staleDays?: number;
        missingPlayers?: number;
        missingTournaments?: number;
        duplicateCount?: number;
        validationFailures?: number;
      }>
    >`
      SELECT DISTINCT ON ("datasetType", provider)
        * FROM "dataset_health_snapshots"
      ORDER BY "datasetType", provider, "createdAt" DESC
    `;

    return results.map((row) => ({
      datasetType: row.datasetType,
      provider: row.provider,
      coveragePercent: row.coveragePercent,
      lastUpdateTime: row.lastUpdateTime,
      staleDays: row.staleDays,
      missingPlayers: row.missingPlayers,
      missingTournaments: row.missingTournaments,
      duplicateCount: row.duplicateCount,
      validationFailures: row.validationFailures,
      status: this.calculateStatusFromMetrics(row),
    }));
  }

  /**
   * Get comprehensive health report
   */
  async getComprehensiveHealth(): Promise<ComprehensiveHealth> {
    const allHealth = await this.getAllDatasetHealth();

    const providers = await this.prisma.$queryRaw<
      Array<{
        providerId: string;
        name: string;
        version: string;
        healthStatus: string;
        lastSuccessfulSync?: Date;
      }>
    >`
      SELECT "providerId", name, version, "healthStatus", "lastSuccessfulSync"
      FROM "historical_providers"
      WHERE "isActive" = true
      ORDER BY priority DESC
    `;

    const providerHealth: ProviderHealth[] = await Promise.all(
      providers.map(async (p) => {
        const stats = await this.prisma.$queryRaw<
          Array<{
            success_rate: number;
            avg_duration: number;
          }>
        >`
          SELECT
            ROUND(COUNT(CASE WHEN "completedAt" IS NOT NULL THEN 1 END)::NUMERIC / 
                   NULLIF(COUNT(*), 0) * 100, 2) as success_rate,
            COALESCE(AVG(duration), 0) as avg_duration
          FROM "historical_provider_import_jobs"
          WHERE "providerId" = ${p.providerId}
        `;

        const row = stats[0];
        const datasetHealth = allHealth.filter((h) => h.provider === p.name);

        return {
          provider: p.name,
          version: p.version,
          healthStatus: p.healthStatus,
          lastSyncTime: p.lastSuccessfulSync,
          successRate: Number(row.success_rate) || 0,
          averageProcessingTime: Number(row.avg_duration) || 0,
          datasets: datasetHealth,
        };
      })
    );

    // Calculate coverage gaps
    const requiredDatasets = [
      "TOURNAMENT_EDITIONS",
      "COURSE_EDITIONS",
      "PLAYER_VERSIONS",
      "RANKINGS",
      "STATISTICS",
      "DRAFT_KINGS_SALARIES",
      "TOURNAMENT_OUTCOMES",
    ];

    const coveredDatasets = new Set(allHealth.map((h) => h.datasetType));
    const missingDatasets = requiredDatasets.filter((d) => !coveredDatasets.has(d));

    // Generate recommendations
    const recommendations: string[] = [];
    if (allHealth.some((h) => h.coveragePercent < 50)) {
      recommendations.push("Critical: Some datasets have <50% coverage. Investigate data sources.");
    }
    if (allHealth.some((h) => (h.staleDays ?? 0) > 30)) {
      recommendations.push("Alert: Some datasets are stale (>30 days). Schedule refresh jobs.");
    }
    if (missingDatasets.length > 0) {
      recommendations.push(`Missing datasets: ${missingDatasets.join(", ")}. Configure providers.`);
    }
    if (allHealth.some((h) => (h.validationFailures ?? 0) > 100)) {
      recommendations.push("Alert: High validation failure rates detected. Review data quality.");
    }

    const overallStatus = this.calculateOverallStatus(allHealth);

    return {
      timestamp: new Date(),
      overallStatus,
      providers: providerHealth,
      datasets: allHealth,
      missingDatasets,
      recommendations,
    };
  }

  /**
   * Get health trend for a dataset
   */
  async getHealthTrend(
    datasetType: string,
    provider: string,
    days: number = 30
  ): Promise<Array<DatasetHealth & { recordedAt: Date }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await this.prisma.$queryRaw<
      Array<{
        datasetType: string;
        provider: string;
        coveragePercent: number;
        lastUpdateTime?: Date;
        staleDays?: number;
        missingPlayers?: number;
        missingTournaments?: number;
        duplicateCount?: number;
        validationFailures?: number;
        createdAt: Date;
      }>
    >`
      SELECT * FROM "dataset_health_snapshots"
      WHERE "datasetType" = ${datasetType}
        AND provider = ${provider}
        AND "createdAt" >= ${since}
      ORDER BY "createdAt" DESC
    `;

    return results.map((row) => ({
      datasetType: row.datasetType,
      provider: row.provider,
      coveragePercent: row.coveragePercent,
      lastUpdateTime: row.lastUpdateTime,
      staleDays: row.staleDays,
      missingPlayers: row.missingPlayers,
      missingTournaments: row.missingTournaments,
      duplicateCount: row.duplicateCount,
      validationFailures: row.validationFailures,
      recordedAt: row.createdAt,
      status: this.calculateStatusFromMetrics(row),
    }));
  }

  // Private helper methods

  private calculateStatus(health: Omit<DatasetHealth, "status">): DatasetHealth["status"] {
    if (health.coveragePercent < 20) return "critical";
    if (health.coveragePercent < 50) return "degraded";
    if ((health.validationFailures ?? 0) > 1000) return "critical";
    if ((health.duplicateCount ?? 0) > 500) return "degraded";
    if ((health.staleDays ?? 0) > 60) return "critical";
    if ((health.staleDays ?? 0) > 30) return "degraded";
    return "healthy";
  }

  private calculateStatusFromMetrics(metrics: any): DatasetHealth["status"] {
    if (metrics.coveragePercent < 20) return "critical";
    if (metrics.coveragePercent < 50) return "degraded";
    if ((metrics.validationFailures ?? 0) > 1000) return "critical";
    if ((metrics.duplicateCount ?? 0) > 500) return "degraded";
    if ((metrics.staleDays ?? 0) > 60) return "critical";
    if ((metrics.staleDays ?? 0) > 30) return "degraded";
    return "healthy";
  }

  private calculateOverallStatus(datasets: DatasetHealth[]): ComprehensiveHealth["overallStatus"] {
    const statuses = datasets.map((d) => d.status);
    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("degraded")) return "degraded";
    return "healthy";
  }
}

export default HealthDashboardService;
