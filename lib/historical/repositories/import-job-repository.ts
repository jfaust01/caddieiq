/**
 * Repository for import job lifecycle management
 */

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
  createdAt: Date;
}

export interface ImportJobInput {
  id: string;
  providerId: string;
  jobId: string;
  datasetType: string;
  startedAt: Date;
}

export interface ImportJobUpdate {
  recordsRead?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  recordsRejected?: number;
  validationErrors?: number;
  duration?: number;
  sourceChecksum?: string;
  completedAt?: Date;
}

/**
 * In-memory repository for import jobs (for testing)
 * Production would use actual database via Prisma
 */
export class ImportJobRepository {
  private jobs: Map<string, ImportJobRecord> = new Map();

  /**
   * Create a new import job tracking record
   */
  async createJob(input: ImportJobInput): Promise<ImportJobRecord> {
    const record: ImportJobRecord = {
      ...input,
      createdAt: new Date(),
    };
    this.jobs.set(input.id, record);
    return record;
  }

  /**
   * Find import job by ID
   */
  async findById(jobId: string): Promise<ImportJobRecord | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Find by provider and dataset type
   */
  async findByProviderAndDataset(
    providerId: string,
    datasetType: string
  ): Promise<ImportJobRecord[]> {
    return Array.from(this.jobs.values())
      .filter((j) => j.providerId === providerId && j.datasetType === datasetType)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Update import job with execution results
   */
  async updateJob(
    jobId: string,
    updates: ImportJobUpdate
  ): Promise<ImportJobRecord | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const updated = { ...job, ...updates };
    this.jobs.set(jobId, updated);
    return updated;
  }

  /**
   * List recent import jobs
   */
  async listRecent(limit: number = 50): Promise<ImportJobRecord[]> {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clear for testing
   */
  async clear(): Promise<void> {
    this.jobs.clear();
  }
}
