-- Add provenance tracking to HoleScore
-- Requires every hole score to have a verified source

ALTER TABLE hole_scores
ADD COLUMN source TEXT NOT NULL DEFAULT 'sportsdataio',
ADD COLUMN "externalId" TEXT,
ADD COLUMN "importedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Create index for source tracking and audit
CREATE INDEX idx_hole_scores_source ON hole_scores(source);

-- Create unique constraint for idempotent imports
ALTER TABLE hole_scores
ADD CONSTRAINT unique_hole_score_import UNIQUE ("playerRoundId", "holeNumber", "externalId");
