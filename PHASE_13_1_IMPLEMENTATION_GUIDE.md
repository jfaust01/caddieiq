# Phase 13.1: Proper Migration Strategy & Implementation Guide

## Summary

Phase 13.1 (normalized GolfCourseAPI entities) encountered critical blockers due to incomplete migration planning. This guide documents the **proper implementation path** for successfully deploying Phase 13.1.

## Current State

- ✓ Denormalized `CourseDetails` model is stable and functional
- ✓ Database Health page is working with graceful error handling  
- ✗ Phase 13.1 normalized tables blocked - incomplete schema dependencies
- ✗ CourseHole, CourseTee, TeeHoleYardage tables referenced but never migrated

## What Phase 13.1 Requires

Phase 13.1 introduces 6 new normalized tables:

1. **course_addresses** (1:1 with course_details)
   - city, state, country, postalCode
   - website, phone

2. **course_coordinates** (1:1 with course_details)
   - latitude, longitude, elevation
   - Indexed for geographic queries

3. **course_specifications** (1:1 with course_details)
   - par, totalYardage, courseRating, slopeRating

4. **course_metadata** (1:1 with course_details)
   - architect, yearBuilt, courseStyle
   - Facilities: drivingRange, puttingGreen, shortGameArea

5. **playing_conditions** (1:M with course_details)
   - grassTypeFairway, grassTypeGreen, greenSize, greenSpeed
   - observedAt timestamp for historical tracking

6. **tee_hole_yardages** (many:many through tees × holes)
   - Links CourseTee → CourseHole with per-tee yardages
   - **BLOCKED**: CourseHole/CourseTee tables don't exist in migrations yet

## Critical Blockers

### 1. Missing Table Migrations

These models are defined in Prisma schema but **have no migrations**:
- `CourseHole` (should map to `course_holes` table)
- `CourseTee` (should map to `course_tees` table) 
- `TeeHoleYardage` (should map to `tee_hole_yardages` table)

The Phase 13.1 migration assumes these tables exist but they were never created.

**Fix**: Before Phase 13.1, must generate and apply migrations for:
```bash
# Step 0: Create CourseHole and CourseTee tables
pnpm prisma migrate dev --name "create_course_holes_and_tees"
```

###  2. Schema Evolution Issue

When CourseDetails was added to the schema, it was:
- Added to `prisma/schema.prisma` 
- ✗ NOT migrated to the database
- ✗ NO migration file created

When Phase 13.1 tried to run, it expected `course_details` to already exist.

**Fix**: All schema changes must include migrations:
```bash
pnpm prisma migrate dev --name "create_course_details"
```

### 3. Data Migration Complexity

Phase 13.1 migration tries to migrate denormalized columns FROM `course_details` INTO the new normalized tables:

```sql
INSERT INTO course_addresses (...)
SELECT city, state, country FROM course_details WHERE ...

ALTER TABLE course_details DROP COLUMN city, state, country;
```

This fails if:
- Columns already removed
- Columns don't exist
- Referencing tables don't exist

**Fix**: Use conditional SQL (`IF EXISTS` / `DO` blocks) to handle partial states

## Proper Implementation Path

### Phase A: Prerequisites (Foundation)

1. **Generate migrations for missing tables:**
   ```bash
   # Ensure CourseHole, CourseTee, TeeHoleYardage have migrations
   pnpm prisma migrate dev --name "create_course_holes_tees_yardages"
   ```

2. **Verify database state:**
   ```bash
   pnpm prisma db execute --stdin < verify_tables.sql
   ```

3. **Commit prerequisites:**
   ```bash
   git commit -m "chore: add missing table migrations (CourseHole, CourseTee, TeeHoleYardage)"
   ```

### Phase B: Implement Phase 13.1 Normalization

1. **Update Prisma schema** (already done in commit `bbf2f6a`)
   - Add CourseAddress, CourseCoordinates, CourseSpecifications, CourseMetadata
   - Add PlayingConditions, TeeHoleYardage  
   - Update CourseDetails to remove denormalized fields

2. **Generate the Phase 13.1 migration:**
   ```bash
   pnpm prisma migrate dev --name "normalize_golf_course_api_phase13"
   ```

3. **Enhance migration for production safety:**
   - Add `IF EXISTS` checks before data migrations
   - Use conditional blocks (`DO $$ BEGIN ... END $$;`)
   - Add `CASCADE` for foreign key drops

4. **Deploy the migration:**
   ```bash
   pnpm prisma migrate deploy  
   ```

### Phase C: Verify & Protect

1. **STEP 3: Execute Individual Queries**
   - Test each normalized table query
   - Verify row counts and data integrity
   - Check execution times

2. **STEP 4: Implement Graceful Failure** ✓ Already done
   - Database Health page has `safeCountTable()` wrapper
   - Individual table failures don't crash the page

3. **STEP 5: Add Structured Logging** ✓ Already done
   ```
   Loading CourseAddresses...
   ✓ Complete (1,247 rows in 45ms)
   ```

4. **STEP 6: Validation**
   - No console errors
   - All health cards render
   - Accurate counts

5. **STEP 7: Regression Protection**
   Add tests to `tests/system-health.test.ts`:
   ```typescript
   it('should handle missing normalized tables gracefully', async () => {
     // Drop a table, verify page still loads
     await db.execute('DROP TABLE IF EXISTS course_addresses');
     const result = await getDatabaseHealthReport();
     expect(result.tables).toHaveLength(19); // -1 for dropped table
     expect(result.overallStatus).toBeOneOf(['Degraded', 'Healthy']);
   });
   ```

## Recommended Timeline

| Phase | Task | Duration | Blocker |
|-------|------|----------|---------|
| A.1 | Generate & commit missing table migrations | 1 hour | None |
| A.2 | Verify all tables exist in staging | 30 min | Database access |
| B.1 | Update schema & regenerate migration | 30 min | A.2 |
| B.2 | Enhance migration for production safety | 1 hour | B.1 |
| B.3 | Deploy & test in staging | 2 hours | B.2 |
| C.1 | Execute all verification queries | 1 hour | B.3 |
| C.2 | Add regression tests | 1.5 hours | B.3 |
| **Total** | Phase 13.1 Complete | **7 hours** | - |

## How to Move Forward

1. **Do NOT merge Phase 13.1 to main** until all steps complete
2. **Create a feature branch**: `feature/phase-13-1-normalization`
3. **Follow the implementation path** above step-by-step
4. **Run the 7-step verification checklist** after each phase
5. **Staging/Prod deploy** only after ALL tests pass

## Success Criteria

✓ All 6 Phase 13.1 tables created and populated  
✓ Database Health page shows all tables with accurate counts  
✓ Graceful degradation works if one table is missing  
✓ No console errors or exceptions  
✓ Regression tests pass  
✓ Deployment succeeds with zero data loss  

## References

- Prisma Migrations: https://www.prisma.io/docs/orm/prisma-migrate
- Production Deployments: https://www.prisma.io/docs/orm/prisma-migrate/deployment
- Data Migrations: https://www.prisma.io/docs/orm/prisma-migrate/data-migration
