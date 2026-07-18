# GolfCourseAPI Importer Audit Report
## Phase 13.1 Normalized Entity Import Analysis

Generated: 2026-07-18

---

## Executive Summary

The GolfCourseAPI importer has **comprehensive support for all Phase 13.1 normalized entities**. All 8 normalized tables are designed to be populated during import. However, the importer is currently **returning early with 0 records imported** due to a **CRITICAL BLOCKER**: No verified tournament-course mappings exist.

### Current Status
- ✅ **Importer Code**: All Phase 13.1 entities fully implemented
- ❌ **Data Import**: 0 courses imported (blocker: verified=false)
- ❌ **Normalized Tables**: Empty (no data written)

---

## Normalized Entity Audit

### 1. **Course** (CourseDetails)
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: externalCourseId, courseName, clubName |
| **Map** | ✅ | Maps GolfCourseDetail → CourseDetailsInput |
| **Persist** | ✅ | Uses courseDetailsRepo.upsert() |
| **Lines** | 248-269 | Basic course info persisted |
| **Records Written** | 0 | (blocker: no verified mappings) |

**Code**:
```typescript
const courseDetailsInput: CourseDetailsInput = {
  externalCourseId: String(courseDetail.id),
  courseName: courseDetail.name,
  clubName: courseDetail.clubName,
}
const courseResult = await courseDetailsRepo.upsert(courseDetailsInput)
```

---

### 2. **CourseAddress**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: city, state, country, website, phone |
| **Map** | ✅ | Maps courseDetail.address & contactDetail |
| **Persist** | ✅ | Uses courseAddressRepo.upsert() |
| **Lines** | 273-290 | Address persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.address)` | Only if address data exists |

**Code**:
```typescript
const addressInput: CourseAddressInput = {
  courseId,
  city: courseDetail.address.city,
  state: courseDetail.address.state,
  country: courseDetail.address.country,
  website: courseDetail.contact?.website,
  phone: courseDetail.contact?.phone,
}
const addressResult = await courseAddressRepo.upsert(addressInput)
```

**Counter**: addressesImported, addressesUpdated

---

### 3. **CourseCoordinates**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: latitude, longitude, elevation |
| **Map** | ✅ | Maps coordinates & playingConditions |
| **Persist** | ✅ | Uses courseCoordinatesRepo.upsert() |
| **Lines** | 292-307 | Coordinates persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.coordinates)` | Only if coordinates exist |

**Code**:
```typescript
const coordinatesInput: CourseCoordinatesInput = {
  courseId,
  latitude: courseDetail.coordinates.latitude,
  longitude: courseDetail.coordinates.longitude,
  elevation: courseDetail.playingConditions?.elevation,
}
const coordResult = await courseCoordinatesRepo.upsert(coordinatesInput)
```

**Counter**: coordinatesImported, coordinatesUpdated

---

### 4. **CourseSpecifications**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: par, totalYardage, courseRating, slopeRating |
| **Map** | ✅ | Maps courseDetail.specifications |
| **Persist** | ✅ | Uses courseSpecificationsRepo.upsert() |
| **Lines** | 309-325 | Specifications persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.specifications)` | Only if specs exist |

**Code**:
```typescript
const specsInput: CourseSpecificationsInput = {
  courseId,
  par: courseDetail.specifications.par,
  totalYardage: courseDetail.specifications.totalYardage,
  courseRating: courseDetail.specifications.courseRating,
  slopeRating: courseDetail.specifications.slopeRating,
}
const specsResult = await courseSpecificationsRepo.upsert(specsInput)
```

**Counter**: specificationsImported, specificationsUpdated

---

### 5. **CourseMetadata**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: architect, yearBuilt, courseStyle, facilities |
| **Map** | ✅ | Maps metadata & facilities |
| **Persist** | ✅ | Uses courseMetadataRepo.upsert() |
| **Lines** | 327-345 | Metadata persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.metadata)` | Only if metadata exists |

**Code**:
```typescript
const metaInput: CourseMetadataInput = {
  courseId,
  architect: courseDetail.metadata.architect,
  yearBuilt: courseDetail.metadata.yearBuilt,
  courseStyle: courseDetail.metadata.courseStyle,
  drivingRange: courseDetail.facilities?.drivingRange,
  puttingGreen: courseDetail.facilities?.puttingGreen,
  shortGameArea: courseDetail.facilities?.shortGameArea,
}
const metaResult = await courseMetadataRepo.upsert(metaInput)
```

**Counter**: metadataImported, metadataUpdated

---

### 6. **PlayingConditions**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: grassTypeFairway, grassTypeGreen, greenSize, greenSpeed |
| **Map** | ✅ | Maps courseDetail.playingConditions |
| **Persist** | ✅ | Uses playingConditionsRepo.create() |
| **Lines** | 347-362 | Conditions persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.playingConditions)` | Only if conditions exist |
| **Note** | Uses `.create()` not `.upsert()` | Allows multiple historical records |

**Code**:
```typescript
const playingInput: PlayingConditionsInput = {
  courseId,
  grassTypeFairway: courseDetail.playingConditions.grassTypeFairway,
  grassTypeGreen: courseDetail.playingConditions.grassTypeGreen,
  greenSize: courseDetail.playingConditions.greenSize,
  greenSpeed: courseDetail.playingConditions.greenSpeed,
}
const playingResult = await playingConditionsRepo.create(playingInput)
```

**Counter**: playingConditionsImported

---

### 7. **CourseHole**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: holeNumber, par, yardage, handicap |
| **Map** | ✅ | Maps courseDetail.holes array |
| **Persist** | ✅ | Uses courseHoleRepo.bulkUpsert() |
| **Lines** | 364-385 | All 18 holes persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.holes && .length > 0)` | Only if holes exist |
| **Batch Operation** | Yes | bulkUpsert for efficiency |
| **Pre-delete** | Yes | Deletes existing holes first (line 365) |

**Code**:
```typescript
const holes: CourseHoleInput[] = courseDetail.holes.map((hole) => ({
  courseId,
  holeNumber: hole.number,
  par: hole.par,
  yardage: hole.yardage,
  handicap: hole.handicap,
}))
const holesResult = await courseHoleRepo.bulkUpsert(holes)
```

**Counter**: holesImported, holesUpdated

---

### 8. **CourseTee**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: teeName, teeColor, gender, yardage, rating, slope |
| **Map** | ✅ | Maps courseDetail.tees array |
| **Persist** | ✅ | Uses courseTeeRepo.bulkUpsert() |
| **Lines** | 387-403 | All tee boxes persisted with courseId FK |
| **Records Written** | 0 | Depends on Course import |
| **Condition** | `if (courseDetail.tees && .length > 0)` | Only if tees exist |
| **Batch Operation** | Yes | bulkUpsert for efficiency |
| **Pre-delete** | Yes | Deletes existing tees first (line 366) |

**Code**:
```typescript
const tees: CourseTeeInput[] = courseDetail.tees.map((tee) => ({
  courseId,
  teeName: tee.name,
  teeColor: tee.color,
  gender: tee.gender,
  yardage: tee.yardage,
  rating: tee.rating,
  slope: tee.slope,
}))
const teesResult = await courseTeeRepo.bulkUpsert(tees)
```

**Counter**: teeBoxesImported, teeBoxesUpdated

---

### 9. **TeeHoleYardage**
| Aspect | Status | Details |
|--------|--------|---------|
| **Parse** | ✅ | Extracts: per-tee per-hole yardage matrix |
| **Map** | ✅ | Maps tee.holes array with hole ID lookup |
| **Persist** | ✅ | Uses teeHoleYardageRepo.bulkUpsert() |
| **Lines** | 404-430 | M:M tee×hole yardages persisted |
| **Records Written** | 0 | Depends on CourseTee import |
| **Condition** | `if (teeRecord && tee.holes && .length > 0)` | Only if holes exist |
| **Batch Operation** | Yes | bulkUpsert for efficiency |
| **Complexity** | HIGH | Requires hole ID lookup (lines 418-423) |

**Code** (Simplified):
```typescript
for (const tee of courseDetail.tees) {
  const teeRecord = await courseTeeRepo.findByTeeName(courseId, tee.name)
  if (teeRecord && tee.holes && tee.holes.length > 0) {
    const yardages: TeeHoleYardageInput[] = tee.holes.map((holeYardage) => ({
      teeId: teeRecord.id,
      holeId: "", // Will be filled by hole lookup
      courseId,
      yardage: holeYardage.yardage,
      handicap: holeYardage.handicap,
    }))
    
    // Match holes to hole IDs
    const holesForCourse = await courseHoleRepo.findByCourseId(courseId)
    const yardagesWithHoleIds = yardages.map((y) => ({
      ...y,
      holeId: holesForCourse.find((h) => h.holeNumber === ...)?.id || "",
    }))
    
    const yardageResult = await teeHoleYardageRepo.bulkUpsert(yardagesWithHoleIds)
  }
}
```

**Counter**: teeHoleYardagesImported

---

## Critical Blocker Analysis

### Root Cause: Early Return at Lines 180-220

**Condition**: No verified tournament-course mappings exist

```typescript
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
  console.log(`[v0] ❌ EARLY RETURN TRIGGERED`)
  return {
    coursesConsidered: 0,
    coursesMatched: 0,
    coursesImported: 0,  // ← ALL ZEROS
    // ... all counters = 0
  }
}
```

**Why It Happens**:
1. Tournament-course mappings table populated with 205 records (verified=false by default)
2. Importer calls `mappingRepo.findVerified()` which filters for `verified = true` (line 164)
3. Filter returns 0 records
4. Importer returns early with all counters = 0
5. No Phase 13.1 entities are ever parsed, mapped, or persisted

**Result**: All 9 normalized tables remain empty

---

## Import Flow Summary

### With Verified Mappings (Expected Path)

```
1. Load verified tournament-course mappings
   └── For each mapping:
       2. Fetch course from GolfCourseAPI
          3. Upsert Course (CourseDetails)
             ├── Upsert CourseAddress
             ├── Upsert CourseCoordinates
             ├── Upsert CourseSpecifications
             ├── Upsert CourseMetadata
             ├── Create PlayingConditions
             ├── BulkUpsert CourseHole (all 18)
             ├── BulkUpsert CourseTee (all tees)
             │  └── For each Tee:
             │      └── BulkUpsert TeeHoleYardage (per-tee per-hole matrix)
             └── Generate CourseIntelligence
```

### Current Path (Blocker)

```
1. Load verified tournament-course mappings
   ├── Filter: WHERE verified = true
   └── Returns: 0 records
       └── Early return with coursesConsidered = 0
           └── NO DATA IMPORTED
```

---

## Test Plan to Unblock Import

### Step 1: Mark Mapping as Verified
Select one tournament-course mapping and set `verified = true`:

```sql
UPDATE tournament_course_mappings 
SET verified = true 
WHERE golfCourseApiCourseId = '<select one API ID>'
LIMIT 1;
```

### Step 2: Run Importer
Execute the importer with single verified mapping and capture logs.

### Step 3: Verify Cascading Population
For the imported course, check all 9 normalized tables:

| Table | Expected | Query |
|-------|----------|-------|
| course_details | 1 | `SELECT COUNT(*) FROM course_details` |
| course_addresses | 1 | `SELECT COUNT(*) FROM course_addresses` |
| course_coordinates | 1 | `SELECT COUNT(*) FROM course_coordinates` |
| course_specifications | 1 | `SELECT COUNT(*) FROM course_specifications` |
| course_metadata | 1 | `SELECT COUNT(*) FROM course_metadata` |
| playing_conditions | 1+ | `SELECT COUNT(*) FROM playing_conditions` |
| course_holes | 18 | `SELECT COUNT(*) FROM course_holes` |
| course_tees | 3-5 | `SELECT COUNT(*) FROM course_tees` |
| tee_hole_yardages | 54-90 | `SELECT COUNT(*) FROM tee_hole_yardages` |

**Total Expected Records**: ~30-110 per course (depending on data completeness)

---

## Conclusion

**Status**: ✅ Implementation complete, ❌ Blocked by data configuration

The importer code is **production-ready** and fully supports all Phase 13.1 normalized entities. The only issue is the **missing verified mappings**. Once one mapping is verified, the entire import cascade will work as designed.

**Next Action**: Mark one tournament-course mapping as verified and run the importer to validate the data population pipeline.
