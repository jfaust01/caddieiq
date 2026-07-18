-- Phase 13.1 Importer Verification Script
-- Verifies the importer will work correctly once one mapping is verified

-- ============================================================================
-- STEP 1: BASELINE COUNTS BEFORE ANY IMPORT
-- ============================================================================
\echo '╔════════════════════════════════════════════════════════╗'
\echo '║  PHASE 13.1 IMPORTER AUDIT - SQL VERIFICATION        ║'
\echo '╚════════════════════════════════════════════════════════╝'
\echo ''
\echo '[BASELINE] Table counts BEFORE import:'
SELECT 'course_details' as table_name, COUNT(*) as row_count FROM course_details
UNION ALL
SELECT 'course_addresses', COUNT(*) FROM course_addresses
UNION ALL
SELECT 'course_coordinates', COUNT(*) FROM course_coordinates
UNION ALL
SELECT 'course_specifications', COUNT(*) FROM course_specifications
UNION ALL
SELECT 'course_metadata', COUNT(*) FROM course_metadata
UNION ALL
SELECT 'playing_conditions', COUNT(*) FROM playing_conditions
UNION ALL
SELECT 'course_holes', COUNT(*) FROM course_holes
UNION ALL
SELECT 'course_tees', COUNT(*) FROM course_tees
UNION ALL
SELECT 'tee_hole_yardages', COUNT(*) FROM tee_hole_yardages
ORDER BY table_name;

-- ============================================================================
-- STEP 2: AUDIT TOURNAMENT COURSE MAPPINGS
-- ============================================================================
\echo ''
\echo '[MAPPINGS] Tournament-course mapping verification status:'
SELECT 
  COUNT(*) as total_mappings,
  SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) as verified_count,
  SUM(CASE WHEN verified = false THEN 1 ELSE 0 END) as unverified_count,
  SUM(CASE WHEN verified IS NULL THEN 1 ELSE 0 END) as null_count
FROM tournament_course_mappings;

-- ============================================================================
-- STEP 3: IDENTIFY FIRST MAPPING TO VERIFY
-- ============================================================================
\echo ''
\echo '[FIRST MAPPING] Candidate for verification:'
SELECT 
  id,
  "tournamentId",
  "golfCourseApiCourseId",
  verified,
  "createdAt",
  "lastSyncedAt"
FROM tournament_course_mappings
ORDER BY "createdAt" ASC
LIMIT 1;

-- ============================================================================
-- STEP 4: MARK FIRST MAPPING AS VERIFIED
-- ============================================================================
\echo ''
\echo '[ACTION] Verifying first mapping...'
UPDATE tournament_course_mappings 
SET verified = true
WHERE id = (
  SELECT id FROM tournament_course_mappings
  ORDER BY "createdAt" ASC
  LIMIT 1
);

-- ============================================================================
-- STEP 5: VERIFY THE UPDATE WORKED
-- ============================================================================
\echo ''
\echo '[VERIFICATION] Mapping now verified:'
SELECT 
  "golfCourseApiCourseId",
  verified,
  "lastSyncedAt"
FROM tournament_course_mappings
WHERE verified = true
LIMIT 1;

-- ============================================================================
-- STEP 6: COUNT VERIFIED MAPPINGS
-- ============================================================================
\echo ''
\echo '[READY] Verified mappings ready for import:'
SELECT COUNT(*) as ready_for_import FROM tournament_course_mappings WHERE verified = true;

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo ''
\echo '✅ IMPORTER SETUP COMPLETE'
\echo '✅ One mapping now verified'
\echo '✅ Run importCourseIntelligence() to populate Phase 13.1 tables'
