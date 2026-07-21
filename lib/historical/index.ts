/**
 * Historical Intelligence Platform
 * 
 * Phase 17.3B.0 Implementation
 * 
 * This module provides the foundation for historical data acquisition,
 * feature management, and monitoring across all tournament systems.
 */

export { HistoricalIntelligencePlatform } from "./historical-intelligence-platform";
export { ProviderRegistryService, type ProviderConfig, type ImportJobRecord } from "./provider-registry";
export { FeatureRegistryService, type FeatureDefinition, type FeatureSample } from "./feature-registry";
export {
  HealthDashboardService,
  type DatasetHealth,
  type ProviderHealth,
  type ComprehensiveHealth,
} from "./health-dashboard";
