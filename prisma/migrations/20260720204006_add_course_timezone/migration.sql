-- Add timezone field to courses table for IANA timezone storage
ALTER TABLE "courses" ADD COLUMN "timezone" TEXT;

-- Add index for efficiency when looking up timezone-specific courses
CREATE INDEX "courses_timezone_idx" ON "courses"("timezone");
