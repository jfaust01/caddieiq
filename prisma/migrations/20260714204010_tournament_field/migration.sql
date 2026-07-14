-- CreateEnum
CREATE TYPE "TournamentFieldStatus" AS ENUM ('CONFIRMED', 'ALTERNATE', 'WITHDRAWN', 'DISQUALIFIED', 'CUT', 'FINISHED');

-- CreateTable
CREATE TABLE "tournament_fields" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerNumber" INTEGER,
    "status" "TournamentFieldStatus" NOT NULL DEFAULT 'CONFIRMED',
    "isAlternate" BOOLEAN NOT NULL DEFAULT false,
    "qualified" BOOLEAN NOT NULL DEFAULT true,
    "teeTime" TIMESTAMP(3),
    "startingHole" INTEGER,
    "withdrawn" BOOLEAN NOT NULL DEFAULT false,
    "disqualified" BOOLEAN NOT NULL DEFAULT false,
    "cutMade" BOOLEAN,
    "finalPosition" INTEGER,
    "earnings" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_fields_tournamentId_idx" ON "tournament_fields"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_fields_playerId_idx" ON "tournament_fields"("playerId");

-- CreateIndex
CREATE INDEX "tournament_fields_status_idx" ON "tournament_fields"("status");

-- CreateIndex
CREATE INDEX "tournament_fields_teeTime_idx" ON "tournament_fields"("teeTime");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_fields_tournamentId_playerId_key" ON "tournament_fields"("tournamentId", "playerId");

-- AddForeignKey
ALTER TABLE "tournament_fields" ADD CONSTRAINT "tournament_fields_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_fields" ADD CONSTRAINT "tournament_fields_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
