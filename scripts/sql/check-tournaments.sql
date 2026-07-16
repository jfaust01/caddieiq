-- Tournaments Diagnostic
-- Inspect tournaments, scheduling, and venue linkage

SELECT '=== TOURNAMENTS DIAGNOSTIC ===' as diagnostic;
SELECT '';

-- Tournaments overview
SELECT '=== TOURNAMENTS OVERVIEW ===' as section;
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'CANCELED' THEN 1 END) as canceled,
  COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END) as deleted
FROM tournaments;

-- Upcoming tournaments
SELECT '';
SELECT '=== UPCOMING TOURNAMENTS (NEXT 30 DAYS) ===' as section;
SELECT 
  id,
  name,
  status,
  format,
  "startDate",
  "endDate",
  "courseId"
FROM tournaments
WHERE "startDate" >= CURRENT_DATE 
  AND "startDate" <= CURRENT_DATE + INTERVAL '30 days'
  AND "deletedAt" IS NULL
ORDER BY "startDate";

-- Tournament venue linkage
SELECT '';
SELECT '=== TOURNAMENT VENUE LINKAGE ===' as section;
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(CASE WHEN "courseId" IS NOT NULL THEN 1 END) as with_course_linked,
  COUNT(CASE WHEN "courseId" IS NULL THEN 1 END) as without_course_linked
FROM tournaments
WHERE "deletedAt" IS NULL;

-- Tournaments without courses
SELECT '';
SELECT '=== TOURNAMENTS WITHOUT COURSE LINK ===' as section;
SELECT 
  id,
  name,
  status,
  "startDate",
  "createdAt"
FROM tournaments
WHERE "courseId" IS NULL AND "deletedAt" IS NULL
ORDER BY "startDate";

-- Tournaments with course details
SELECT '';
SELECT '=== TOURNAMENTS WITH VENUE DETAILS ===' as section;
SELECT 
  t.id,
  t.name as tournament_name,
  t.status,
  t.format,
  t."startDate",
  t."endDate",
  c.id as course_id,
  c.name as course_name,
  c.city,
  c."stateProvince",
  c.country,
  c.latitude,
  c.longitude
FROM tournaments t
LEFT JOIN courses c ON t."courseId" = c.id
WHERE t."deletedAt" IS NULL
ORDER BY t."startDate"
LIMIT 50;

-- Tournament format distribution
SELECT '';
SELECT '=== TOURNAMENT FORMAT DISTRIBUTION ===' as section;
SELECT 
  format,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM tournaments WHERE "deletedAt" IS NULL), 1) as percent
FROM tournaments
WHERE "deletedAt" IS NULL
GROUP BY format
ORDER BY count DESC;

-- Tournament status distribution
SELECT '';
SELECT '=== TOURNAMENT STATUS DISTRIBUTION ===' as section;
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM tournaments WHERE "deletedAt" IS NULL), 1) as percent
FROM tournaments
WHERE "deletedAt" IS NULL
GROUP BY status
ORDER BY status;

-- Recent tournaments (last 20)
SELECT '';
SELECT '=== RECENT TOURNAMENTS (LAST 20) ===' as section;
SELECT 
  id,
  name,
  status,
  format,
  "startDate",
  "endDate",
  "createdAt"
FROM tournaments
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;

-- Tournaments with weather data
SELECT '';
SELECT '=== TOURNAMENTS WITH WEATHER DATA ===' as section;
SELECT 
  COUNT(DISTINCT t.id) as total_tournaments,
  COUNT(DISTINCT CASE WHEN ws.id IS NOT NULL THEN t.id END) as with_weather,
  COUNT(DISTINCT CASE WHEN ws.id IS NULL THEN t.id END) as without_weather
FROM tournaments t
LEFT JOIN "weatherSnapshots" ws ON t.id = ws."tournamentId"
WHERE t."deletedAt" IS NULL;

-- Season timeline
SELECT '';
SELECT '=== SEASON TIMELINE ===' as section;
SELECT 
  EXTRACT(YEAR FROM "startDate")::int as year,
  COUNT(*) as tournaments,
  MIN("startDate") as season_start,
  MAX("endDate") as season_end
FROM tournaments
WHERE "deletedAt" IS NULL
GROUP BY EXTRACT(YEAR FROM "startDate")
ORDER BY year DESC;
