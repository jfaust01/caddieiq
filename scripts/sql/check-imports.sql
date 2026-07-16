-- Import Pipeline Diagnostic
-- Inspect all import run statuses and outcomes

SELECT '=== IMPORT PIPELINE DIAGNOSTIC ===' as diagnostic;
SELECT '';

-- Import run summary
SELECT '=== IMPORT RUN SUMMARY ===' as section;
SELECT 
  entity,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as partial,
  COUNT(CASE WHEN status = 'FAILURE' THEN 1 END) as failed,
  ROUND(AVG("recordsInserted")::numeric, 0) as avg_inserted,
  ROUND(AVG("recordsUpdated")::numeric, 0) as avg_updated,
  ROUND(AVG("recordsFailed")::numeric, 0) as avg_failed
FROM "importRuns"
GROUP BY entity
ORDER BY entity;

-- Latest import per entity
SELECT '';
SELECT '=== LATEST IMPORT PER ENTITY ===' as section;
SELECT DISTINCT ON (entity)
  entity,
  status,
  "recordsProcessed",
  "recordsInserted",
  "recordsUpdated",
  "recordsFailed",
  ("recordsInserted" + "recordsUpdated") as total_persisted,
  CASE 
    WHEN "recordsProcessed" > 0 
    THEN ROUND(100.0 * ("recordsInserted" + "recordsUpdated") / "recordsProcessed", 1)
    ELSE 0 
  END as success_percent,
  "startedAt",
  "completedAt",
  (("completedAt" - "startedAt")::text) as duration
FROM "importRuns"
ORDER BY entity, "completedAt" DESC;

-- Import success rate by entity
SELECT '';
SELECT '=== IMPORT SUCCESS RATE ===' as section;
SELECT 
  entity,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful_runs,
  ROUND(100.0 * COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) / COUNT(*), 1) as success_percent,
  COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as partial_runs,
  COUNT(CASE WHEN status = 'FAILURE' THEN 1 END) as failed_runs
FROM "importRuns"
GROUP BY entity
ORDER BY success_percent DESC;

-- Records processed by entity
SELECT '';
SELECT '=== RECORDS PROCESSED BY ENTITY ===' as section;
SELECT 
  entity,
  SUM("recordsProcessed") as total_processed,
  SUM("recordsInserted") as total_inserted,
  SUM("recordsUpdated") as total_updated,
  SUM("recordsFailed") as total_failed,
  ROUND(100.0 * SUM("recordsFailed") / SUM("recordsProcessed"), 1) as failure_percent
FROM "importRuns"
GROUP BY entity
ORDER BY total_processed DESC;

-- Last 20 import runs
SELECT '';
SELECT '=== LAST 20 IMPORT RUNS ===' as section;
SELECT 
  entity,
  status,
  "recordsProcessed",
  "recordsInserted",
  "recordsUpdated",
  "recordsFailed",
  ("completedAt" - "startedAt")::text as duration,
  "completedAt"
FROM "importRuns"
ORDER BY "completedAt" DESC
LIMIT 20;

-- Import timings (average duration per entity)
SELECT '';
SELECT '=== IMPORT TIMING ANALYSIS ===' as section;
SELECT 
  entity,
  COUNT(*) as runs,
  ROUND(AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt")))::numeric, 2) as avg_duration_seconds,
  MIN(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))) as min_duration_seconds,
  MAX(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))) as max_duration_seconds
FROM "importRuns"
WHERE "completedAt" IS NOT NULL
GROUP BY entity
ORDER BY avg_duration_seconds DESC;

-- Failed imports
SELECT '';
SELECT '=== FAILED IMPORTS ===' as section;
SELECT 
  entity,
  status,
  "recordsProcessed",
  "recordsFailed",
  "completedAt"
FROM "importRuns"
WHERE status = 'FAILURE'
ORDER BY "completedAt" DESC;

-- Partial imports (with failures)
SELECT '';
SELECT '=== PARTIAL IMPORTS (WITH FAILURES) ===' as section;
SELECT 
  entity,
  status,
  "recordsProcessed",
  "recordsInserted",
  "recordsUpdated",
  "recordsFailed",
  ROUND(100.0 * "recordsFailed" / "recordsProcessed", 1) as failure_percent,
  "completedAt"
FROM "importRuns"
WHERE status = 'PARTIAL' AND "recordsFailed" > 0
ORDER BY "completedAt" DESC
LIMIT 20;

-- Import trends (last 30 days by entity)
SELECT '';
SELECT '=== IMPORT TRENDS (LAST 30 DAYS) ===' as section;
SELECT 
  entity,
  "completedAt"::date as date,
  COUNT(*) as runs,
  SUM("recordsInserted") as records_inserted,
  SUM("recordsUpdated") as records_updated,
  SUM("recordsFailed") as records_failed,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful_runs
FROM "importRuns"
WHERE "completedAt" > NOW() - INTERVAL '30 days'
GROUP BY entity, date
ORDER BY entity, date DESC;
