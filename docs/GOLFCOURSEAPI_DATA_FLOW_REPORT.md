# GolfCourseAPI Data Flow Analysis

**Date**: Production Readiness Audit Phase 2  
**Status**: ANALYSIS ONLY - No implementation yet

---

## Executive Summary

GolfCourseAPI data is **stored but largely hidden**. The system maintains extensive course details (specs, conditions, facilities) but exposes almost none of it in the customer-facing UI. The easiest path to surfacing this data is the **Course Detail Page** (`/courses/[courseId]`), which already has a dedicated hero section and is structured to display enriched data.

---

## 1. Database Tables Containing GolfCourseAPI Data

### Primary Tables

| Table | Purpose | GolfCourseAPI Fields | Status |
|-------|---------|---------------------|--------|
| **CourseDetails** | Full GolfCourseAPI course record | externalCourseId, courseName, clubName, city, state, country, lat/lng, website, phone, par, totalYardage, courseRating, slopeRating, architect, yearBuilt, courseStyle, grassTypeFairway, grassTypeGreen, greenSize, greenSpeed, elevation, drivingRange, puttingGreen, shortGameArea | ✓ Fully Populated |
| **CourseHole** | Per-hole GolfCourseAPI data | holeNumber, par, handicap, yardageFromTee | ✓ Fully Populated |
| **CourseTee** | Tee box data from GolfCourseAPI | teeName, yardage, rating, slope, handicap | ✓ Fully Populated |
| **TournamentCourseMapping** | Links tournaments to GolfCourseAPI courses | golfCourseApiCourseId, matchConfidence, verified | ✓ Fully Populated |

### Secondary/Related Tables

| Table | Relationship |
|-------|--------------|
| **Course** | Parent course; does NOT contain GolfCourseAPI data; only basic identity (name, city, coordinates) |
| **CourseCharacteristic** | CaddieIQ-derived characteristics, not GolfCourseAPI data |
| **CourseIntelligence** | Computed course profile, not raw GolfCourseAPI data |

---

## 2. Which Fields Are Populated

### CourseDetails Table (Most Complete)

**Always Populated:**
- `externalCourseId` (GolfCourseAPI course ID) ← KEY LINK
- `courseName`

**Often Populated:**
- `clubName` (club/facility name)
- `city`, `state`, `country`
- `latitude`, `longitude`
- `par`, `totalYardage`
- `courseRating`, `slopeRating`
- `website`, `phone`

**Occasionally Populated (Sprint 13.1 data):**
- `architect`, `yearBuilt`, `courseStyle`
- `grassTypeFairway`, `grassTypeGreen`
- `greenSize`, `greenSpeed`, `elevation`
- `drivingRange`, `puttingGreen`, `shortGameArea`

### CourseHole & CourseTee Tables

**Well Populated:**
- Hole-by-hole scorecard data (par, handicap, yardage by tee)
- Multiple tee options per hole
- Detailed rating/slope metrics

---

## 3. Which Frontend Pages Currently Display GolfCourseAPI Data

### Current Usage (Almost None)

| Page | GolfCourseAPI Display |
|------|---------------------|
| `/courses` (Course Directory) | ❌ NOT SHOWN - Only displays basic course identity (name, city) |
| `/courses/[courseId]` (Course Detail) | ❌ NOT SHOWN - Shows course hero, tournaments, intelligence profile, but NO GolfCourseAPI data |
| `/admin/imports/golfcourse` (Admin Panel) | ✓ YES - Admin-only page showing import history and course coverage |
| `/dashboard` | ❌ NOT SHOWN |
| `/admin/database-health` | ❌ NOT SHOWN - Only shows import pipeline status |

### Data Actually Displayed

Currently visible fields are limited to:
- Course name
- City/state/country (from Course table, not CourseDetails)
- Basic location coordinates
- Tournament history
- Course Intelligence profile (CaddieIQ-derived, not GolfCourseAPI)

---

## 4. Frontend Pages That Query These Tables But Don't Render Data

### Course Detail Page (`/courses/[courseId]`)

**What it queries:**
```
courseService.getCourseById(courseId)
  → CourseRepository.findDetailById()
  → Returns: CourseDetailRow {
      course: CourseRecord,
      characteristic: CourseCharacteristicRecord | null,
      tournaments: CourseTournamentRow[]
    }
```

**What it COULD query but doesn't:**
- `CourseDetailsRepository.findByExternalId()` - NOT CALLED
- `CourseHoleRepository.findByDetails()` - NOT CALLED
- `CourseTeeRepository.findByHole()` - NOT CALLED

**Why it's the best candidate:**
1. ✓ Already has infrastructure (service layer, mapper, components)
2. ✓ Has a dedicated hero section perfect for specs
3. ✓ Already displays tournaments on the same page
4. ✓ User-facing (not admin-only)
5. ✓ No breaking changes needed - can augment without removing existing content

### Tournament Detail Page

The tournament detail page also has courses as context but doesn't surface GolfCourseAPI data.

---

## 5. Data Flow Diagram: Where GolfCourseAPI Data Lives

```
┌─────────────────────────────────────────────────────────────────┐
│ GolfCourseAPI (External Source)                                 │
│ - Courses: name, specs, facilities, contact, etc.               │
│ - Holes: scorecard, par, handicap, yardage per tee              │
│ - Tees: tee box data, rating, slope                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Tournament Import + Course Mapping Workflow
                 │ (Already implemented & production-ready)
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│ Database Layer                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CourseDetails (Fully populated)                                 │
│  ├─ externalCourseId (KEY: links to GolfCourseAPI)             │
│  ├─ courseName, clubName, location (city/state/country)        │
│  ├─ Specs: par, yardage, rating, slope                         │
│  ├─ Meta: architect, yearBuilt, courseStyle                    │
│  ├─ Conditions: grassType, greenSpeed, elevation               │
│  └─ Facilities: drivingRange, puttingGreen, shortGameArea      │
│                                                                  │
│ CourseHole (Per-hole scorecard)                                │
│  ├─ holeNumber, par, handicap                                  │
│  └─ yardageFromTee (for each tee box)                          │
│                                                                  │
│ CourseTee (Tee box specs)                                       │
│  ├─ teeName (Blue, White, Red, etc.)                           │
│  ├─ yardage, rating, slope                                     │
│  └─ handicap                                                    │
│                                                                  │
│ TournamentCourseMapping                                         │
│  ├─ golfCourseApiCourseId (FK to CourseDetails.externalCourseId)
│  ├─ matchConfidence, verified status                           │
│  └─ Audit trail: lastSyncedAt, createdAt                       │
│                                                                  │
│ Course (Basic identity - does NOT contain GolfCourseAPI data)  │
│  ├─ name, slug, city, stateProvince, country                  │
│  ├─ latitude, longitude (from geolocation engine, not GolfCourseAPI)
│  └─ par, yardage (if populated from legacy import)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                 │
                 │ Repositories Layer
                 ├─ CourseRepository (reads Course table only)
                 ├─ CourseDetailsRepository (reads CourseDetails)
                 ├─ CourseHoleRepository (reads CourseHole)
                 └─ CourseTeeRepository (reads CourseTee)
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│ Service Layer (courseService)                                   │
│                                                                  │
│ getCourseById()                                                 │
│  └─ Returns CourseDetail (from Course + Tournaments only)       │
│     ❌ Does NOT call CourseDetailsRepository                    │
│     ❌ Does NOT call CourseHoleRepository                       │
│     ❌ Does NOT call CourseTeeRepository                        │
│                                                                  │
│ getCourseIntelligence()                                         │
│  └─ Returns CourseProfile (CaddieIQ-derived, not GolfCourseAPI) │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                 │
                 │ API Layer
                 ├─ /api/courses (lists basic courses)
                 ├─ /api/courses/[id] (returns CourseDetail)
                 ├─ /api/admin/imports/golfcourse (admin import)
                 └─ /api/admin/imports/golfcourse/course/[id] (admin detail)
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│ React Components / Frontend Pages                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ /courses/page.tsx                                               │
│  └─ CoursesView → CourseDirectory                              │
│     └─ Lists courses (name, city only)                         │
│        ❌ GolfCourseAPI data NOT shown                          │
│                                                                  │
│ /courses/[courseId]/page.tsx                                    │
│  └─ CourseDetailView                                           │
│     ├─ CourseHero (course identity)                            │
│     ├─ CourseIntelligencePanel (CaddieIQ profile)              │
│     ├─ CourseTournaments (tournament list)                     │
│     └─ ❌ NO GolfCourseAPI specs, facilities, or scorecard     │
│                                                                  │
│ /admin/imports/golfcourse/page.tsx                             │
│  └─ ✓ Shows GolfCourseAPI import history (admin only)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ↓
            ❌ USER SEES
          - Course name, city
          - Tournaments hosted
          - Course intelligence
          - ✓ Everything else hidden
```

---

## 6. Current Data State: What's Stored vs. What's Shown

### Data Available in Database (from GolfCourseAPI)

✓ **Course Specifications**
- Par, yardage, rating, slope, elevation
- Architect, year built, style
- Club name, website, phone

✓ **Playing Conditions**
- Grass types (fairway, green)
- Green size, green speed
- Presence of facilities (driving range, practice green, short game area)

✓ **Scorecard**
- Hole-by-hole par, handicap, yardage by tee box
- Multiple tee options with rating/slope

**Not Shown to Users**: All of the above

### Data Currently Shown to Users

✓ Course name, city, state, country  
✓ Tournament history  
✓ CaddieIQ intelligence profile  
✓ General course characteristics (CaddieIQ-derived)  

**Missing**: Specific specs, facilities, scorecard data from GolfCourseAPI

---

## 7. Recommended Surface: Course Detail Page

### Why This Page is Ideal

1. **Already User-Facing**
   - No admin barriers
   - Golfers naturally view this page when researching a course

2. **Existing Infrastructure**
   - Service layer (`courseService`)
   - Mapper functions (`mapCourseDetail`)
   - Component structure (`CourseDetailView`)
   - Hero section designed for specs

3. **No Breaking Changes**
   - Can augment without removing tournaments or intelligence
   - Add a new section below existing content
   - Progressive enhancement

4. **Natural Information Architecture**
   ```
   Course Name / Hero
   ├─ Basic specs (par, yardage) - CURRENTLY SHOWN
   ├─ Intelligence Profile - CURRENTLY SHOWN
   ├─ Tournaments - CURRENTLY SHOWN
   └─ [NEW] Course Details Tab/Section
      ├─ Facilities (driving range, practice green, short game)
      ├─ Course Conditions (grass types, green speed)
      ├─ Scorecard (hole-by-hole breakdown with tee options)
      └─ Metadata (architect, year built, style)
   ```

5. **Low Implementation Risk**
   - Reuse existing pattern: CourseDetailsRepository already exists
   - Add to `courseService` (follow existing cache pattern)
   - Create new component `GolfCourseDetailsPanel`
   - Integrate into `CourseDetailView`

---

## 8. Complete Data Connection Map

### Course Detail Page Data Flow (Proposed)

```
/courses/[courseId]/page.tsx (Route Handler)
  │
  ├─→ courseService.getCourseById(courseId)
  │    └─→ CourseRepository.findDetailById()
  │         └─→ Returns: Course + Tournaments + Characteristic
  │
  ├─→ courseService.getCourseIntelligence(courseId)
  │    └─→ Returns: CourseProfile (CaddieIQ-derived)
  │
  └─→ [NEW] courseService.getGolfCourseDetails(courseId)
       └─→ Join Course → CourseDetails → CourseHole → CourseTee
            └─→ Returns: Full GolfCourseAPI specs + scorecard
  
  ↓ All data passed to CourseDetailView
  
  CourseDetailView
  ├─ CourseHero (existing)
  ├─ CourseIntelligencePanel (existing)
  ├─ CourseTournaments (existing)
  └─ [NEW] GolfCourseDetailsPanel
     ├─ Facilities Card
     ├─ Course Specs Card
     ├─ Playing Conditions Card
     └─ Scorecard Component (expandable hole breakdown)
```

---

## 9. Schema Relationships Required

```
Course.id
  ↓
  ├─ TournamentCourseMapping.tournamentId → Tournament
  │
  └─ [Need to establish] Course → CourseDetails
     via golfCourseApiCourseId lookup
     
Current Gap:
- Course table has NO direct link to CourseDetails
- TournamentCourseMapping.golfCourseApiCourseId → CourseDetails.externalCourseId
- Need to JOIN through TournamentCourseMapping or add direct FK
```

### Solution Options

**Option A: Via TournamentCourseMapping (Simplest for Detail Page)**
```sql
SELECT cd.* 
FROM courses c
JOIN tournament_courses tc ON c.id = tc.courseId
JOIN tournament_course_mappings tcm ON tc.tournamentId = tcm.tournamentId
JOIN course_details cd ON tcm.golfCourseApiCourseId = cd.externalCourseId
WHERE c.id = ?
LIMIT 1
```

**Option B: Add Direct FK (Better Long-Term)**
```
Course table:
  + golfCourseApiCourseId INT UNIQUE
    
Then:
SELECT cd.* FROM courses c
JOIN course_details cd ON c.golfCourseApiCourseId = cd.externalCourseId
WHERE c.id = ?
```

---

## 10. Summary: Data Exists, Waiting to be Shown

### Current State
- ✓ GolfCourseAPI data fully imported and stored
- ✓ Repositories and access patterns exist
- ✓ Service layer has room to expand
- ❌ No user-facing display of this data

### Easiest Next Step
**Surface GolfCourseAPI data on Course Detail Page** (`/courses/[courseId]`)
- Reuses existing infrastructure
- No schema changes needed (can work with current relationships)
- Natural place for golfers to find this information
- Low risk, high value

### What Would Be Shown
- Course specs (par, yardage, rating, slope)
- Facilities (driving range, practice green, short game area)
- Playing conditions (grass types, green speed, elevation)
- Scorecard (hole-by-hole par, handicap, yardage by tee)

---

## Appendix: File Structure Reference

### Key Repositories (Read GolfCourseAPI Data)
- `/lib/repositories/course-details-repository.ts` - CourseDetails CRUD
- `/lib/repositories/course-hole-repository.ts` - Hole data
- `/lib/repositories/course-tee-repository.ts` - Tee box data
- `/lib/repositories/tournament-course-mapping-repository.ts` - Mapping lookup

### Service Layer
- `/features/courses/services/course-service.ts` - Main service (extensible)

### Current Components
- `/features/courses/components/course-hero.tsx`
- `/features/courses/components/course-intelligence-panel.tsx`
- `/features/courses/components/course-tournaments.tsx`

### Admin (Reference Only)
- `/app/api/admin/imports/golfcourse/route.ts` - Import endpoint
- `/app/api/admin/imports/golfcourse/course/[id]/route.ts` - Admin detail view

