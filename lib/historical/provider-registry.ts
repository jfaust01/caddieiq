import { PrismaClient } from "@prisma/client";

export interface ProviderConfig {
  id: string;
  providerId: string;
  name: string;
  version: string;
  priority: number;
  supportedDatasets: string[];
  historicalDepthDays?: number;
  coverage?: number;
  licensingStatus: string;
  healthStatus: string;
  rateLimitPerSecond?: number;
  rateLimitPerDay?: number;
  configuration?: Record<string, unknown>;
  isActive: boolean;
}

export interface ImportJobRecord {
  id: string;
  providerId: string;
  jobId: string;
  datasetType: string;
  recordsRead?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  recordsRejected?: number;
  validationErrors?: number;
  duration?: number;
  sourceChecksum?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Provider Registry Service
 * Manages provider metadata, health status, licensing, and import job tracking
 */
export class ProviderRegistryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a new data provider
   */
  async registerProvider(config: Omit<ProviderConfig, "id">): Promise<ProviderConfig> {
    const result = await this.prisma.$queryRaw<ProviderConfig[]>`
      INSERT INTO "historical_providers" (
        id, "providerId", name, version, priority, "supportedDatasets",
        "historicalDepthDays", coverage, "licensingStatus", "healthStatus",
        "rateLimitPerSecond", "rateLimitPerDay", configuration, "isActive", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${config.providerId},
        ${config.name},
        ${config.version},
        ${config.priority},
        ARRAY[${config.supportedDatasets.join(",")}]::text[],
        ${config.historicalDepthDays ?? null},
        ${config.coverage ?? null},
        ${config.licensingStatus},
        ${config.healthStatus},
        ${config.rateLimitPerSecond ?? null},
        ${config.rateLimitPerDay ?? null},
        ${JSON.stringify(config.configuration ?? {})},
        ${config.isActive},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING * FROM "historical_providers" WHERE "providerId" = ${config.providerId}
      LIMIT 1;
    `;
    return result[0];
  }

  /**
   * Get provider by ID
   */
  async getProvider(providerId: string): Promise<ProviderConfig | null> {
    const result = await this.prisma.$queryRaw<ProviderConfig[]>`
      SELECT * FROM "historical_providers" WHERE "providerId" = ${providerId} LIMIT 1
    `;
    return result[0] || null;
  }

  /**
   * List all active providers
   */
  async listProviders(onlyActive: boolean = true): Promise<ProviderConfig[]> {
    return this.prisma.$queryRaw<ProviderConfig[]>`
      SELECT * FROM "historical_providers"
      ${onlyActive ? `WHERE "isActive" = true` : ""}
      ORDER BY priority DESC, name ASC
    `;
  }

  /**
   * Update provider health status
   */
  async updateProviderHealth(
    providerId: string,
    healthStatus: string,
    lastSyncTime?: Date
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "historical_providers"
      SET "healthStatus" = ${healthStatus},
          "lastSuccessfulSync" = ${lastSyncTime ?? null},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "providerId" = ${providerId}
    `;
  }

  /**
   * Track an import job
   */
  async createImportJob(job: Omit<ImportJobRecord, "id">): Promise<ImportJobRecord> {
    const result = await this.prisma.$queryRaw<ImportJobRecord[]>`
      INSERT INTO "historical_provider_import_jobs" (
        id, "providerId", "jobId", "datasetType", "recordsRead",
        "recordsInserted", "recordsUpdated", "recordsRejected",
        "validationErrors", duration, "sourceChecksum", "startedAt",
        "completedAt", "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${job.providerId},
        ${job.jobId},
        ${job.datasetType},
        ${job.recordsRead ?? null},
        ${job.recordsInserted ?? null},
        ${job.recordsUpdated ?? null},
        ${job.recordsRejected ?? null},
        ${job.validationErrors ?? null},
        ${job.duration ?? null},
        ${job.sourceChecksum ?? null},
        ${job.startedAt},
        ${job.completedAt ?? null},
        CURRENT_TIMESTAMP
      )
      RETURNING * FROM "historical_provider_import_jobs"
      WHERE "jobId" = ${job.jobId} LIMIT 1
    `;
    return result[0];
  }

  /**
   * Get import job history for a provider
   */
  async getImportJobs(
    providerId: string,
    limit: number = 50
  ): Promise<ImportJobRecord[]> {
    return this.prisma.$queryRaw<ImportJobRecord[]>`
      SELECT * FROM "historical_provider_import_jobs"
      WHERE "providerId" = ${providerId}
      ORDER BY "startedAt" DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get import job statistics
   */
  async getImportStats(providerId: string): Promise<{
    totalJobs: number;
    successfulJobs: number;
    totalRecordsInserted: number;
    totalRecordsRejected: number;
    averageDuration: number;
  }> {
    const stats = await this.prisma.$queryRaw<
      Array<{
        total_jobs: number;
        successful_jobs: number;
        total_records_inserted: number;
        total_records_rejected: number;
        average_duration: number;
      }>
    >`
      SELECT
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN "completedAt" IS NOT NULL THEN 1 END) as successful_jobs,
        COALESCE(SUM("recordsInserted"), 0) as total_records_inserted,
        COALESCE(SUM("recordsRejected"), 0) as total_records_rejected,
        COALESCE(AVG(duration), 0) as average_duration
      FROM "historical_provider_import_jobs"
      WHERE "providerId" = ${providerId}
    `;

    const row = stats[0];
    return {
      totalJobs: Number(row.total_jobs),
      successfulJobs: Number(row.successful_jobs),
      totalRecordsInserted: Number(row.total_records_inserted),
      totalRecordsRejected: Number(row.total_records_rejected),
      averageDuration: Number(row.average_duration),
    };
  }
}

export default ProviderRegistryService;
