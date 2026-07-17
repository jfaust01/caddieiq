-- CreateTable
CREATE TABLE "tournament_course_mappings" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "sportsDataIoCourseId" TEXT,
    "golfCourseApiCourseId" INTEGER NOT NULL,
    "tournamentCourseName" TEXT,
    "golfCourseCourseName" TEXT,
    "matchConfidence" INTEGER DEFAULT 0,
    "matchedBy" TEXT DEFAULT 'auto-matched',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_course_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_course_mappings_tournamentId_key" ON "tournament_course_mappings"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_course_mappings_golfCourseApiCourseId_idx" ON "tournament_course_mappings"("golfCourseApiCourseId");

-- CreateIndex
CREATE INDEX "tournament_course_mappings_sportsDataIoCourseId_idx" ON "tournament_course_mappings"("sportsDataIoCourseId");
