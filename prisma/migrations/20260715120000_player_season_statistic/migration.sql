-- CreateTable
CREATE TABLE "player_season_statistics" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "worldRanking" INTEGER,
    "worldRankingLastWeek" INTEGER,
    "events" INTEGER,
    "averagePoints" DOUBLE PRECISION,
    "totalPoints" DOUBLE PRECISION,
    "pointsGained" DOUBLE PRECISION,
    "pointsLost" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_season_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_season_statistics_playerId_idx" ON "player_season_statistics"("playerId");

-- CreateIndex
CREATE INDEX "player_season_statistics_season_idx" ON "player_season_statistics"("season");

-- CreateIndex
CREATE INDEX "player_season_statistics_worldRanking_idx" ON "player_season_statistics"("worldRanking");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_statistics_playerId_season_key" ON "player_season_statistics"("playerId", "season");

-- AddForeignKey
ALTER TABLE "player_season_statistics" ADD CONSTRAINT "player_season_statistics_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
