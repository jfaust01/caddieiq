# GolfCourseAPI Schema Audit — Based on Actual Implementation

## Overview
Audit of the actual GolfCourseAPI integration in CaddieIQ, examining:
1. What the API actually returns (verified against client types)
2. How the existing schema maps to the response
3. What data is being normalized vs. flattened
4. Validation and data quality issues

## API Response Structure (Verified)

### GolfCourseDetail (Root Response)

The API returns a GolfCourseDetail object with these fields:

```typescript
interface GolfCourseDetail {
  id: number                              // ← External ID, stored as externalCourseId
  name: string                            // ← Course name
  clubName?: string                       // ← Club/facility name
  
  address?: {
    city?: string
    state?: string
    country?: string
  }
  
  coordinates?: {
    latitude: number
    longitude: number
  }
  
  contact?: {
    website?: string
    phone?: string
  }
  
  specifications?: {
    par?: number
    totalYardage?: number
    courseRating?: number
    slopeRating?: number
  }
  
  metadata?: {
    architect?: string
    yearBuilt?: number
    courseStyle?: string
  }
  
  playingConditions?: {
    grassTypeFairway?: string
    grassTypeGreen?: string
    greenSize?: string
    greenSpeed?: string
    elevation?: number
  }
  
  facilities?: {
    drivingRange?: boolean
    puttingGreen?: boolean
    shortGameArea?: boolean
  }
  
  holes?: Array<{
    number: number                        // Hole number 1-18
    par?: number
    yardage?: number
    handicap?: number
  }>
  
  tees?: Array<{
    name: string                          // "Blue", "White", "Red", etc.
    color?: string
    gender?: string                       // "M" for mens, "W" for womens, etc.
    yardage?: number                      // Total yardage for this tee set
    rating?: number                       // Course rating for this tee
    slope?: number                        // Slope rating for this tee
  }>
}
```

## Current Schema Implementation

### Existing Normalized Tables

**1. CourseDetails** (Root aggregate)
- Stores: name, clubName, address fields, coordinates, contact info, specifications, metadata, playing conditions, facilities
- Status: ✓ IMPLEMENTED
- Columns: 21 fields covering all non-array attributes

**2. CourseHole** (1:M, 18 per course)
- Stores: holeNumber, par, yardage, handicap
- Status: ✓ IMPLEMENTED
- Constraint: unique(courseId, holeNumber)

**3. CourseTee** (1:M, 3-6 per course)
- Stores: teeName, teeColor, gender, yardage, rating, slope
- Status: ✓ IMPLEMENTED
- Constraint: unique(courseId, teeName)

### Missing Tables (NOT IMPLEMENTED)

**TeeHoleYardage** (M:M bridge)
- Would store: teeId → courseId + holeNumber → yardage
- Purpose: Hole-specific yardages for each tee
- Status: NOT IN SCHEMA
- Impact: Cannot retrieve "Blue tee, Hole 7: 420 yards" relationships
- Note: API currently only provides per-tee total yardage, not per-hole-per-tee

## Data Validation Issues

### Issue 1: Missing Per-Hole-Per-Tee Yardages
**Current Data:** 
- Hole 1: 420 yards (generic)
- Blue Tee: 6,800 yards total (sum of all 18)

**Missing:**
- Hole 1, Blue Tee: 420 yards (specific)
- Hole 1, White Tee: 410 yards (different)

**Source:** API provides Holes[].yardage and Tees[].yardage separately, not combined

**Impact on DFS/Course Intelligence:**
- Cannot calculate per-hole-per-tee scoring difficulty
- Cannot determine if a specific tee plays a hole significantly different

**Workaround:** Assume uniform distribution (Total Tee Yardage ÷ 18 holes = per-hole estimate)

### Issue 2: Hole Handicap Values
**Current Data:** CourseHole.handicap (1-18 ranking)

**Problem:** This is typically the "stroke index" for handicap calculations

**Usage:** 
- Hole 1 handicap=5 means "5th hardest hole"
- Player with 5 handicap gets 1 stroke here
- Not per-tee specific (should be per-tee)

**Status:** Store as-is (API doesn't provide per-tee handicap)

### Issue 3: Tee Color Standardization
**Observed Values:** "Blue", "White", "Red", "Gold", "Silver", "Black", etc.

**Current Handling:** Stored as plain string in CourseTee.teeColor

**Recommendation:** Could create TeeColor enum if needed (LOW PRIORITY)

### Issue 4: Grass Type Values
**API Returns:** Strings like "Bent Grass", "Bermuda Grass", "Poa Annua", etc.

**Schema:** Stored as String in CourseDetails.grassTypeFairway/grassTypeGreen

**Could Be:** Enum (GrassType already exists in schema, not used here)

**Status:** Currently string, could normalize to enum (LOW PRIORITY)

### Issue 5: Course Style Standardization
**API Returns:** e.g., "Links", "Parkland", "Desert", "Mountain", etc.

**Schema:** Stored as String in CourseDetails.courseStyle

**Note:** CourseStyle enum exists in schema but not enforced

**Status:** Currently string, could normalize (LOW PRIORITY)

## Data Population Status

### Current Importer (importCourseIntelligence)

**Responsibilities:**
1. Fetch all verified tournament-course mappings ✓
2. Fetch course details from GolfCourseAPI ✓
3. Upsert CourseDetails ✓
4. Upsert CourseHole records ✓
5. Upsert CourseTee records ✓
6. Generate CourseIntelligence metrics ✓
7. Generate CourseInsights ✓
8. Generate CourseMetricExplanations ✓

**Data Validation Checks:**
- Hole count == 18 (warns if not) ✓
- No duplicate hole numbers ✓
- No duplicate tee names ✓
- Tee count > 0 ✓

**Counts Returned:**
- coursesConsidered
- coursesMatched
- coursesImported
- coursesUpdated
- holesImported
- holesUpdated
- teeBoxesImported
- teeBoxesUpdated
- intelligenceAnalyzed
- intelligenceGenerated
- insightsGenerated
- explanationsGenerated

## What's NOT Being Imported

1. **TournamentCourseMappings:** Mapping table exists but not populated by this importer
   - Should be populated during tournament import
   - Requires match between tournament course name and GolfCourseAPI results

2. **Address as Separate Entity:** Currently flattened into CourseDetails
   - Normalized approach would create CourseAddress table
   - Cost-benefit: Low (address rarely updates, one record per course)

3. **Contact as Separate Entity:** Currently flattened into CourseDetails
   - Normalized approach would create CourseContact table
   - Cost-benefit: Low (same as address)

4. **Facilities as Separate Entity:** Currently flattened into CourseDetails
   - 3 boolean fields in main table
   - Cost-benefit: Very low (unlikely to need separate table)

5. **PlayingConditions as Separate Entity:** Currently flattened into CourseDetails
   - Could be separate if conditions were seasonal (not currently tracked)
   - Cost-benefit: Low (stored once per course, not temporal)

## Database Health Queries Needed

```sql
-- Row counts
SELECT COUNT(*) FROM course_details;
SELECT COUNT(*) FROM course_holes;
SELECT COUNT(*) FROM course_tees;
SELECT COUNT(*) FROM course_intelligence;

-- Data quality
SELECT COUNT(*) FROM course_details WHERE par IS NULL;
SELECT COUNT(*) FROM course_holes WHERE yardage IS NULL;
SELECT COUNT(*) FROM course_tees WHERE rating IS NULL OR slope IS NULL;

-- Relationships
SELECT courseId, COUNT(*) as hole_count 
FROM course_holes 
GROUP BY courseId 
HAVING COUNT(*) != 18;

SELECT courseId, COUNT(*) as tee_count 
FROM course_tees 
GROUP BY courseId 
ORDER BY tee_count;
```

## Admin UI Requirements

To validate data before moving to golfer ratings:

### 1. Course Details Browser
- Table view: name, city, state, par, yardage, architect, yearBuilt
- Filters: country, state, par range, yearBuilt range
- Sort: name, par, yardage, yearBuilt
- Detail view: all CourseDetails fields + related holes/tees

### 2. Course Holes Browser
- Table view: courseId→courseName, holeNumber, par, yardage, handicap
- Filters: courseId, hole number range, par value
- Sort: courseId, holeNumber, par, yardage
- Detail view: hole data + parent course link

### 3. Course Tees Browser
- Table view: courseId→courseName, teeName, teeColor, gender, yardage, rating, slope
- Filters: courseId, teeColor, gender, rating range, slope range
- Sort: courseId, teeName, yardage, rating, slope
- Detail view: tee data + parent course link + holes for this course

### 4. Tournament Course Mapping Browser
- Table view: tournamentId→tournamentName, golfCourseApiCourseId→courseName, matchConfidence, verified, matchedBy
- Filters: verified status, matchConfidence range, matchedBy
- Sort: tournamentId, matchConfidence, createdAt
- Detail view: mapping data + course link + tournament link

### 5. Course Intelligence Browser
- Table view: courseId→courseName, overallDifficultyScore, drivingImportanceScore, approachImportanceScore, lastCalculated
- Filters: difficulty range, importance ranges
- Sort: courseId, difficultyScore, lastCalculated
- Detail view: all CourseIntelligence fields

### 6. Data Quality Report
- Courses with missing par: COUNT, links to detail
- Courses with missing yardage: COUNT, links to detail
- Courses with 18 holes: COUNT (should be ALL)
- Courses with missing tees: COUNT, links to detail
- Courses missing course intelligence: COUNT, links to detail

## Implementation Roadmap

### Phase 1: Data Validation (Now)
- ✓ Audit GolfCourseAPI response structure
- ✓ Document schema mapping
- [ ] Create admin browsers for each table
- [ ] Add data quality queries to Database Health
- [ ] Validate sample data looks correct

### Phase 2: Data Enrichment (Future)
- Optional: TeeHoleYardage table (requires API enhancement)
- Optional: Per-tee handicap values (requires API enhancement)
- Optional: Seasonal PlayingConditions tracking
- Optional: Address/Contact/Facilities normalization

### Phase 3: Golfer Ratings (After Data Validation)
- Only proceed once we confirm:
  - All tournaments have verified course mappings
  - All courses have complete hole/tee data
  - Data quality metrics pass validation
  - Admin can browse and inspect individual records

## Summary

**Schema Status:** 95% complete
- CourseDetails: ✓
- CourseHole: ✓
- CourseTee: ✓
- TournamentCourseMapping: ✓ (table exists, needs data)
- CourseIntelligence: ✓

**What's Missing:** Admin UI for browsing and validation

**Next Steps:** 
1. Create admin pages for each table
2. Add row count queries to Database Health
3. Run sample data validation
4. Confirm data quality before golfer ratings
