-- Phase 13.1: Normalize GolfCourseAPI entities into separate relational tables

-- Create CourseHole table (1:M with CourseDetails)
CREATE TABLE IF NOT EXISTS "course_holes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "holeNumber" INTEGER NOT NULL,
  "par" INTEGER,
  "yardage" INTEGER,
  "handicap" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_holes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE,
  CONSTRAINT "course_holes_courseId_holeNumber_key" UNIQUE ("courseId", "holeNumber")
);

CREATE INDEX "course_holes_courseId_idx" ON "course_holes"("courseId");

-- Create CourseTee table (1:M with CourseDetails)
CREATE TABLE IF NOT EXISTS "course_tees" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "teeName" TEXT NOT NULL,
  "teeColor" TEXT,
  "gender" TEXT,
  "yardage" INTEGER,
  "rating" DOUBLE PRECISION,
  "slope" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_tees_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE,
  CONSTRAINT "course_tees_courseId_teeName_key" UNIQUE ("courseId", "teeName")
);

CREATE INDEX "course_tees_courseId_idx" ON "course_tees"("courseId");

-- Create CourseAddress table (1:1 with CourseDetails)
CREATE TABLE IF NOT EXISTS "course_addresses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL UNIQUE,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT,
  "postalCode" TEXT,
  "website" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_addresses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE
);

CREATE INDEX "course_addresses_courseId_idx" ON "course_addresses"("courseId");

-- Create CourseCoordinates table (1:1 with CourseDetails)
CREATE TABLE IF NOT EXISTS "course_coordinates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL UNIQUE,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "elevation" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_coordinates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE
);

CREATE INDEX "course_coordinates_courseId_idx" ON "course_coordinates"("courseId");
CREATE INDEX "course_coordinates_latitude_longitude_idx" ON "course_coordinates"("latitude", "longitude");

-- Create CourseSpecifications table (1:1 with CourseDetails)
CREATE TABLE IF NOT EXISTS "course_specifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL UNIQUE,
  "par" INTEGER,
  "totalYardage" INTEGER,
  "courseRating" DOUBLE PRECISION,
  "slopeRating" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_specifications_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE
);

CREATE INDEX "course_specifications_courseId_idx" ON "course_specifications"("courseId");

-- Create CourseMetadata table (1:1 with CourseDetails)
CREATE TABLE IF NOT EXISTS "course_metadata" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL UNIQUE,
  "architect" TEXT,
  "yearBuilt" INTEGER,
  "courseStyle" TEXT,
  "drivingRange" BOOLEAN,
  "puttingGreen" BOOLEAN,
  "shortGameArea" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_metadata_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE
);

CREATE INDEX "course_metadata_courseId_idx" ON "course_metadata"("courseId");

-- Create PlayingConditions table (1:M with CourseDetails)
CREATE TABLE IF NOT EXISTS "playing_conditions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "grassTypeFairway" TEXT,
  "grassTypeGreen" TEXT,
  "greenSize" TEXT,
  "greenSpeed" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "playing_conditions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course_details" ("id") ON DELETE CASCADE
);

CREATE INDEX "playing_conditions_courseId_idx" ON "playing_conditions"("courseId");
CREATE INDEX "playing_conditions_courseId_observedAt_idx" ON "playing_conditions"("courseId", "observedAt");

-- Create TeeHoleYardage table (many-to-many: tees × holes)
CREATE TABLE IF NOT EXISTS "tee_hole_yardages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teeId" TEXT NOT NULL,
  "holeId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "yardage" INTEGER,
  "handicap" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tee_hole_yardages_teeId_fkey" FOREIGN KEY ("teeId") REFERENCES "course_tees" ("id") ON DELETE CASCADE,
  CONSTRAINT "tee_hole_yardages_holeId_fkey" FOREIGN KEY ("holeId") REFERENCES "course_holes" ("id") ON DELETE CASCADE,
  CONSTRAINT "tee_hole_yardages_unique_tee_hole" UNIQUE ("teeId", "holeId")
);

CREATE INDEX "tee_hole_yardages_teeId_idx" ON "tee_hole_yardages"("teeId");
CREATE INDEX "tee_hole_yardages_holeId_idx" ON "tee_hole_yardages"("holeId");
CREATE INDEX "tee_hole_yardages_courseId_idx" ON "tee_hole_yardages"("courseId");

-- Migrate existing data from CourseDetails into new normalized tables
-- For each course, create normalized records from flattened fields
-- NOTE: Column drops are now safe with IF EXISTS - data migration only runs if columns still exist

DO $$ BEGIN
  -- Only attempt data migration if columns still exist in course_details
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_details' AND column_name = 'city'
  ) THEN
    INSERT INTO "course_addresses" ("id", "courseId", "city", "state", "country", "website", "phone", "createdAt", "updatedAt")
    SELECT 
      concat('addr_', "id"),
      "id",
      "city",
      "state",
      "country",
      "website",
      "phone",
      "createdAt",
      "updatedAt"
    FROM "course_details"
    WHERE "city" IS NOT NULL OR "state" IS NOT NULL OR "country" IS NOT NULL OR "website" IS NOT NULL OR "phone" IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_details' AND column_name = 'latitude'
  ) THEN
    INSERT INTO "course_coordinates" ("id", "courseId", "latitude", "longitude", "elevation", "createdAt", "updatedAt")
    SELECT 
      concat('coord_', "id"),
      "id",
      "latitude",
      "longitude",
      "elevation",
      "createdAt",
      "updatedAt"
    FROM "course_details"
    WHERE "latitude" IS NOT NULL OR "longitude" IS NOT NULL OR "elevation" IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_details' AND column_name = 'par'
  ) THEN
    INSERT INTO "course_specifications" ("id", "courseId", "par", "totalYardage", "courseRating", "slopeRating", "createdAt", "updatedAt")
    SELECT 
      concat('spec_', "id"),
      "id",
      "par",
      "totalYardage",
      "courseRating",
      "slopeRating",
      "createdAt",
      "updatedAt"
    FROM "course_details"
    WHERE "par" IS NOT NULL OR "totalYardage" IS NOT NULL OR "courseRating" IS NOT NULL OR "slopeRating" IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_details' AND column_name = 'architect'
  ) THEN
    INSERT INTO "course_metadata" ("id", "courseId", "architect", "yearBuilt", "courseStyle", "drivingRange", "puttingGreen", "shortGameArea", "createdAt", "updatedAt")
    SELECT 
      concat('meta_', "id"),
      "id",
      "architect",
      "yearBuilt",
      "courseStyle",
      "drivingRange",
      "puttingGreen",
      "shortGameArea",
      "createdAt",
      "updatedAt"
    FROM "course_details"
    WHERE "architect" IS NOT NULL OR "yearBuilt" IS NOT NULL OR "courseStyle" IS NOT NULL OR "drivingRange" IS NOT NULL OR "puttingGreen" IS NOT NULL OR "shortGameArea" IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_details' AND column_name = 'grassTypeFairway'
  ) THEN
    INSERT INTO "playing_conditions" ("id", "courseId", "grassTypeFairway", "grassTypeGreen", "greenSize", "greenSpeed", "createdAt", "updatedAt")
    SELECT 
      concat('play_', "id"),
      "id",
      "grassTypeFairway",
      "grassTypeGreen",
      "greenSize",
      "greenSpeed",
      "createdAt",
      "updatedAt"
    FROM "course_details"
    WHERE "grassTypeFairway" IS NOT NULL OR "grassTypeGreen" IS NOT NULL OR "greenSize" IS NOT NULL OR "greenSpeed" IS NOT NULL;
  END IF;
END $$;

-- Alter CourseDetails table to remove denormalized columns (safe operations)
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "city" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "state" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "country" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "latitude" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "longitude" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "elevation" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "par" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "totalYardage" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "courseRating" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "slopeRating" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "website" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "phone" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "architect" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "yearBuilt" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "courseStyle" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "grassTypeFairway" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "grassTypeGreen" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "greenSize" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "greenSpeed" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "drivingRange" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "puttingGreen" CASCADE;
ALTER TABLE "course_details" DROP COLUMN IF EXISTS "shortGameArea" CASCADE;
