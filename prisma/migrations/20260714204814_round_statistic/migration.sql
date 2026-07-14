-- CreateTable
CREATE TABLE "round_statistics" (
    "id" TEXT NOT NULL,
    "playerRoundId" TEXT NOT NULL,
    "drivingDistance" DOUBLE PRECISION,
    "drivingAccuracy" DOUBLE PRECISION,
    "fairwaysHit" INTEGER,
    "fairwaysPossible" INTEGER,
    "greensInRegulation" INTEGER,
    "greensPossible" INTEGER,
    "putts" INTEGER,
    "birdies" INTEGER,
    "eagles" INTEGER,
    "pars" INTEGER,
    "bogeys" INTEGER,
    "doubleBogeys" INTEGER,
    "scramblingPercentage" DOUBLE PRECISION,
    "sandSavePercentage" DOUBLE PRECISION,
    "proximityToHole" DOUBLE PRECISION,
    "sgOffTheTee" DOUBLE PRECISION,
    "sgApproach" DOUBLE PRECISION,
    "sgAroundGreen" DOUBLE PRECISION,
    "sgPutting" DOUBLE PRECISION,
    "sgTotal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "round_statistics_playerRoundId_idx" ON "round_statistics"("playerRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "round_statistics_playerRoundId_key" ON "round_statistics"("playerRoundId");

-- AddForeignKey
ALTER TABLE "round_statistics" ADD CONSTRAINT "round_statistics_playerRoundId_fkey" FOREIGN KEY ("playerRoundId") REFERENCES "player_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
