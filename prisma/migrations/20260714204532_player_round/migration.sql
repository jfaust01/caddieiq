-- CreateTable
CREATE TABLE "player_rounds" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "tournamentFieldId" TEXT NOT NULL,
    "score" INTEGER,
    "toPar" INTEGER,
    "position" INTEGER,
    "madeCut" BOOLEAN,
    "withdrawn" BOOLEAN NOT NULL DEFAULT false,
    "disqualified" BOOLEAN NOT NULL DEFAULT false,
    "teeTime" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_rounds_roundId_idx" ON "player_rounds"("roundId");

-- CreateIndex
CREATE INDEX "player_rounds_tournamentFieldId_idx" ON "player_rounds"("tournamentFieldId");

-- CreateIndex
CREATE INDEX "player_rounds_position_idx" ON "player_rounds"("position");

-- CreateIndex
CREATE UNIQUE INDEX "player_rounds_roundId_tournamentFieldId_key" ON "player_rounds"("roundId", "tournamentFieldId");

-- AddForeignKey
ALTER TABLE "player_rounds" ADD CONSTRAINT "player_rounds_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_rounds" ADD CONSTRAINT "player_rounds_tournamentFieldId_fkey" FOREIGN KEY ("tournamentFieldId") REFERENCES "tournament_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
