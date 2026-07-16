-- Courses Diagnostic
-- Inspect courses, characteristics, and venue data quality

SELECT '=== COURSES DIAGNOSTIC ===' as diagnostic;
SELECT '';

-- Courses overview
SELECT '=== COURSES OVERVIEW ===' as section;
SELECT 
  COUNT(*) as total_courses,
  COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active_courses,
  COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END) as deleted_courses,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as courses_with_coordinates,
  COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as courses_without_coordinates
FROM courses;

-- Course characteristics coverage
SELECT '';
SELECT '=== COURSE CHARACTERISTICS COVERAGE ===' as section;
SELECT 
  COUNT(c.id) as total_courses,
  COUNT(cc.id) as courses_with_characteristics,
  ROUND(100.0 * COUNT(cc.id) / COUNT(c.id), 1) as coverage_percent,
  COUNT(CASE WHEN cc."coordinateConfidence" = 'EXACT' THEN 1 END) as exact_coordinates,
  COUNT(CASE WHEN cc."coordinateConfidence" = 'APPROXIMATE' THEN 1 END) as approximate_coordinates
FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL;

-- Courses with missing data
SELECT '';
SELECT '=== COURSES WITH MISSING DATA ===' as section;
SELECT 
  'No coordinates' as missing_data_type,
  COUNT(*) as count
FROM courses
WHERE (latitude IS NULL OR longitude IS NULL) AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'No characteristics',
  COUNT(*)
FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE cc.id IS NULL AND c."deletedAt" IS NULL
UNION ALL
SELECT 
  'No city/state/country',
  COUNT(*)
FROM courses
WHERE (city IS NULL OR "stateProvince" IS NULL OR country IS NULL) AND "deletedAt" IS NULL;

-- Recent courses (last 20)
SELECT '';
SELECT '=== RECENT COURSES (LAST 20) ===' as section;
SELECT 
  id,
  name,
  city,
  "stateProvince",
  country,
  latitude,
  longitude,
  "createdAt"
FROM courses
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;

-- Course characteristics details
SELECT '';
SELECT '=== COURSE CHARACTERISTICS DETAILS ===' as section;
SELECT 
  c.id,
  c.name as course_name,
  c.city,
  cc."coordinateConfidence",
  cc."shotImportanceWeights",
  cc."createdAt",
  cc."updatedAt"
FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL
ORDER BY c.name
LIMIT 50;

-- Coordinates distribution by country/state
SELECT '';
SELECT '=== COORDINATES DISTRIBUTION ===' as section;
SELECT 
  country,
  "stateProvince",
  COUNT(*) as total_courses,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_coordinates,
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) / COUNT(*), 1) as coordinates_percent
FROM courses
WHERE "deletedAt" IS NULL
GROUP BY country, "stateProvince"
ORDER BY country, "stateProvince";

-- Data freshness for courses
SELECT '';
SELECT '=== COURSE DATA FRESHNESS ===' as section;
SELECT 
  'Total courses' as metric,
  COUNT(*) as count,
  MAX("updatedAt") as last_updated
FROM courses
WHERE "deletedAt" IS NULL
UNION ALL
SELECT 
  'Courses updated today',
  COUNT(*),
  MAX("updatedAt")
FROM courses
WHERE "updatedAt"::date = CURRENT_DATE AND "deletedAt" IS NULL
UNION ALL
SELECT 
  'Courses updated this week',
  COUNT(*),
  MAX("updatedAt")
FROM courses
WHERE "updatedAt" > NOW() - INTERVAL '7 days' AND "deletedAt" IS NULL;
