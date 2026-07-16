-- Data-integrity audit (2026-07): add durable import-run history and remove the
-- vestigial, never-written player_rankings table.

-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILURE');

-- CreateTable
CREATE TABLE "import_runs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "status" "ImportRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_runs_entity_startedAt_idx" ON "import_runs"("entity", "startedAt");

-- CreateIndex
CREATE INDEX "import_runs_provider_idx" ON "import_runs"("provider");

-- CreateIndex
CREATE INDEX "import_runs_status_idx" ON "import_runs"("status");

-- CreateIndex
CREATE INDEX "import_runs_startedAt_idx" ON "import_runs"("startedAt");

-- DropTable (vestigial: never written by any importer; OWGR lives on
-- player_season_statistics.worldRanking and other ranks are derived live)
DROP TABLE "player_rankings";

-- DropEnum (only referenced by the dropped player_rankings table)
DROP TYPE "RankingSystem";
