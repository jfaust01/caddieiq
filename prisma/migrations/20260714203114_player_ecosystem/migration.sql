-- CreateEnum
CREATE TYPE "Handedness" AS ENUM ('RIGHT', 'LEFT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INJURED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RankingSystem" AS ENUM ('OWGR', 'DATAGOLF', 'CADDIEIQ');

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "turnedProYear" INTEGER,
    "handedness" "Handedness" NOT NULL DEFAULT 'UNKNOWN',
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "headshotUrl" TEXT,
    "countryCode" TEXT,
    "nationalityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationalities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "flagEmoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_tour_histories" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "seasonId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_tour_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_rankings" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rankingSystem" "RankingSystem" NOT NULL,
    "rank" INTEGER NOT NULL,
    "points" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_slug_key" ON "players"("slug");

-- CreateIndex
CREATE INDEX "players_slug_idx" ON "players"("slug");

-- CreateIndex
CREATE INDEX "players_lastName_idx" ON "players"("lastName");

-- CreateIndex
CREATE INDEX "players_countryCode_idx" ON "players"("countryCode");

-- CreateIndex
CREATE INDEX "players_nationalityId_idx" ON "players"("nationalityId");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_iso2_key" ON "nationalities"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_iso3_key" ON "nationalities"("iso3");

-- CreateIndex
CREATE INDEX "player_tour_histories_playerId_idx" ON "player_tour_histories"("playerId");

-- CreateIndex
CREATE INDEX "player_tour_histories_tourId_idx" ON "player_tour_histories"("tourId");

-- CreateIndex
CREATE INDEX "player_tour_histories_seasonId_idx" ON "player_tour_histories"("seasonId");

-- CreateIndex
CREATE INDEX "player_rankings_playerId_idx" ON "player_rankings"("playerId");

-- CreateIndex
CREATE INDEX "player_rankings_rankingSystem_idx" ON "player_rankings"("rankingSystem");

-- CreateIndex
CREATE INDEX "player_rankings_effectiveDate_idx" ON "player_rankings"("effectiveDate");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_tour_histories" ADD CONSTRAINT "player_tour_histories_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_tour_histories" ADD CONSTRAINT "player_tour_histories_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_tour_histories" ADD CONSTRAINT "player_tour_histories_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_rankings" ADD CONSTRAINT "player_rankings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
