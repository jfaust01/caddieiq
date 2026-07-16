-- CreateEnum
CREATE TYPE "WeatherImportResult" AS ENUM ('STORED', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "weather_import_logs" (
    "id" TEXT NOT NULL,
    "importRunId" TEXT,
    "tournamentId" TEXT NOT NULL,
    "tournamentName" TEXT NOT NULL,
    "courseId" TEXT,
    "courseName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "forecastEligible" BOOLEAN NOT NULL DEFAULT false,
    "providerResponse" TEXT,
    "rowsInserted" INTEGER NOT NULL DEFAULT 0,
    "rowsUpdated" INTEGER NOT NULL DEFAULT 0,
    "periodsWritten" INTEGER NOT NULL DEFAULT 0,
    "skippedReason" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "result" "WeatherImportResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weather_import_logs_tournamentId_idx" ON "weather_import_logs"("tournamentId");

-- CreateIndex
CREATE INDEX "weather_import_logs_createdAt_idx" ON "weather_import_logs"("createdAt");

-- CreateIndex
CREATE INDEX "weather_import_logs_result_idx" ON "weather_import_logs"("result");

-- AddForeignKey
ALTER TABLE "weather_import_logs" ADD CONSTRAINT "weather_import_logs_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
