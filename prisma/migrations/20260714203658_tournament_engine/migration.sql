-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('STROKE_PLAY', 'MATCH_PLAY', 'TEAM', 'STABLEFORD');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "seasonId" TEXT,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "slug" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "format" "TournamentFormat" NOT NULL DEFAULT 'STROKE_PLAY',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "purse" DECIMAL(65,30),
    "fedExPoints" INTEGER,
    "worldRankingPoints" INTEGER,
    "cutAfterRounds" INTEGER,
    "cutLine" INTEGER,
    "numberOfRounds" INTEGER NOT NULL DEFAULT 4,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_courses" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "hostCourse" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_slug_idx" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_tourId_idx" ON "tournaments"("tourId");

-- CreateIndex
CREATE INDEX "tournaments_seasonId_idx" ON "tournaments"("seasonId");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournament_courses_year_idx" ON "tournament_courses"("year");

-- CreateIndex
CREATE INDEX "tournament_courses_courseId_idx" ON "tournament_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_courses_tournamentId_year_key" ON "tournament_courses"("tournamentId", "year");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_courses" ADD CONSTRAINT "tournament_courses_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_courses" ADD CONSTRAINT "tournament_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
