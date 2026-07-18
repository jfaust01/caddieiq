-- Add confidence scoring fields to tournament_course_mappings

-- Add confidenceReason column (stores reasons for the confidence score)
ALTER TABLE "tournament_course_mappings" ADD COLUMN "confidenceReason" TEXT;

-- Add autoVerified column (tracks if auto-verified via confidence algorithm)
ALTER TABLE "tournament_course_mappings" ADD COLUMN "autoVerified" BOOLEAN NOT NULL DEFAULT false;

-- Create index on autoVerified for efficient filtering
CREATE INDEX "tournament_course_mappings_autoVerified_idx" ON "tournament_course_mappings"("autoVerified");

-- Create index on matchConfidence for sorting/filtering
CREATE INDEX "tournament_course_mappings_matchConfidence_idx" ON "tournament_course_mappings"("matchConfidence");
