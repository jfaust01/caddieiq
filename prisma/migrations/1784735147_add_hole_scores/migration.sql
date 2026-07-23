-- CreateTable HoleScore
CREATE TABLE "hole_scores" (
    "id" TEXT NOT NULL,
    "playerRoundId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "score" INTEGER,
    "par" INTEGER,
    "toPar" INTEGER,
    "dkPoints" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hole_scores_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_playerRoundId_fkey" FOREIGN KEY ("playerRoundId") REFERENCES "player_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique constraint
CREATE UNIQUE INDEX "hole_scores_playerRoundId_holeNumber_key" ON "hole_scores"("playerRoundId", "holeNumber");

-- Create indexes
CREATE INDEX "hole_scores_playerRoundId_idx" ON "hole_scores"("playerRoundId");
CREATE INDEX "hole_scores_holeNumber_idx" ON "hole_scores"("holeNumber");
