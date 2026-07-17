# GolfCourseAPI Data - Quick Reference

## TL;DR

**What exists in the database:**
- ✓ 3 tables with GolfCourseAPI data: `CourseDetails`, `CourseHole`, `CourseTee`
- ✓ Full course specs, facilities, playing conditions, and hole-by-hole scorecard

**What users see:**
- ❌ NONE of the above

**Best place to show it:**
- **`/courses/[courseId]` (Course Detail Page)**
  - Already has hero section + infrastructure
  - Perfect for course specs + scorecard
  - No breaking changes needed

---

## Database Tables & Fields

### CourseDetails
**Link to GolfCourseAPI:** `externalCourseId` (unique)

**Available fields:**
- Course identity: `courseName`, `clubName`
- Location: `city`, `state`, `country`, `latitude`, `longitude`
- Specs: `par`, `totalYardage`, `courseRating`, `slopeRating`, `elevation`
- Metadata: `architect`, `yearBuilt`, `courseStyle`
- Conditions: `grassTypeFairway`, `grassTypeGreen`, `greenSize`, `greenSpeed`
- Facilities: `drivingRange`, `puttingGreen`, `shortGameArea`
- Contact: `website`, `phone`

### CourseHole
**Per-hole scorecard data:**
- `holeNumber`, `par`, `handicap`, `yardageFromTee` (by tee)

### CourseTee
**Tee box specifications:**
- `teeName` (Blue/White/Red/etc.), `yardage`, `rating`, `slope`, `handicap`

---

## Current Frontend Status

| Page | Shows GolfCourseAPI Data? |
|------|---------------------------|
| `/courses` (list) | ❌ No - only name + city |
| `/courses/[courseId]` (detail) | ❌ No - but this is the best place |
| `/admin/imports/golfcourse` | ✓ Yes - admin only |

---

## How to Access This Data

### Via Service Layer (Recommended Pattern)
```typescript
// Add to courseService
const getCourseDetails = cache(async (courseId: string) => {
  const row = await getCourseRepository().findDetailById(courseId)
  // Join to CourseDetails via TournamentCourseMapping
  // or add direct FK to Course table
  return row ? mapCourseDetails(row) : null
})
```

### Repositories Available
- `CourseDetailsRepository.findByExternalId(externalCourseId)`
- `CourseHoleRepository.findByDetails(courseDetailsId)`
- `CourseTeeRepository.findByHole(courseHoleId)`

---

## Implementation Path for Course Detail Page

### Files to Modify
1. `/features/courses/services/course-service.ts` - Add `getGolfCourseDetails()`
2. `/features/courses/types.ts` - Extend `CourseDetail` type
3. `/features/courses/services/course-mapper.ts` - Add golf course mapping logic
4. `/features/courses/components/` - Create `GolfCourseDetailsPanel.tsx`
5. `/features/courses/course-detail-view.tsx` - Integrate new component

### New Component
`GolfCourseDetailsPanel` would show:
- Course specs (par, yardage, rating, slope)
- Facilities (driving range, practice green, short game)
- Playing conditions (grass types, green speed, elevation)
- Scorecard (hole-by-hole par, handicap, yardage by tee)

### Data Already Available
- ✓ Repositories exist
- ✓ Service layer pattern exists (just extend it)
- ✓ Mapper functions exist
- ✓ Component infrastructure exists
- ✓ No schema changes needed

---

## Key Database Relationships

```
Course.id
  ↓
  └─ TournamentCourseMapping.tournamentId
     └─ TournamentCourseMapping.golfCourseApiCourseId
        └─ CourseDetails.externalCourseId
           ├─ CourseHole[]
           └─ CourseTee[]
```

**Link path:** `Course` → `TournamentCourseMapping` → `CourseDetails` → `CourseHole`/`CourseTee`

---

## Lowest-Risk Implementation

1. ✓ Extend `courseService.getCourseById()` to also load `CourseDetails`
2. ✓ Update `CourseDetail` type to include golf specs
3. ✓ Create `GolfCourseDetailsPanel` component
4. ✓ Add to `CourseDetailView` below existing sections
5. ✓ No schema changes
6. ✓ No breaking changes to existing data flow

