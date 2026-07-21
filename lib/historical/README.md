# Historical Intelligence Platform (Phase 17.3B.0)

## Overview

The Historical Intelligence Platform is the foundational layer for managing all historical data acquisition, feature engineering, and data quality monitoring. It provides a unified interface for registering data providers, tracking engineered features, monitoring data quality, and orchestrating historical imports.

**Status**: Foundation Layer Implemented ✅
**Scope**: Phase 17.3B.0 (Service Layer Foundation)
**Next Phase**: Phase 17.3C (Provider Implementation)

## Architecture

The platform is composed of four core services:

### 1. Provider Registry Service (`provider-registry.ts`)

Manages data provider metadata, licensing, and import job tracking.

**Responsibilities:**
- Register and manage data providers
- Track provider health status
- Monitor API rate limits
- Track import job execution
- Calculate provider statistics

**Key Methods:**
```typescript
registerProvider(config)           // Register a new provider
getProvider(providerId)             // Get provider details
listProviders(onlyActive)           // List all providers
updateProviderHealth(providerId)    // Update health status
createImportJob(job)                // Track an import job
getImportJobs(providerId, limit)    // Get job history
getImportStats(providerId)          // Get provider statistics
```

### 2. Feature Registry Service (`feature-registry.ts`)

Manages feature definitions, versioning, dependencies, and sample validation.

**Responsibilities:**
- Register feature definitions
- Track feature dependencies
- Version feature definitions
- Manage deprecated features
- Record validation samples
- Calculate feature statistics

**Key Methods:**
```typescript
registerFeature(feature)            // Register a feature
getFeature(featureName)             // Get feature definition
listFeaturesByCategory(category)    // List features by category
getFeatureDependencies(featureName) // Get dependency tree
recordSample(sample)                // Record validation sample
getSamples(featureId, tournamentId) // Get samples for tournament
deprecateFeature(featureName)       // Mark feature as deprecated
getFeatureStats()                   // Get overall statistics
```

### 3. Health Dashboard Service (`health-dashboard.ts`)

Monitors data coverage, freshness, quality, and provider health.

**Responsibilities:**
- Record health snapshots
- Calculate data coverage metrics
- Identify stale datasets
- Detect data quality issues
- Generate comprehensive reports
- Track historical trends

**Key Methods:**
```typescript
recordHealthSnapshot(health)        // Record dataset health
getDatasetHealth(type, provider)    // Get current health
getAllDatasetHealth()               // Get all datasets
getComprehensiveHealth()            // Get full health report
getHealthTrend(type, provider)      // Get historical trend
```

### 4. Historical Intelligence Platform (`historical-intelligence-platform.ts`)

Orchestrates all services and provides the main API.

**Responsibilities:**
- Initialize platform with core providers
- Orchestrate provider lifecycle
- Aggregate health reports
- Export platform status
- Provide unified access to all services

## Core Tables

### `historical_providers`
Stores provider metadata and configuration.

```sql
- id: TEXT PRIMARY KEY
- providerId: TEXT UNIQUE
- name: TEXT
- version: TEXT
- priority: INTEGER
- supportedDatasets: TEXT[]
- historicalDepthDays: INTEGER
- coverage: DOUBLE PRECISION
- licensingStatus: TEXT
- healthStatus: TEXT (ENUM)
- lastSuccessfulSync: TIMESTAMP
- rateLimitPerSecond: INTEGER
- rateLimitPerDay: INTEGER
- configuration: JSONB
- isActive: BOOLEAN
- createdAt, updatedAt: TIMESTAMP
```

### `historical_provider_import_jobs`
Tracks every import job execution.

```sql
- id: TEXT PRIMARY KEY
- providerId: TEXT FOREIGN KEY
- jobId: TEXT
- datasetType: TEXT
- recordsRead, recordsInserted, recordsUpdated, recordsRejected: INTEGER
- validationErrors: INTEGER
- duration: INTEGER (milliseconds)
- sourceChecksum: TEXT
- startedAt, completedAt: TIMESTAMP
- createdAt: TIMESTAMP
```

### `historical_features`
Registry of all engineered features.

```sql
- id: TEXT PRIMARY KEY
- featureName: TEXT UNIQUE
- description: TEXT
- category: TEXT (ENUM)
- owner, provider, formula: TEXT
- version: TEXT
- dependencies: TEXT[]
- validationRules: JSONB
- usedBy: TEXT[]
- deprecated: BOOLEAN
- deprecatedAt: TIMESTAMP
- explainable, exportToClient: BOOLEAN
- createdAt, updatedAt: TIMESTAMP
```

### `historical_feature_samples`
Validation and sample data for features.

```sql
- id: TEXT PRIMARY KEY
- featureId: TEXT FOREIGN KEY
- playerId: TEXT FOREIGN KEY
- tournamentId: TEXT FOREIGN KEY
- value: TEXT
- unitOfMeasure: TEXT
- validFrom, validTo: TIMESTAMP
- source: TEXT
- checksum: TEXT
- createdAt: TIMESTAMP
- UNIQUE (featureId, playerId, tournamentId)
```

### `dataset_health_snapshots`
Health metrics for datasets.

```sql
- id: TEXT PRIMARY KEY
- datasetType: TEXT
- provider: TEXT
- coveragePercent: DOUBLE PRECISION
- lastUpdateTime: TIMESTAMP
- staleDays: INTEGER
- missingPlayers, missingTournaments: INTEGER
- duplicateCount, validationFailures: INTEGER
- createdAt: TIMESTAMP
- UNIQUE (datasetType, provider)
```

## Core Providers

The platform initializes with six core providers:

### 1. SportsDataIO (Priority: 100)
- **Datasets**: Tournament Editions, Course Editions, Player Versions, Statistics, Outcomes
- **Depth**: 5 years
- **Coverage**: 95%
- **License**: INCLUDED
- **Rate Limits**: 10/sec, 100k/day

### 2. DataGolf (Priority: 90)
- **Datasets**: OWGR Rankings, Strokes Gained Metrics
- **Depth**: 5 years
- **Coverage**: 90%
- **License**: INCLUDED
- **Rate Limits**: 5/sec, 50k/day

### 3. DraftKings (Priority: 85)
- **Datasets**: Salary Data, Ownership Data
- **Depth**: 2 years
- **Coverage**: 98%
- **License**: INCLUDED (Public API)
- **Rate Limits**: 20/sec, 100k/day

### 4. Genius Sports (Priority: 75)
- **Datasets**: Betting Markets/Odds
- **Depth**: 3 years
- **Coverage**: 85%
- **License**: EVALUATION (Pending)
- **Status**: Currently Inactive

### 5. Internal: Course Fit Calculator
- **Datasets**: Engineered Course Fit Scores
- **Depth**: 3+ years
- **Coverage**: 100%
- **License**: Internal
- **Status**: Ready for Phase 17.3C

### 6. Internal: Rolling Form Calculator
- **Datasets**: Player Form Metrics
- **Depth**: Rolling (Last 30/60/90 days)
- **Coverage**: 100%
- **License**: Internal
- **Status**: Ready for Phase 17.3C

## Usage Examples

### Initialize the Platform

```typescript
import { HistoricalIntelligencePlatform } from "@/lib/historical";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const platform = new HistoricalIntelligencePlatform(prisma);

// Initialize core providers and features
await platform.initialize();
```

### Register a Custom Feature

```typescript
await platform.registerFeature({
  featureName: "avg_sg_last_10",
  description: "Average strokes gained last 10 tournaments",
  category: "FORM_METRICS",
  owner: "data-team",
  provider: "internal",
  formula: "AVG(sg_total) WHERE rounds_last_n = 10",
  version: "1.0",
  dependencies: ["sg_total", "tournament_date"],
  validationRules: {
    min: -5,
    max: 5,
    required: true,
  },
  usedBy: ["model-lab", "command-center"],
  deprecated: false,
  explainable: true,
  exportToClient: true,
});
```

### Record Provider Health

```typescript
await platform.recordHealthSnapshot({
  datasetType: "STATISTICS",
  provider: "SportsDataIO",
  coveragePercent: 95,
  lastUpdateTime: new Date(),
  staleDays: 1,
  missingPlayers: 5,
  missingTournaments: 2,
  duplicateCount: 0,
  validationFailures: 3,
});
```

### Get Comprehensive Health Report

```typescript
const health = await platform.getComprehensiveHealth();

console.log(health);
// {
//   timestamp: Date,
//   overallStatus: "healthy" | "degraded" | "critical",
//   providers: [...],
//   datasets: [...],
//   missingDatasets: [...],
//   recommendations: [...]
// }
```

### Export Platform Status

```typescript
const status = await platform.exportStatus();

// {
//   platformStatus: "healthy",
//   providers: [...],
//   health: {...},
//   features: {
//     totalFeatures: 45,
//     activeFeatures: 43,
//     deprecatedFeatures: 2,
//     categoryBreakdown: {...}
//   },
//   timestamp: Date
// }
```

## Phase Timeline

### ✅ Phase 17.3B.0 (Complete)
- [x] Provider Registry Service
- [x] Feature Registry Service
- [x] Health Dashboard Service
- [x] Platform Orchestrator
- [x] Warehouse Foundation Tables
- [x] Documentation

### 🔄 Phase 17.3C (In Design)
- Implement ProviderAdapter interface for each provider
- Build SportsDataIO adapter (Rankings, Statistics, Outcomes)
- Build DataGolf adapter (OWGR Rankings)
- Build DraftKings adapter (Salaries, Ownership)
- Implement temporal validation framework
- Build idempotent import orchestration
- Create integration test suite

### 📋 Phase 17.4 (In Scope)
- Historical replay validation
- Cutoff enforcement tests
- Snapshot immutability verification
- Deterministic feature computation
- Full end-to-end replay cycle testing

## Monitoring & Health

The platform provides real-time health monitoring:

**Status Levels:**
- `healthy` - Coverage >80%, <30 days stale, <100 failures
- `degraded` - Coverage 50-80%, 30-60 days stale, 100-1000 failures
- `critical` - Coverage <50%, >60 days stale, >1000 failures

**Recommendations Generated:**
- Coverage warnings below thresholds
- Staleness alerts for datasets not updated
- Missing dataset alerts
- Data quality issues (high failure rates)
- Provider disconnection alerts

## Security & Governance

**Data Provenance:**
- Every record tracks source provider
- Import jobs tracked with checksums
- Temporal validity windows maintained
- Change audit trail via timestamps

**Access Control:**
- Feature export flags control client visibility
- Provider licensing status tracked
- Rate limiting per provider
- Configuration JSONB for provider-specific rules

**Data Integrity:**
- Checksum verification for deduplication
- Temporal validation against cutoff times
- Unique constraints prevent duplicates
- Foreign key relationships enforced

## Performance

**Indexes:**
- Provider lookup by providerId
- Import jobs by provider and dataset
- Features by category and deprecation status
- Health snapshots by dataset and provider
- Feature samples by feature, player, tournament

**Query Optimization:**
- Batch operations supported
- Aggregation queries optimized
- Historical data archived by date
- View-based reporting for dashboards

## Next Steps

1. **Implement Phase 17.3C**: Provider adapters for each data source
2. **Build Import Pipeline**: Idempotent import orchestration
3. **Add Integration Tests**: Comprehensive test coverage
4. **Deploy Monitoring**: Real-time health dashboard
5. **Scale Infrastructure**: Optimize for production loads

## References

- Phase 17.3B Documentation: `PHASE_17_3B_COMPLETION_STATUS.md`
- Provider Acquisition Roadmap: `PHASE_17_3B_PROVIDER_ACQUISITION_ROADMAP.md`
- Historical Dataset Catalog: `PHASE_17_3B_HISTORICAL_DATASET_CATALOG.md`
- Projection Engine Audit: `PHASE_17_3B_PROJECTION_ENGINE_AUDIT.md`
