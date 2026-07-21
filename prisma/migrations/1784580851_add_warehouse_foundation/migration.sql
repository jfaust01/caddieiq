-- Create enum types
CREATE TYPE "DatasetType" AS ENUM ('TOURNAMENT_EDITIONS', 'COURSE_EDITIONS', 'PLAYER_VERSIONS', 'RANKINGS', 'STATISTICS', 'STROKES_GAINED', 'DRAFT_KINGS_SALARIES', 'BETTING_MARKETS', 'WEATHER', 'OWNERSHIP', 'TOURNAMENT_OUTCOMES', 'engineered_FEATURES', 'SNAPSHOTS');

CREATE TYPE "ProviderHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'MAINTENANCE');

CREATE TYPE "FeatureCategory" AS ENUM ('SKILL_METRICS', 'FORM_METRICS', 'COURSE_HISTORY', 'COURSE_FIT', 'RANKINGS', 'OWNERSHIP', 'PLAYER_ATTRIBUTES', 'DERIVED', 'COMPOSITE');

-- Create Provider Registry table
CREATE TABLE "historical_providers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "supportedDatasets" "DatasetType"[] NOT NULL DEFAULT ARRAY[]::"DatasetType"[],
  "historicalDepthDays" INTEGER,
  "coverage" DOUBLE PRECISION,
  "licensingStatus" TEXT NOT NULL,
  "healthStatus" "ProviderHealthStatus" NOT NULL DEFAULT 'HEALTHY',
  "lastSuccessfulSync" TIMESTAMP(3),
  "rateLimitPerSecond" INTEGER,
  "rateLimitPerDay" INTEGER,
  "configuration" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "historical_providers_providerId_idx" ON "historical_providers"("providerId");

-- Create Provider Import Job tracking
CREATE TABLE "historical_provider_import_jobs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "datasetType" "DatasetType" NOT NULL,
  "recordsRead" INTEGER,
  "recordsInserted" INTEGER,
  "recordsUpdated" INTEGER,
  "recordsRejected" INTEGER,
  "validationErrors" INTEGER,
  "duration" INTEGER,
  "sourceChecksum" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("providerId") REFERENCES "historical_providers"("id") ON DELETE CASCADE
);

CREATE INDEX "historical_provider_import_jobs_providerId_idx" ON "historical_provider_import_jobs"("providerId");
CREATE INDEX "historical_provider_import_jobs_datasetType_idx" ON "historical_provider_import_jobs"("datasetType");

-- Create Feature Registry
CREATE TABLE "historical_features" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "featureName" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "category" "FeatureCategory" NOT NULL,
  "owner" TEXT,
  "provider" TEXT,
  "formula" TEXT,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "dependencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "validationRules" JSONB,
  "usedBy" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "deprecated" BOOLEAN NOT NULL DEFAULT false,
  "deprecatedAt" TIMESTAMP(3),
  "explainable" BOOLEAN NOT NULL DEFAULT true,
  "exportToClient" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "historical_features_category_idx" ON "historical_features"("category");
CREATE INDEX "historical_features_deprecated_idx" ON "historical_features"("deprecated");

-- Create Feature Samples for validation/testing
CREATE TABLE "historical_feature_samples" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "featureId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "unitOfMeasure" TEXT,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3),
  "source" TEXT,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("featureId", "playerId", "tournamentId"),
  FOREIGN KEY ("featureId") REFERENCES "historical_features"("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE,
  FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE
);

CREATE INDEX "historical_feature_samples_featureId_idx" ON "historical_feature_samples"("featureId");
CREATE INDEX "historical_feature_samples_validFrom_validTo_idx" ON "historical_feature_samples"("validFrom", "validTo");

-- Create Dataset Health Snapshots
CREATE TABLE "dataset_health_snapshots" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "datasetType" "DatasetType" NOT NULL,
  "provider" TEXT NOT NULL,
  "coveragePercent" DOUBLE PRECISION NOT NULL,
  "lastUpdateTime" TIMESTAMP(3),
  "staleDays" INTEGER,
  "missingPlayers" INTEGER,
  "missingTournaments" INTEGER,
  "duplicateCount" INTEGER,
  "validationFailures" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("datasetType", "provider")
);
