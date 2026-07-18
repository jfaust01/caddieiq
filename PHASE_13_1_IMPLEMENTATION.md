# Phase 13.1 — Complete GolfCourseAPI Data Model & Course Intelligence

## Overview

Phase 13.1 normalizes every reusable entity returned by GolfCourseAPI into relational tables, enabling complete Course Intelligence. This document describes the implementation architecture and completion status.

## Architecture

### Database Schema (Complete)

The implementation introduces 6 new normalized entities:

| Entity | Type | Purpose | Queries |
|--------|------|---------|---------|
| **CourseAddress** | 1:1 | City, state, country, postal code, website, phone | Join via courseId |
| **CourseCoordinates** | 1:1 | GPS coordinates (lat/lon) and elevation | Indexed for geospatial queries |
| **CourseSpecifications** | 1:1 | Par, yardage, USGA course rating, slope | Query for scoring validation |
| **CourseMetadata** | 1:1 | Architect, year built, style, facilities | Searchable, faceted filtering |
| **PlayingConditions** | 1:M | Grass types, green conditions, temporal tracking | Historical records per course |
| **TeeHoleYardage** | M:M (junction) | Per-hole yardage for each tee | Query tee-specific metrics |

All models maintain proper foreign keys with cascading deletes.

### Migration (Complete)

Created `/prisma/migrations/20260718000000_normalize_golf_course_api_phase13/migration.sql`:

- Creates all 6 new tables with proper indexes
- Migrates existing denormalized data from CourseDetails
- Maintains referential integrity
- Includes composite indexes for common query patterns (e.g., courseId + observedAt)

### Repositories (Complete)

Implemented data access layer for all new entities:

- `getCourseAddressRepository()` - Address CRUD
- `getCourseCoordinatesRepository()` - Coordinates CRUD
- `getCourseSpecificationsRepository()` - Specifications CRUD
- `getCourseMetadataRepository()` - Metadata CRUD
- `getPlayingConditionsRepository()` - Playing conditions CRUD (supports historical)
- `getTeeHoleYardageRepository()` - Tee-hole junction operations

All repositories follow the established `BaseRepository` pattern with:
- Upsert support (idempotent imports)
- Bulk operations where applicable
- Proper error handling and logging
- Insert/update detection

## Implementation Roadmap

### Phase 1: ✅ Complete
- [x] Normalize schema into 6 entities
- [x] Create database migration
- [x] Implement repositories for all 6 entities
- [x] Update Prisma client

### Phase 2: In Progress
- [ ] Update GolfCourseAPI importer (`course-intelligence-import.ts`)
  - Import sequence: Course → Address → Coordinates → Specifications → Metadata → Holes → Tees → Playing Conditions → TeeHoleYardage
  - Maintain idempotency (upsert all operations)
  - Track completion metrics for each entity
  
- [ ] Expand Database Health dashboard
  - Show all 9 table metrics (not just courses)
  - Display row counts, last import time, data completeness %
  - Highlight missing relationships and data quality issues

- [ ] Create admin browsers for all entities
  - CourseAddress browser (filter by country/state)
  - CourseCoordinates browser (map view, geospatial search)
  - CourseSpecifications browser (filter by par, yardage, rating)
  - CourseMetadata browser (filter by architect, style, year)
  - PlayingConditions browser (show historical records)
  - TeeHoleYardage browser (per-tee-per-hole matrix)

- [ ] Build comprehensive Course Detail page redesign
  - 9 expandable sections (one per normalized entity)
  - Validation checklist:
    - ✓ Address exists
    - ✓ Coordinates exist
    - ✓ Specifications exist
    - ✓ Metadata exists
    - ✓ Playing Conditions imported
    - ✓ Exactly 18 holes
    - ✓ Tee boxes imported
    - ✓ Tee Hole Yardages populated
  - Raw GolfCourseAPI response tab for data lineage verification
  - Relationship navigation (Course → Hole → Tee → Yardage → back to Hole, etc.)

### Phase 3: Future
- Data Lineage tracking (audit trail: GolfCourseAPI → Importer → Database → Course Intelligence)
- Advanced validation rules per data type
- Bulk data quality fixes through admin UI
- Export validated data for downstream systems

## Key Design Decisions

### 1. Separate Tables vs. JSON
Every reusable entity is stored in a dedicated table, **not** as JSON. This enables:
- Direct SQL queries without JSON operators
- Index support for performance
- Type safety through Prisma models
- Easier migrations and schema evolution
- Row-level access control (future RLS)

### 2. PlayingConditions as 1:M
Unlike other course attributes (which are 1:1), playing conditions support multiple records per course with `observedAt` timestamps. This allows:
- Historical tracking (grass change, green maintenance, seasonal variations)
- Audit trail of condition changes
- Weather system correlation
- Future analytics on condition impact

### 3. TeeHoleYardage as Junction Table
Breaks down the implicit many-to-many relationship:
- Each tee has multiple holes (18)
- Each hole can have different yardages per tee
- Enables hole-level handicap tracking per tee
- Supports par variations by tee (rare but possible)

### 4. CourseDetails Simplification
CourseDetails now contains ONLY:
- `id`, `externalCourseId`, `courseName`, `clubName`
- Relationships to all normalized entities
- Links to CourseIntelligence (existing)

This becomes the "anchor" entity; all data flows through CourseDetails relationships.

## Validation Requirements

For a course to be "complete" and ready for Course Intelligence:

```
✓ Course record exists
✓ CourseAddress populated (at least city + state)
✓ CourseCoordinates populated (both lat + lon)
✓ CourseSpecifications populated (par, yardage, rating, slope)
✓ CourseMetadata populated (at least style + yearBuilt)
✓ PlayingConditions record exists (at least one entry)
✓ CourseHole records: exactly 18
✓ CourseTee records: at least 1 (typically 3-5)
✓ TeeHoleYardage records: numTees × 18 (complete matrix)
```

## Completeness Scoring

Database Health dashboard calculates: `completeness = (fulfilled criteria / 9) * 100%`

Targets:
- **< 50%**: Critical - do not use
- **50-80%**: Warning - review before use
- **> 80%**: Good - usable with caveats
- **> 95%**: Excellent - production ready

## Data Lineage

Each record indicates:
1. **Source**: GolfCourseAPI
2. **Importer**: `importCourseIntelligence()` function
3. **Database**: Specific normalized table
4. **Usage**: CourseIntelligence engine (feeds metrics, insights, scoring)
5. **Consumer**: Tournament Hub, DFS, Ratings, Simulations

Admin UI allows tracing any value back to its GolfCourseAPI origin.

## Next Steps

1. **Update Importer**: Modify `course-intelligence-import.ts` to populate all 6 entities
2. **Database Health**: Expand `/admin/system/health` to show all 9 tables + metrics
3. **Admin Browsers**: Create 9 browsable tables with filtering, search, detail drawers
4. **Course Detail**: Redesign `/courses/[id]` with all sections + validation status + raw JSON
5. **Relationship Navigation**: Ensure no dead ends; users can traverse the entire entity graph
6. **Testing**: Import real GolfCourseAPI data and verify completeness scores

## Files Modified/Created

### Schema & Migrations
- ✅ `prisma/schema.prisma` - Added 6 models, updated CourseDetails, CourseHole, CourseTee
- ✅ `prisma/migrations/20260718000000_normalize_golf_course_api_phase13/migration.sql` - Data migration

### Repositories
- ✅ `lib/repositories/course-address-repository.ts`
- ✅ `lib/repositories/course-coordinates-repository.ts`
- ✅ `lib/repositories/course-specifications-repository.ts`
- ✅ `lib/repositories/course-metadata-repository.ts`
- ✅ `lib/repositories/playing-conditions-repository.ts`
- ✅ `lib/repositories/tee-hole-yardage-repository.ts`

### To Be Implemented
- [ ] `lib/imports/course-intelligence-import.ts` - Updated importer
- [ ] `features/admin/system/database-health.tsx` - Expanded dashboard
- [ ] 9 admin browser components
- [ ] Redesigned course detail page
- [ ] Admin pages for all 9 entities

## Success Criteria

✅ A completed course should allow inspection of:
- Every hole (18)
- Every tee (3-5 typically)
- Every yardage (18 per tee)
- Every specification (4 fields)
- Every coordinate (2 GPS + elevation)
- Every address field (6 fields)
- Every metadata field (7 fields)
- Playing conditions (grass, green, etc.)

**Without writing SQL.**

Once complete, the system will have complete confidence that Course Intelligence is correctly populated and ready to power:
- Golfer ratings
- Course-fit models
- Tournament simulations
- AI explanations
- DFS optimization
- Betting analytics

