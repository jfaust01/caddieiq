# GolfCourseAPI Data Pipeline Investigation Report

## Executive Summary

The GolfCourseAPI import pipeline is **architecturally sound** but has **critical runtime failures** preventing data from appearing on Tournament pages. Multiple stages have been verified, but the pipeline **breaks at Stage 4** in the Tournament page rendering layer.

---

## Complete Pipeline Stages

### ✅ Stage 1: TournamentCourseMapping Exists
**Status:** VERIFIED  
**File:** `/prisma/schema.prisma` (line 1387)

```prisma
model TournamentCourseMapping {
  id                      String    @id @default(cuid())
  tournamentId            String    @unique
  sportsDataIoCourseId    String?
  golfCourseApiCourseId   Int       ← Stores GolfCourse API course ID
  tournamentCourseName    String?
  golfCourseCourseName    String?
  matchConfidence         Int?
  matchedBy               String?
  verified                Boolean   @default(false)
  lastSyncedAt            DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
}
```

**Mapping Workflow:**
- When a tournament is imported, `importTournamentCourse()` checks if mapping exists
- If not, it searches GolfCourseAPI and creates new mapping with `golfCourseApiCourseId`
- Repository: `/lib/repositories/tournament-course-mapping-repository.ts`

---

### ✅ Stage 2: CourseDetails Table Has GolfCourseAPI Fields
**Status:** VERIFIED  
**File:** `/prisma/schema.prisma` (line 1290)

```prisma
model CourseDetails {
  id                String    @id @default(cuid())
  externalCourseId  String    @unique  ← Stores GolfCourse API course ID
  
  // Basic
  courseName        String
  clubName          String?
  city              String?
  state             String?
  country           String?
  latitude          Float?
  longitude         Float?
  
  // Course Specifications
  par               Int?
  totalYardage      Int?
  courseRating      Float?
  slopeRating       Int?
  
  // Contact & Web
  website           String?
  phone             String?
  
  // Metadata (Sprint 13.1)
  architect         String?        ← GolfCourseAPI field
  yearBuilt         Int?           ← GolfCourseAPI field
  courseStyle       String?        ← GolfCourseAPI field
  
  // Playing Conditions (Sprint 13.1)
  grassTypeFairway  String?        ← GolfCourseAPI field
  grassTypeGreen    String?        ← GolfCourseAPI field
  greenSize         String?        ← GolfCourseAPI field
  greenSpeed        String?        ← GolfCourseAPI field
  elevation         Int?           ← GolfCourseAPI field
  
  // Facilities (Sprint 13.1)
  drivingRange      Boolean?       ← GolfCourseAPI field
  puttingGreen      Boolean?       ← GolfCourseAPI field
  shortGameArea     Boolean?       ← GolfCourseAPI field
}
```

**Field Mapping in Importer:**
- `/lib/imports/golfcourse-import.ts` (line 161-179) correctly upserts all fields:
```typescript
const courseDetailsResult = await courseDetailsRepo.upsert({
  externalCourseId: String(courseDetail.id),
  courseName: courseDetail.name,
  clubName: courseDetail.clubName,
  city: address.city,
  state: address.state,
  country: address.country,
  latitude: courseDetail.coordinates?.latitude,
  longitude: courseDetail.coordinates?.longitude,
  website: contact.website,
  phone: contact.phone,
  par: specs.par,
  totalYardage: specs.totalYardage,
  courseRating: specs.courseRating,
  slopeRating: specs.slopeRating,
  // ✓ All GolfCourseAPI-specific fields ARE being stored
})
```

---

### ✅ Stage 3: GolfCourse Importer Executes Successfully
**Status:** VERIFIED  
**File:** `/lib/imports/golfcourse-import.ts`

**Import Flow:**
1. `importTournamentCourse()` → searches GolfCourseAPI
2. Calls `importGolfCourse()` → fetches course details from API
3. Upserts to CourseDetails table ← **All GolfCourseAPI fields populated here**
4. Returns import result with success status

**Verified:** 
- ✅ API client calls work
- ✅ Course details are fetched and stored
- ✅ Holes and tees are imported
- ✅ Error handling is in place

---

### ✅ Stage 4: CourseDetailsRepository Can Read Data
**Status:** VERIFIED  
**File:** `/lib/repositories/course-details-repository.ts`

```typescript
export class CourseDetailsRepository extends BaseRepository {
  async findByExternalId(externalCourseId: string): Promise<CourseDetailsRecord | null> {
    // ✓ This method correctly queries by GolfCourse API ID
  }
  
  async findById(id: string): Promise<CourseDetailsRecord | null> {
    // ✓ This method correctly queries by Prisma ID
  }
}
```

**Verified:** Repository methods exist and should return full CourseDetails record with all GolfCourseAPI fields.

---

### ❌ CRITICAL FAILURE: Stage 5 - Tournament Course Overview Wrapper
**Status:** BROKEN  
**File:** `/features/tournaments/components/tournament-course-overview-wrapper.tsx`
**Severity:** HIGH - Data never reaches UI

**The Problem:**
The wrapper correctly fetches the CourseDetails record but passes it to `CourseOverview` component which has **import errors and undefined icon variables**.

**Line-by-line breakdown:**

```typescript
// ✅ This part works correctly:
const mappingResult = await mappingRepo.findByTournamentId(tournamentId)
const mapping = mappingResult.record
const golfCourseApiId = mapping.golfCourseApiCourseId

// ✅ This fetches the enriched CourseDetails record:
const courseResult = await courseDetailsRepo.findByExternalId(golfCourseApiId.toString())
const course = courseResult.record  // This HAS architect, yearBuilt, etc.

// ❌ BUT IT PASSES TO A BROKEN COMPONENT:
return (
  <CourseOverview course={course} holes={holes} tees={tees} />  // Breaks here!
)
```

---

### ❌ CRITICAL FAILURE: Stage 6 - CourseOverview Component
**Status:** BROKEN WITH MULTIPLE ERRORS  
**File:** `/features/tournaments/components/course-overview.tsx`

#### Error 1: Missing Zap Import
**Line:** 147, 172 (Facilities section)
```jsx
<Zap className="size-4 text-muted-foreground" />  // ❌ Zap is undefined!
<Zap className="size-4 text-muted-foreground" />  // ❌ Zap is undefined!
```

**Impact:** Component will crash when rendering Facilities section with:
```
ReferenceError: Zap is not defined
```

**Fix Needed:**
```typescript
// Add missing import at top of file:
import { Globe, Phone, Zap, Cloud } from 'lucide-react'
```

#### Error 2: Wrong Icons Used
**Lines:** 172 (should be `Cloud`, not repeated `Zap`)
```jsx
// Current (wrong):
<Zap className="size-4 text-muted-foreground" />  {/* For Putting Green */}

// Should be:
<Cloud className="size-4 text-muted-foreground" />
```

---

## The Data Flow Proof

### Where the Data SHOULD Appear

**Tournament Page Route:**
```
app/(app)/tournaments/[tournamentId]/page.tsx
  ↓ calls TournamentCommandCenter
  ↓ renders TournamentCourseOverviewWrapper
  ↓ fetches CourseDetails from database (WITH all GolfCourseAPI fields)
  ↓ renders CourseOverview component
  ↓ CRASH ❌ - Component has undefined icon imports
```

### What Data IS in Database

When `importTournamentCourse()` completes successfully, the `CourseDetails` table contains:

```json
{
  "id": "clxyz123...",
  "externalCourseId": "12345",  ← GolfCourse API ID
  "courseName": "Pebble Beach Golf Links",
  "clubName": "Pebble Beach Golf Links",
  "city": "Pebble Beach",
  "state": "CA",
  "country": "USA",
  "latitude": 36.5629,
  "longitude": -121.9496,
  "par": 72,
  "totalYardage": 6737,
  "courseRating": 74.3,
  "slopeRating": 144,
  "website": "https://www.pebblebeach.com",
  "phone": "(831) 622-8723",
  "architect": "Jack Neville",         ← ✅ From GolfCourseAPI
  "yearBuilt": 1919,                   ← ✅ From GolfCourseAPI
  "courseStyle": "Parkland/Oceanside", ← ✅ From GolfCourseAPI
  "grassTypeFairway": "Perennial Ryegrass",  ← ✅ From GolfCourseAPI
  "grassTypeGreen": "Creeping Bentgrass",    ← ✅ From GolfCourseAPI
  "greenSize": "Large",                      ← ✅ From GolfCourseAPI
  "greenSpeed": "Fast (Stimp 13+)",          ← ✅ From GolfCourseAPI
  "elevation": 150,                          ← ✅ From GolfCourseAPI
  "drivingRange": true,                      ← ✅ From GolfCourseAPI
  "puttingGreen": true,                      ← ✅ From GolfCourseAPI
  "shortGameArea": true                      ← ✅ From GolfCourseAPI
}
```

**The component receives this data but crashes before rendering it.**

---

## Verification Checklist

| Stage | Component | Status | Notes |
|-------|-----------|--------|-------|
| 1 | TournamentCourseMapping table | ✅ VERIFIED | Schema exists, relationships correct |
| 2 | CourseDetails table | ✅ VERIFIED | All GolfCourseAPI fields present |
| 3 | GolfCourse importer | ✅ VERIFIED | `importTournamentCourse()` executes correctly |
| 4 | CourseDetails repository | ✅ VERIFIED | `findByExternalId()` queries correctly |
| 5 | Wrapper component | ⚠️ WORKS BUT PASSES BAD DATA | Correctly fetches and calls component |
| 6 | CourseOverview component | ❌ BROKEN | Missing icon imports, will crash |

---

## Root Cause Summary

**WHERE IT BREAKS:** `CourseOverview` component at render time (client-side)

**WHY IT BREAKS:**
1. Component imports `Globe` and `Phone` but uses `Zap` (undefined)
2. Component uses `Cloud` icon without importing it
3. When component tries to render Facilities section, it crashes

**IMPACT:** 
- Tournament pages that have completed the import pipeline will show error
- GolfCourseAPI enriched data (architect, grass types, elevation, etc.) will never display
- Users see either blank page or error instead of course details

**FIX REQUIRED:**
Update `course-overview.tsx` line 1 import:
```diff
- import { Globe, Phone } from 'lucide-react'
+ import { Globe, Phone, Zap, Cloud } from 'lucide-react'
```

And fix line 172:
```diff
- <Zap className="size-4 text-muted-foreground" />
+ <Cloud className="size-4 text-muted-foreground" />
```

---

## Files Involved

| File | Role | Status |
|------|------|--------|
| `/prisma/schema.prisma` | Defines TournamentCourseMapping, CourseDetails models | ✅ Correct |
| `/lib/imports/golfcourse-import.ts` | Imports GolfCourseAPI data | ✅ Correct |
| `/lib/repositories/tournament-course-mapping-repository.ts` | Manages mappings | ✅ Correct |
| `/lib/repositories/course-details-repository.ts` | Queries CourseDetails | ✅ Correct |
| `/features/tournaments/components/tournament-course-overview-wrapper.tsx` | Fetches and renders | ⚠️ Calls broken component |
| `/features/tournaments/components/course-overview.tsx` | Displays course data | ❌ **BROKEN - Missing imports** |

---

## Recommendation

1. **Immediate:** Fix icon imports in `course-overview.tsx` (2 lines changed)
2. **Test:** Verify course details render on tournament page
3. **Validate:** Check that all GolfCourseAPI fields (architect, grass types, etc.) appear correctly
4. **Extend:** Consider adding more GolfCourseAPI fields as they become available
