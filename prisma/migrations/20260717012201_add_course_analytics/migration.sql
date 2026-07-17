-- CreateTable
CREATE TABLE "course_analytics" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "difficultyRating" DOUBLE PRECISION,
    "birdieRating" DOUBLE PRECISION,
    "bogeyRating" DOUBLE PRECISION,
    "volatilityRating" DOUBLE PRECISION,
    "dfsScoringRating" DOUBLE PRECISION,
    "averageWinningScore" DOUBLE PRECISION,
    "averageCutScore" DOUBLE PRECISION,
    "averageScoreToPar" DOUBLE PRECISION,
    "par3Difficulty" DOUBLE PRECISION,
    "par4Difficulty" DOUBLE PRECISION,
    "par5Difficulty" DOUBLE PRECISION,
    "historicalBirdieRate" DOUBLE PRECISION,
    "historicalBogeyRate" DOUBLE PRECISION,
    "historicalEagleRate" DOUBLE PRECISION,
    "courseArchetype" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_analytics_courseId_key" ON "course_analytics"("courseId");

-- CreateIndex
CREATE INDEX "course_analytics_courseId_idx" ON "course_analytics"("courseId");

-- AddForeignKey
ALTER TABLE "course_analytics" ADD CONSTRAINT "course_analytics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
