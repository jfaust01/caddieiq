-- CreateEnum
CREATE TYPE "CoordinateConfidence" AS ENUM ('VERIFIED', 'ESTIMATED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "courses"
    ADD COLUMN "coordinateConfidence" "CoordinateConfidence" NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN "coordinateSource" TEXT,
    ADD COLUMN "coordinatesVerifiedAt" TIMESTAMP(3);

-- Backfill: any course that already has both coordinates predates the
-- geolocation engine. Those were seeded/imported without provenance; treat them
-- as UNKNOWN so the engine can re-verify them rather than trusting unattributed
-- values. (No rows are expected to have coordinates yet, but this is explicit.)
UPDATE "courses"
SET "coordinateConfidence" = 'UNKNOWN'
WHERE "latitude" IS NULL OR "longitude" IS NULL;

-- CreateIndex
CREATE INDEX "courses_coordinateConfidence_idx" ON "courses"("coordinateConfidence");
