-- Phase 13.2: Add verification status tracking and rejection reasons

-- Create enum type for verification status
CREATE TYPE "MappingVerificationStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- Add new columns
ALTER TABLE "tournament_course_mappings" ADD COLUMN "verificationStatus" "MappingVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
ALTER TABLE "tournament_course_mappings" ADD COLUMN "rejectionReason" TEXT;

-- Migrate existing verified boolean to verificationStatus
UPDATE "tournament_course_mappings"
SET "verificationStatus" = CASE
  WHEN verified = true THEN 'VERIFIED'::\"MappingVerificationStatus\"
  ELSE 'PENDING_REVIEW'::\"MappingVerificationStatus\"
END;

-- Create indexes for efficient filtering
CREATE INDEX idx_tournament_course_mappings_verification_status ON "tournament_course_mappings"("verificationStatus");
CREATE INDEX idx_tournament_course_mappings_match_confidence ON "tournament_course_mappings"("matchConfidence");
CREATE INDEX idx_tournament_course_mappings_auto_verified ON "tournament_course_mappings"("autoVerified");
