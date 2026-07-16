-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "courseId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'openweather',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "utcOffsetSeconds" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forecastStart" TIMESTAMP(3),
    "forecastEnd" TIMESTAMP(3),
    "periodCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_periods" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "forecastTime" TIMESTAMP(3) NOT NULL,
    "temperatureC" DOUBLE PRECISION,
    "feelsLikeC" DOUBLE PRECISION,
    "windSpeedMs" DOUBLE PRECISION,
    "windGustMs" DOUBLE PRECISION,
    "windDeg" INTEGER,
    "precipProbability" DOUBLE PRECISION,
    "rainMm" DOUBLE PRECISION,
    "humidity" INTEGER,
    "cloudCover" INTEGER,
    "pressureHpa" INTEGER,
    "visibilityM" INTEGER,
    "conditionCode" INTEGER,
    "conditionLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weather_snapshots_tournamentId_key" ON "weather_snapshots"("tournamentId");

-- CreateIndex
CREATE INDEX "weather_snapshots_tournamentId_idx" ON "weather_snapshots"("tournamentId");

-- CreateIndex
CREATE INDEX "weather_periods_snapshotId_idx" ON "weather_periods"("snapshotId");

-- CreateIndex
CREATE INDEX "weather_periods_forecastTime_idx" ON "weather_periods"("forecastTime");

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_periods" ADD CONSTRAINT "weather_periods_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "weather_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

