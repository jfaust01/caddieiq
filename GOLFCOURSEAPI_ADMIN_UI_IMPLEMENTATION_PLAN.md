# GolfCourseAPI Admin UI Implementation Plan

## Overview
This document outlines the implementation plan for adding admin UI pages to browse, filter, sort, and inspect GolfCourseAPI-imported data. Implementation occurs after data audit is complete and before golfer ratings work begins.

## Current Status
- Schema: ✓ Implemented (CourseDetails, CourseHole, CourseTee, TournamentCourseMapping)
- Data Import: ✓ Working (importCourseIntelligence populates all tables)
- Database Health Queries: ✗ Not added (only counts in log output)
- Admin UI Pages: ✗ Not created

## Database Health Integration

### 1. Add Course Metrics to getDatabaseHealthReport()
**File:** `/lib/system-health/database-health.ts`

**Add these queries:**
```typescript
// CourseDetails table
const courseDetails = await prisma.courseDetails.count()
tables.push({
  tableName: "course_details",
  rowCount: courseDetails,
  status: courseDetails > 0 ? "Healthy" : "Waiting",
  purpose: "GolfCourseAPI course details (address, specifications, metadata)",
  expected: true,
  lastUpdatedAt: new Date().toISOString(),
  healthScore: courseDetails > 0 ? 100 : 50,
})
totalRows += courseDetails

// CourseHole table
const courseHoles = await prisma.courseHole.count()
tables.push({
  tableName: "course_holes",
  rowCount: courseHoles,
  status: courseHoles > courseDetails * 17 ? "Healthy" : "Waiting", // Most courses have 18
  purpose: "Individual golf holes (1-18 per course)",
  expected: true,
  lastUpdatedAt: new Date().toISOString(),
  healthScore: courseHoles > courseDetails * 17 ? 100 : 60,
})
totalRows += courseHoles

// CourseTee table
const courseTees = await prisma.courseTee.count()
tables.push({
  tableName: "course_tees",
  rowCount: courseTees,
  status: courseTees > courseDetails ? "Healthy" : "Waiting", // At least 1 per course
  purpose: "Tee boxes per course (Blue, White, Red, etc.)",
  expected: true,
  lastUpdatedAt: new Date().toISOString(),
  healthScore: courseTees > courseDetails ? 100 : 60,
})
totalRows += courseTees

// TournamentCourseMapping table
const mappings = await prisma.tournamentCourseMapping.count()
const verifiedMappings = await prisma.tournamentCourseMapping.count({
  where: { verified: true }
})
tables.push({
  tableName: "tournament_course_mappings",
  rowCount: mappings,
  status: mappings > 0 ? "Healthy" : "Import Pending",
  purpose: "Tournament → GolfCourseAPI course mappings",
  expected: true,
  lastUpdatedAt: new Date().toISOString(),
  healthScore: verifiedMappings > mappings * 0.8 ? 100 : 70,
  explanation: `${verifiedMappings}/${mappings} verified`
})
totalRows += mappings
```

### 2. Add Course KPI Cards
**File:** `features/admin/database-health/kpi-cards.tsx`

Add toggles to show course-specific metrics:
- Total Courses: courseDetails count
- Total Holes: courseHoles count
- Average Holes per Course: courseHoles / courseDetails
- Total Tees: courseTees count
- Avg Tees per Course: courseTees / courseDetails
- Verified Mappings: verified count / total count percentage

## Admin UI Pages

### 1. Course Details Browser
**Route:** `/admin/courses`
**File:** `app/(app)/admin/courses/page.tsx`
**Component:** `features/admin/courses/course-details-browser.tsx`

**Features:**
- Server-side paginated table (25 items per page)
- Columns: name, city, state, par, yardage, architect, yearBuilt
- Filters:
  - Country/State dropdown
  - Par range slider (60-80)
  - Yardage range slider
  - YearBuilt range slider
- Sort: name, par, yardage, yearBuilt
- Detail view: All fields + link to holes + link to tees

**Implementation Pattern:**
```typescript
// Create data fetching function
async function getCourseDetails(params: {
  search?: string
  country?: string
  state?: string
  parMin?: number
  parMax?: number
  page?: number
  limit?: number
  sortBy?: string
}) {
  return prisma.courseDetails.findMany({
    where: {
      courseName: params.search ? { contains: params.search, mode: 'insensitive' } : undefined,
      country: params.country,
      state: params.state,
      par: params.parMin || params.parMax ? {
        gte: params.parMin,
        lte: params.parMax,
      } : undefined,
    },
    orderBy: { [params.sortBy || 'courseName']: 'asc' },
    skip: (params.page || 0) * (params.limit || 25),
    take: params.limit || 25,
    include: {
      holes: true,
      tees: true,
    }
  })
}
```

### 2. Course Holes Browser
**Route:** `/admin/courses/holes`
**File:** `app/(app)/admin/courses/holes/page.tsx`
**Component:** `features/admin/courses/course-holes-browser.tsx`

**Features:**
- Server-side paginated table
- Columns: courseName, holeNumber, par, yardage, handicap
- Filters:
  - Course name search/autocomplete
  - Hole number (1-18)
  - Par value
  - Yardage range
- Sort: courseName, holeNumber, par, yardage
- Detail view: Hole data + parent course link + tee variants (if available)

### 3. Course Tees Browser
**Route:** `/admin/courses/tees`
**File:** `app/(app)/admin/courses/tees/page.tsx`
**Component:** `features/admin/courses/course-tees-browser.tsx`

**Features:**
- Server-side paginated table
- Columns: courseName, teeName, teeColor, gender, yardage, rating, slope
- Filters:
  - Course name search
  - Tee name (Blue, White, Red, etc.)
  - Tee color
  - Gender
  - Rating range (65-77)
  - Slope range (110-150)
- Sort: courseName, yardage, rating, slope
- Detail view: Tee data + parent course link + holes for this course

### 4. Tournament Course Mapping Browser
**Route:** `/admin/courses/mappings`
**File:** `app/(app)/admin/courses/mappings/page.tsx`
**Component:** `features/admin/courses/tournament-mapping-browser.tsx`

**Features:**
- Server-side paginated table
- Columns: tournamentName, courseName, matchConfidence%, verified, matchedBy, lastSyncedAt
- Filters:
  - Tournament name search
  - Course name search
  - Verified toggle
  - MatchedBy dropdown (manual, auto-matched, search)
  - Confidence range slider (0-100)
- Sort: tournamentName, matchConfidence, lastSyncedAt, createdAt
- Detail view: Mapping metadata + links to tournament + course + option to mark verified

### 5. Data Quality Report
**Route:** `/admin/courses/quality`
**File:** `app/(app)/admin/courses/quality/page.tsx`
**Component:** `features/admin/courses/course-quality-report.tsx`

**Displays:**
```
Total courses: COUNT
- With par: COUNT (%) [Show missing]
- With yardage: COUNT (%) [Show missing]
- With 18 holes: COUNT (%) [Show incomplete]
- With rating/slope: COUNT (%) [Show missing]

Total course mappings: COUNT
- Verified: COUNT (%)
- Auto-matched: COUNT
- Manual: COUNT
- Confidence avg: X.X%

Data freshness:
- Last course import: TIMESTAMP
- Oldest course data: TIMESTAMP
- Course data age avg: X days

Issues:
[List courses with problems, clickable to detail]
```

## Implementation Sequence

### Phase 1: Database Health (2-4 hours)
1. Update `getDatabaseHealthReport()` with course table queries
2. Add course KPI cards to dashboard
3. Add data quality checks/warnings
4. Test: Verify counts appear correctly

### Phase 2: Course Details Browser (3-4 hours)
1. Create data fetching functions in `/lib/repositories/course-repository.ts`
2. Create server page at `/admin/courses`
3. Build filtering/sorting logic
4. Build table component with pagination
5. Build detail view modal
6. Test: Filter, sort, navigate to detail

### Phase 3: Course Holes Browser (2-3 hours)
1. Create data fetching for holes with course info
2. Create server page at `/admin/courses/holes`
3. Build filtering/sorting
4. Build table + detail view
5. Link to parent course

### Phase 4: Course Tees Browser (2-3 hours)
1. Create data fetching for tees with course info
2. Create server page at `/admin/courses/tees`
3. Build filtering/sorting
4. Build table + detail view
5. Link to parent course

### Phase 5: Mapping Browser (2-3 hours)
1. Create data fetching for mappings with related entities
2. Create server page at `/admin/courses/mappings`
3. Build filtering/sorting
4. Build table + detail view
5. Add verification toggle

### Phase 6: Quality Report (2-3 hours)
1. Create comprehensive data quality queries
2. Create dashboard view
3. Add clickable issue links
4. Add export functionality (optional)

### Phase 7: Validation & Testing (2-4 hours)
1. Import sample course data via UI
2. Validate all browsers work correctly
3. Test filters and sorting
4. Verify data correctness
5. Document any anomalies

**Estimated Total:** 16-28 hours of development

## Before Proceeding to Golfer Ratings

Validation checklist:
- [ ] All courses have complete CourseDetails (no critical NULL values)
- [ ] All courses have 18 holes (or explanation for variants)
- [ ] All courses have at least 1 tee with rating/slope
- [ ] All tournament courses have verified mappings
- [ ] Data quality report shows <5% issues
- [ ] Admins can browse and navigate all tables
- [ ] Sample data inspection passes visual review

## Design Notes

### UI Patterns
- Use existing shadcn components (DataTable, Dialog, Sheet, etc.)
- Follow Database Health design language
- Server components for data fetching, client components for interactivity
- Pagination at bottom of tables (Server Action based)

### Performance
- Implement cursor-based or offset pagination (25-50 items/page)
- Add indexes to common filter columns
- Lazy-load detail views (use Sheet/Dialog to minimize main page load)
- Cache count queries if updated less frequently than displayed

### Accessibility
- Proper table headers with sort indicators
- Filter controls with clear labels
- Detail views accessible via keyboard
- Skip links for navigation

## Next Steps
1. Start Phase 1 (Database Health)
2. Incrementally add phases
3. Validate each phase before moving to next
4. Once all phases complete, mark "Ready for Golfer Ratings"
