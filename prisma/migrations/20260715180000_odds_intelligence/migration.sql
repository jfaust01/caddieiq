-- CreateEnum
CREATE TYPE "OddsMarketType" AS ENUM ('TOURNAMENT_WINNER', 'TOP_5', 'TOP_10', 'TOP_20', 'MAKE_CUT', 'MISS_CUT');

-- CreateTable
CREATE TABLE "odds_events" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "sportKey" TEXT NOT NULL,
    "sportTitle" TEXT,
    "tournamentId" TEXT,
    "commenceTime" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'the-odds-api',
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odds_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odds_quotes" (
    "id" TEXT NOT NULL,
    "oddsEventId" TEXT NOT NULL,
    "market" "OddsMarketType" NOT NULL,
    "bookmakerKey" TEXT NOT NULL,
    "bookmakerTitle" TEXT NOT NULL,
    "selection" TEXT NOT NULL,
    "selectionSlug" TEXT NOT NULL,
    "playerId" TEXT,
    "decimalOdds" DECIMAL(65,30) NOT NULL,
    "americanOdds" INTEGER NOT NULL,
    "impliedProbability" DECIMAL(65,30) NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odds_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "odds_events_providerEventId_key" ON "odds_events"("providerEventId");

-- CreateIndex
CREATE INDEX "odds_events_tournamentId_idx" ON "odds_events"("tournamentId");

-- CreateIndex
CREATE INDEX "odds_events_sportKey_idx" ON "odds_events"("sportKey");

-- CreateIndex
CREATE INDEX "odds_quotes_oddsEventId_idx" ON "odds_quotes"("oddsEventId");

-- CreateIndex
CREATE INDEX "odds_quotes_playerId_idx" ON "odds_quotes"("playerId");

-- CreateIndex
CREATE INDEX "odds_quotes_oddsEventId_market_idx" ON "odds_quotes"("oddsEventId", "market");

-- CreateIndex
CREATE UNIQUE INDEX "odds_quotes_oddsEventId_market_bookmakerKey_selectionSlug_key" ON "odds_quotes"("oddsEventId", "market", "bookmakerKey", "selectionSlug");

-- AddForeignKey
ALTER TABLE "odds_events" ADD CONSTRAINT "odds_events_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odds_quotes" ADD CONSTRAINT "odds_quotes_oddsEventId_fkey" FOREIGN KEY ("oddsEventId") REFERENCES "odds_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odds_quotes" ADD CONSTRAINT "odds_quotes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
