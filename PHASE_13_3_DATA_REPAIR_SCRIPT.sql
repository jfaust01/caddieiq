-- Phase 13.3 Step 4: Repair Existing Invalid Mappings
-- 
-- Current State: 41 invalid mappings with:
-- - golfCourseApiCourseId = 0 (should be NULL or valid > 0)
-- - matchConfidence = 0 (should be > 0 or NULL)
-- - verified = true (contradicts PENDING_REVIEW status)
-- - verificationStatus = PENDING_REVIEW (contradicts verified=true)
--
-- Action: Archive invalid mappings by resetting to unverified state
-- This allows the mapping workflow to re-process these tournaments

-- Step 1: Audit - See current state before changes
SELECT 
  'BEFORE' as phase,
  COUNT(*) as total,
  COUNT(CASE WHEN verified = true THEN 1 END) as verified,
  COUNT(CASE WHEN "verificationStatus" = 'PENDING_REVIEW' THEN 1 END) as pending_review,
  COUNT(CASE WHEN "golfCourseApiCourseId" <= 0 THEN 1 END) as invalid_ids,
  ROUND(AVG("matchConfidence")::numeric, 2) as avg_confidence
FROM tournament_course_mappings;

-- Step 2: Archive invalid mappings - Reset to unverified state
-- This allows them to be re-matched through the workflow
UPDATE tournament_course_mappings
SET
  verified = false,
  "verificationStatus" = 'PENDING_REVIEW',
  "updatedAt" = NOW()
WHERE
  -- Only target mappings that are invalid
  ("golfCourseApiCourseId" IS NULL OR "golfCourseApiCourseId" <= 0)
  AND "matchConfidence" <= 0;

-- Step 3: Audit - See state after reset
SELECT 
  'AFTER' as phase,
  COUNT(*) as total,
  COUNT(CASE WHEN verified = true THEN 1 END) as verified,
  COUNT(CASE WHEN verified = false THEN 1 END) as unverified,
  COUNT(CASE WHEN "verificationStatus" = 'PENDING_REVIEW' THEN 1 END) as pending_review,
  COUNT(CASE WHEN "golfCourseApiCourseId" <= 0 THEN 1 END) as invalid_ids,
  ROUND(AVG("matchConfidence")::numeric, 2) as avg_confidence
FROM tournament_course_mappings;

-- Step 4: Summary log
SELECT 
  COUNT(*) as tournaments_to_remap,
  'Ready for workflow re-processing' as status,
  'Run tournament matching orchestration' as next_action
FROM tournament_course_mappings
WHERE verified = false AND "verificationStatus" = 'PENDING_REVIEW';
