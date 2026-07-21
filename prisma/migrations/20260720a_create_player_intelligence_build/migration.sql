-- CreateTable
CREATE TABLE "player_intelligence_builds" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "buildStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "activationStatus" VARCHAR(20) NOT NULL DEFAULT 'CANDIDATE',
    "dataCompleteness" INTEGER NOT NULL DEFAULT 0,
    "featureCount" INTEGER NOT NULL DEFAULT 0,
    "completedFeatureCount" INTEGER NOT NULL DEFAULT 0,
    "activationReason" TEXT,
    "rejectionReason" TEXT,
    "builderVersion" VARCHAR(50) NOT NULL,
    "featureSchemaVersion" VARCHAR(50) NOT NULL,
    "confidencePolicyVersion" VARCHAR(50) NOT NULL,
    "activationPolicyVersion" VARCHAR(50) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_intelligence_builds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_intelligence_builds_playerId_activationStatus_key" ON "player_intelligence_builds"("playerId", "activationStatus");

-- CreateIndex
CREATE INDEX "player_intelligence_builds_playerId_idx" ON "player_intelligence_builds"("playerId");

-- CreateIndex
CREATE INDEX "player_intelligence_builds_buildStatus_idx" ON "player_intelligence_builds"("buildStatus");

-- CreateIndex
CREATE INDEX "player_intelligence_builds_activationStatus_idx" ON "player_intelligence_builds"("activationStatus");

-- CreateIndex
CREATE INDEX "player_intelligence_builds_calculatedAt_idx" ON "player_intelligence_builds"("calculatedAt");

-- CreateIndex
CREATE INDEX "player_intelligence_builds_activatedAt_idx" ON "player_intelligence_builds"("activatedAt");

-- AddForeignKey
ALTER TABLE "player_intelligence_builds" ADD CONSTRAINT "player_intelligence_builds_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
