-- Players Diagnostic
-- Inspect players, statuses, and tour assignments

SELECT '=== PLAYERS DIAGNOSTIC ===' as diagnostic;
SELECT '';

-- Players overview
SELECT '=== PLAYERS OVERVIEW ===' as section;
SELECT 
  COUNT(*) as total_players,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_players,
  COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive_players,
  COUNT(CASE WHEN status = 'INJURED' THEN 1 END) as injured_players,
  COUNT(CASE WHEN status = 'RETIRED' THEN 1 END) as retired_players,
  COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END) as deleted_players
FROM players;

-- Players by handedness
SELECT '';
SELECT '=== PLAYERS BY HANDEDNESS ===' as section;
SELECT 
  handedness,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM players WHERE "deletedAt" IS NULL), 1) as percent
FROM players
WHERE "deletedAt" IS NULL
GROUP BY handedness
ORDER BY count DESC;

-- Players by tour
SELECT '';
SELECT '=== PLAYERS BY TOUR ===' as section;
SELECT 
  t.name as tour_name,
  COUNT(p.id) as player_count,
  COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END) as active_count,
  COUNT(CASE WHEN p.status = 'INACTIVE' THEN 1 END) as inactive_count
FROM tours t
LEFT JOIN players p ON t.id = p."tourId" AND p."deletedAt" IS NULL
GROUP BY t.id, t.name
ORDER BY player_count DESC;

-- Players by nationality (top 20)
SELECT '';
SELECT '=== PLAYERS BY NATIONALITY (TOP 20) ===' as section;
SELECT 
  n.name as nationality,
  COUNT(p.id) as player_count,
  ROUND(100.0 * COUNT(p.id) / (SELECT COUNT(*) FROM players WHERE "deletedAt" IS NULL), 1) as percent
FROM nationalities n
LEFT JOIN players p ON n.id = p."nationalityId" AND p."deletedAt" IS NULL
GROUP BY n.id, n.name
ORDER BY player_count DESC
LIMIT 20;

-- Recent players (last 50)
SELECT '';
SELECT '=== RECENT PLAYERS (LAST 50) ===' as section;
SELECT 
  id,
  "firstName",
  "lastName",
  status,
  handedness,
  "tourId",
  "createdAt"
FROM players
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 50;

-- Players with missing data
SELECT '';
SELECT '=== PLAYERS WITH MISSING DATA ===' as section;
SELECT 
  'Missing first name' as missing_type,
  COUNT(*) as count
FROM players
WHERE "firstName" IS NULL AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Missing last name',
  COUNT(*)
FROM players
WHERE "lastName" IS NULL AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Missing tour assignment',
  COUNT(*)
FROM players
WHERE "tourId" IS NULL AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Missing nationality',
  COUNT(*)
FROM players
WHERE "nationalityId" IS NULL AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Unknown handedness',
  COUNT(*)
FROM players
WHERE handedness = 'UNKNOWN' AND "deletedAt" IS NULL;

-- Status distribution
SELECT '';
SELECT '=== PLAYER STATUS DISTRIBUTION ===' as section;
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM players WHERE "deletedAt" IS NULL), 1) as percent
FROM players
WHERE "deletedAt" IS NULL
GROUP BY status
ORDER BY count DESC;

-- Data freshness for players
SELECT '';
SELECT '=== PLAYER DATA FRESHNESS ===' as section;
SELECT 
  'Total active players' as metric,
  COUNT(*) as count,
  MAX("updatedAt") as last_updated
FROM players
WHERE status = 'ACTIVE' AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Players updated today',
  COUNT(*),
  MAX("updatedAt")
FROM players
WHERE "updatedAt"::date = CURRENT_DATE AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Players updated this week',
  COUNT(*),
  MAX("updatedAt")
FROM players
WHERE "updatedAt" > NOW() - INTERVAL '7 days' AND "deletedAt" IS NULL;

-- Import run for players
SELECT '';
SELECT '=== PLAYER IMPORT STATUS ===' as section;
SELECT 
  entity,
  status,
  "recordsInserted",
  "recordsUpdated",
  "recordsFailed",
  "completedAt"
FROM "importRuns"
WHERE entity = 'player'
ORDER BY "completedAt" DESC
LIMIT 10;
