import { PrismaClient } from "@prisma/client";
import ProviderRegistryService, { ProviderConfig } from "./provider-registry";
import FeatureRegistryService, { FeatureDefinition } from "./feature-registry";
import HealthDashboardService, { ComprehensiveHealth } from "./health-dashboard";

/**
 * Historical Intelligence Platform
 * 
 * Orchestrates all historical data acquisition, feature management, and health monitoring.
 * This is the main entry point for the Phase 17.3B.0 foundation implementation.
 * 
 * Responsibilities:
 * - Provider lifecycle management
 * - Feature registry and dependency tracking
 * - Import job orchestration
 * - Data quality monitoring
 * - Health reporting and dashboards
 */
export class HistoricalIntelligencePlatform {
  private prisma: PrismaClient;
  private providerRegistry: ProviderRegistryService;
  private featureRegistry: FeatureRegistryService;
  private healthDashboard: HealthDashboardService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.providerRegistry = new ProviderRegistryService(prisma);
    this.featureRegistry = new FeatureRegistryService(prisma);
    this.healthDashboard = new HealthDashboardService(prisma);
  }

  /**
   * Initialize the platform with core providers
   */
  async initialize(): Promise<void> {
    console.log("[v0] Initializing Historical Intelligence Platform");

    // Register core providers
    const coreProviders = [
      {
        providerId: "sportsdata_io",
        name: "SportsDataIO",
        version: "2.0",
        priority: 100,
        supportedDatasets: [
          "TOURNAMENT_EDITIONS",
          "COURSE_EDITIONS",
          "PLAYER_VERSIONS",
          "STATISTICS",
          "TOURNAMENT_OUTCOMES",
        ],
        historicalDepthDays: 1825, // 5 years
        coverage: 95,
        licensingStatus: "INCLUDED",
        healthStatus: "HEALTHY",
        rateLimitPerSecond: 10,
        rateLimitPerDay: 100000,
        isActive: true,
      },
      {
        providerId: "datagolf",
        name: "DataGolf",
        version: "1.0",
        priority: 90,
        supportedDatasets: ["RANKINGS", "STROKES_GAINED"],
        historicalDepthDays: 1825,
        coverage: 90,
        licensingStatus: "INCLUDED",
        healthStatus: "HEALTHY",
        rateLimitPerSecond: 5,
        rateLimitPerDay: 50000,
        isActive: true,
      },
      {
        providerId: "draftkings",
        name: "DraftKings",
        version: "1.0",
        priority: 85,
        supportedDatasets: ["DRAFT_KINGS_SALARIES", "OWNERSHIP"],
        historicalDepthDays: 730, // 2 years
        coverage: 98,
        licensingStatus: "INCLUDED",
        healthStatus: "HEALTHY",
        rateLimitPerSecond: 20,
        rateLimitPerDay: 100000,
        isActive: true,
      },
      {
        providerId: "genius_sports",
        name: "Genius Sports",
        version: "1.0",
        priority: 75,
        supportedDatasets: ["BETTING_MARKETS"],
        historicalDepthDays: 1095, // 3 years
        coverage: 85,
        licensingStatus: "EVALUATION",
        healthStatus: "HEALTHY",
        rateLimitPerSecond: 5,
        rateLimitPerDay: 50000,
        isActive: false, // Pending evaluation
      },
    ];

    for (const provider of coreProviders) {
      const existing = await this.providerRegistry.getProvider(provider.providerId);
      if (!existing) {
        await this.providerRegistry.registerProvider(provider);
        console.log(`[v0] Registered provider: ${provider.name}`);
      }
    }

    console.log("[v0] Historical Intelligence Platform initialized");
  }

  /**
   * Register a core feature
   */
  async registerFeature(feature: Omit<FeatureDefinition, "id" | "createdAt" | "updatedAt">): Promise<FeatureDefinition> {
    return this.featureRegistry.registerFeature(feature);
  }

  /**
   * Get a feature by name
   */
  async getFeature(featureName: string): Promise<FeatureDefinition | null> {
    return this.featureRegistry.getFeature(featureName);
  }

  /**
   * List features by category
   */
  async listFeaturesByCategory(category: string): Promise<FeatureDefinition[]> {
    return this.featureRegistry.listFeaturesByCategory(category);
  }

  /**
   * Get feature dependency information
   */
  async getFeatureDependencies(featureName: string): Promise<any> {
    return this.featureRegistry.getFeatureDependencies(featureName);
  }

  /**
   * Register a provider
   */
  async registerProvider(config: Omit<ProviderConfig, "id">): Promise<ProviderConfig> {
    return this.providerRegistry.registerProvider(config);
  }

  /**
   * Get provider information
   */
  async getProvider(providerId: string): Promise<ProviderConfig | null> {
    return this.providerRegistry.getProvider(providerId);
  }

  /**
   * List all providers
   */
  async listProviders(onlyActive: boolean = true): Promise<ProviderConfig[]> {
    return this.providerRegistry.listProviders(onlyActive);
  }

  /**
   * Get import job statistics
   */
  async getProviderStats(providerId: string): Promise<any> {
    return this.providerRegistry.getImportStats(providerId);
  }

  /**
   * Get comprehensive health report
   */
  async getComprehensiveHealth(): Promise<ComprehensiveHealth> {
    return this.healthDashboard.getComprehensiveHealth();
  }

  /**
   * Record a health snapshot
   */
  async recordHealthSnapshot(health: any): Promise<any> {
    return this.healthDashboard.recordHealthSnapshot(health);
  }

  /**
   * Get health trend
   */
  async getHealthTrend(datasetType: string, provider: string, days?: number): Promise<any[]> {
    return this.healthDashboard.getHealthTrend(datasetType, provider, days);
  }

  /**
   * Export platform status for monitoring
   */
  async exportStatus(): Promise<{
    platformStatus: string;
    providers: ProviderConfig[];
    health: ComprehensiveHealth;
    features: any;
    timestamp: Date;
  }> {
    const providers = await this.listProviders();
    const health = await this.getComprehensiveHealth();
    const features = await this.featureRegistry.getFeatureStats();

    return {
      platformStatus: health.overallStatus,
      providers,
      health,
      features,
      timestamp: new Date(),
    };
  }

  /**
   * Shutdown the platform cleanly
   */
  async shutdown(): Promise<void> {
    console.log("[v0] Shutting down Historical Intelligence Platform");
    await this.prisma.$disconnect();
  }

  // Expose services for advanced use cases
  get providers(): ProviderRegistryService {
    return this.providerRegistry;
  }

  get features(): FeatureRegistryService {
    return this.featureRegistry;
  }

  get health(): HealthDashboardService {
    return this.healthDashboard;
  }
}

export default HistoricalIntelligencePlatform;
