-- CreateTable
CREATE TABLE "betting_events" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "name" TEXT,
    "startDate" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "betting_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "betting_markets" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "bettingEventId" TEXT NOT NULL,
    "betType" TEXT,
    "name" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "betting_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "betting_outcomes" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "bettingMarketId" TEXT NOT NULL,
    "playerId" TEXT,
    "label" TEXT,
    "payoutAmerican" INTEGER,
    "payoutDecimal" DECIMAL(65,30),
    "available" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "betting_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_projections" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "playerId" TEXT,
    "fantasyPointsDraftKings" DECIMAL(65,30),
    "fantasyPointsFanDuel" DECIMAL(65,30),
    "available" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fantasy_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dfs_salaries" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "playerId" TEXT,
    "operator" TEXT NOT NULL,
    "slateId" TEXT,
    "operatorPlayerName" TEXT,
    "salary" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dfs_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "betting_events_externalId_key" ON "betting_events"("externalId");

-- CreateIndex
CREATE INDEX "betting_events_tournamentId_idx" ON "betting_events"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "betting_markets_externalId_key" ON "betting_markets"("externalId");

-- CreateIndex
CREATE INDEX "betting_markets_bettingEventId_idx" ON "betting_markets"("bettingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "betting_outcomes_externalId_key" ON "betting_outcomes"("externalId");

-- CreateIndex
CREATE INDEX "betting_outcomes_bettingMarketId_idx" ON "betting_outcomes"("bettingMarketId");

-- CreateIndex
CREATE INDEX "betting_outcomes_playerId_idx" ON "betting_outcomes"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_projections_externalId_key" ON "fantasy_projections"("externalId");

-- CreateIndex
CREATE INDEX "fantasy_projections_tournamentId_idx" ON "fantasy_projections"("tournamentId");

-- CreateIndex
CREATE INDEX "fantasy_projections_playerId_idx" ON "fantasy_projections"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "dfs_salaries_externalId_key" ON "dfs_salaries"("externalId");

-- CreateIndex
CREATE INDEX "dfs_salaries_tournamentId_idx" ON "dfs_salaries"("tournamentId");

-- CreateIndex
CREATE INDEX "dfs_salaries_playerId_idx" ON "dfs_salaries"("playerId");

-- AddForeignKey
ALTER TABLE "betting_events" ADD CONSTRAINT "betting_events_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "betting_markets" ADD CONSTRAINT "betting_markets_bettingEventId_fkey" FOREIGN KEY ("bettingEventId") REFERENCES "betting_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "betting_outcomes" ADD CONSTRAINT "betting_outcomes_bettingMarketId_fkey" FOREIGN KEY ("bettingMarketId") REFERENCES "betting_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "betting_outcomes" ADD CONSTRAINT "betting_outcomes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_projections" ADD CONSTRAINT "fantasy_projections_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_projections" ADD CONSTRAINT "fantasy_projections_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfs_salaries" ADD CONSTRAINT "dfs_salaries_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dfs_salaries" ADD CONSTRAINT "dfs_salaries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

