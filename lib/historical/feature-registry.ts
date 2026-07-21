import { PrismaClient } from "@prisma/client";

export interface FeatureDefinition {
  id: string;
  featureName: string;
  description?: string;
  category: string;
  owner?: string;
  provider?: string;
  formula?: string;
  version: string;
  dependencies: string[];
  validationRules?: Record<string, unknown>;
  usedBy: string[];
  deprecated: boolean;
  deprecatedAt?: Date;
  explainable: boolean;
  exportToClient: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureSample {
  id: string;
  featureId: string;
  playerId: string;
  tournamentId: string;
  value: string;
  unitOfMeasure?: string;
  validFrom: Date;
  validTo?: Date;
  source?: string;
  checksum?: string;
  createdAt: Date;
}

/**
 * Feature Registry Service
 * Manages feature definitions, versions, dependencies, and sample validation
 */
export class FeatureRegistryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a new feature definition
   */
  async registerFeature(feature: Omit<FeatureDefinition, "id" | "createdAt" | "updatedAt">): Promise<FeatureDefinition> {
    const result = await this.prisma.$queryRaw<FeatureDefinition[]>`
      INSERT INTO "historical_features" (
        id, "featureName", description, category, owner, provider,
        formula, version, dependencies, "validationRules", "usedBy",
        deprecated, "deprecatedAt", explainable, "exportToClient",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${feature.featureName},
        ${feature.description ?? null},
        ${feature.category},
        ${feature.owner ?? null},
        ${feature.provider ?? null},
        ${feature.formula ?? null},
        ${feature.version},
        ARRAY[${feature.dependencies.join(",")}]::text[],
        ${JSON.stringify(feature.validationRules ?? {})},
        ARRAY[${feature.usedBy.join(",")}]::text[],
        false,
        null,
        ${feature.explainable},
        ${feature.exportToClient},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING * FROM "historical_features" WHERE "featureName" = ${feature.featureName}
      LIMIT 1
    `;
    return result[0];
  }

  /**
   * Get feature by name
   */
  async getFeature(featureName: string): Promise<FeatureDefinition | null> {
    const result = await this.prisma.$queryRaw<FeatureDefinition[]>`
      SELECT * FROM "historical_features" WHERE "featureName" = ${featureName} LIMIT 1
    `;
    return result[0] || null;
  }

  /**
   * List features by category
   */
  async listFeaturesByCategory(category: string): Promise<FeatureDefinition[]> {
    return this.prisma.$queryRaw<FeatureDefinition[]>`
      SELECT * FROM "historical_features"
      WHERE category = ${category} AND deprecated = false
      ORDER BY "featureName" ASC
    `;
  }

  /**
   * List all active features (not deprecated)
   */
  async listActiveFeatures(): Promise<FeatureDefinition[]> {
    return this.prisma.$queryRaw<FeatureDefinition[]>`
      SELECT * FROM "historical_features"
      WHERE deprecated = false
      ORDER BY category, "featureName" ASC
    `;
  }

  /**
   * Get features that are exported to client
   */
  async listClientExportFeatures(): Promise<FeatureDefinition[]> {
    return this.prisma.$queryRaw<FeatureDefinition[]>`
      SELECT * FROM "historical_features"
      WHERE "exportToClient" = true AND deprecated = false
      ORDER BY category, "featureName" ASC
    `;
  }

  /**
   * Get feature dependency tree
   */
  async getFeatureDependencies(featureName: string): Promise<{
    feature: FeatureDefinition;
    directDependencies: FeatureDefinition[];
    dependentOn: FeatureDefinition[];
  }> {
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature not found: ${featureName}`);
    }

    // Get direct dependencies
    const directDependencies = feature.dependencies.length > 0
      ? await this.prisma.$queryRaw<FeatureDefinition[]>`
          SELECT * FROM "historical_features"
          WHERE "featureName" = ANY(ARRAY[${feature.dependencies.join(",")}]::text[])
        `
      : [];

    // Get features that depend on this one
    const dependentOn = await this.prisma.$queryRaw<FeatureDefinition[]>`
      SELECT * FROM "historical_features"
      WHERE "featureName" = ANY(
        SELECT "featureName" FROM "historical_features"
        WHERE dependencies @> ARRAY[${featureName}]::text[]
      )
    `;

    return {
      feature,
      directDependencies,
      dependentOn,
    };
  }

  /**
   * Record a feature sample for validation/testing
   */
  async recordSample(sample: Omit<FeatureSample, "id" | "createdAt">): Promise<FeatureSample> {
    const checksum = Buffer.from(
      `${sample.featureId}:${sample.playerId}:${sample.tournamentId}:${sample.value}:${sample.validFrom.toISOString()}`
    ).toString("base64");

    const result = await this.prisma.$queryRaw<FeatureSample[]>`
      INSERT INTO "historical_feature_samples" (
        id, "featureId", "playerId", "tournamentId", value,
        "unitOfMeasure", "validFrom", "validTo", source, checksum, "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${sample.featureId},
        ${sample.playerId},
        ${sample.tournamentId},
        ${sample.value},
        ${sample.unitOfMeasure ?? null},
        ${sample.validFrom},
        ${sample.validTo ?? null},
        ${sample.source ?? null},
        ${checksum},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("featureId", "playerId", "tournamentId")
      DO UPDATE SET
        value = EXCLUDED.value,
        "unitOfMeasure" = EXCLUDED."unitOfMeasure",
        "validFrom" = EXCLUDED."validFrom",
        "validTo" = EXCLUDED."validTo",
        source = EXCLUDED.source,
        checksum = EXCLUDED.checksum,
        "createdAt" = CURRENT_TIMESTAMP
      RETURNING * FROM "historical_feature_samples"
      WHERE "featureId" = ${sample.featureId}
        AND "playerId" = ${sample.playerId}
        AND "tournamentId" = ${sample.tournamentId}
      LIMIT 1
    `;

    return result[0];
  }

  /**
   * Get feature samples for a tournament
   */
  async getSamples(
    featureId: string,
    tournamentId: string
  ): Promise<FeatureSample[]> {
    return this.prisma.$queryRaw<FeatureSample[]>`
      SELECT * FROM "historical_feature_samples"
      WHERE "featureId" = ${featureId} AND "tournamentId" = ${tournamentId}
      ORDER BY "validFrom" DESC
    `;
  }

  /**
   * Deprecate a feature
   */
  async deprecateFeature(featureName: string, reason?: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "historical_features"
      SET deprecated = true,
          "deprecatedAt" = CURRENT_TIMESTAMP,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "featureName" = ${featureName}
    `;
  }

  /**
   * Get feature statistics
   */
  async getFeatureStats(): Promise<{
    totalFeatures: number;
    activeFeatures: number;
    deprecatedFeatures: number;
    categoryBreakdown: Record<string, number>;
    clientExportCount: number;
  }> {
    const stats = await this.prisma.$queryRaw<
      Array<{
        total: number;
        active: number;
        deprecated: number;
        client_export: number;
      }>
    >`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN deprecated = false THEN 1 END) as active,
        COUNT(CASE WHEN deprecated = true THEN 1 END) as deprecated,
        COUNT(CASE WHEN "exportToClient" = true THEN 1 END) as client_export
      FROM "historical_features"
    `;

    const categoryBreakdown = await this.prisma.$queryRaw<
      Array<{ category: string; count: number }>
    >`
      SELECT category, COUNT(*) as count
      FROM "historical_features"
      WHERE deprecated = false
      GROUP BY category
      ORDER BY count DESC
    `;

    const row = stats[0];
    const categoryMap: Record<string, number> = {};
    categoryBreakdown.forEach((row) => {
      categoryMap[row.category] = row.count;
    });

    return {
      totalFeatures: Number(row.total),
      activeFeatures: Number(row.active),
      deprecatedFeatures: Number(row.deprecated),
      categoryBreakdown: categoryMap,
      clientExportCount: Number(row.client_export),
    };
  }
}

export default FeatureRegistryService;
