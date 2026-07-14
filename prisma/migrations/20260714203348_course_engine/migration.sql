-- CreateEnum
CREATE TYPE "GrassType" AS ENUM ('BENT', 'BERMUDA', 'POA', 'RYE', 'ZOYSIA', 'FESCUE', 'OTHER');

-- CreateEnum
CREATE TYPE "CourseStyle" AS ENUM ('LINKS', 'PARKLAND', 'DESERT', 'HEATHLAND', 'MOUNTAIN', 'OTHER');

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "stateProvince" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "par" INTEGER,
    "yardage" INTEGER,
    "altitudeFt" INTEGER,
    "establishedYear" INTEGER,
    "website" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_characteristics" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "style" "CourseStyle",
    "fairwayGrass" "GrassType",
    "greenGrass" "GrassType",
    "roughGrass" "GrassType",
    "averageGreenSize" DOUBLE PRECISION,
    "greenSpeed" DOUBLE PRECISION,
    "fairwayWidth" DOUBLE PRECISION,
    "roughLength" DOUBLE PRECISION,
    "treeLined" BOOLEAN,
    "waterHazards" INTEGER,
    "windExposure" DOUBLE PRECISION,
    "elevationChange" DOUBLE PRECISION,
    "walkingDifficulty" DOUBLE PRECISION,
    "drivingImportance" DOUBLE PRECISION,
    "approachImportance" DOUBLE PRECISION,
    "shortGameImportance" DOUBLE PRECISION,
    "puttingImportance" DOUBLE PRECISION,
    "scramblingDifficulty" DOUBLE PRECISION,
    "birdieRate" DOUBLE PRECISION,
    "bogeyRate" DOUBLE PRECISION,
    "varianceRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_country_idx" ON "courses"("country");

-- CreateIndex
CREATE UNIQUE INDEX "course_characteristics_courseId_key" ON "course_characteristics"("courseId");

-- CreateIndex
CREATE INDEX "course_characteristics_courseId_idx" ON "course_characteristics"("courseId");

-- CreateIndex
CREATE INDEX "course_characteristics_style_idx" ON "course_characteristics"("style");

-- AddForeignKey
ALTER TABLE "course_characteristics" ADD CONSTRAINT "course_characteristics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
