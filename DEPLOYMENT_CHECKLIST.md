# Migration Deployment Checklist

## Pre-Deployment

- ✓ Migration file created: `prisma/migrations/20260717013000_add_tournament_course_mapping/migration.sql`
- ✓ Migration is in version control (Git tracks it as new file)
- ✓ Prisma schema is valid: `npx prisma validate` ✓
- ✓ Build succeeds: `npm run build` ✓
- ✓ No application logic changes (migration only)

## Migration File Details

**File:** `prisma/migrations/20260717013000_add_tournament_course_mapping/migration.sql`

**Size:** 1,017 bytes

**Contains:**
- CREATE TABLE statement for `tournament_course_mappings`
- 1 UNIQUE constraint on `tournamentId`
- 2 regular indexes on `golfCourseApiCourseId` and `sportsDataIoCourseId`
- All 12 columns with correct types and defaults

## Local Testing (Developer)

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Apply migration to local database
npx prisma migrate dev

# 4. Verify table exists
psql -c "SELECT * FROM tournament_course_mappings LIMIT 0;" 

# 5. Test importer works
npx ts-node lib/imports/course-intelligence-import.ts
```

## Production Deployment

### Via Vercel (Automatic)

1. Merge PR to main branch
2. Vercel automatically:
   - Runs `npm run build` (succeeds ✓)
   - Deploys application
   - On app startup, runs `npx prisma migrate deploy`
   - Migration applies automatically

### Via Manual Database Update

```bash
# Connect to production database
psql <connection-string>

# Paste the SQL from migration.sql file:
-- CreateTable
CREATE TABLE "tournament_course_mappings" (
    ...
);
-- CreateIndex
CREATE UNIQUE INDEX ...
-- CreateIndex
CREATE INDEX ...
```

### Verify Deployment Success

After deployment, run:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'tournament_course_mappings'
);
-- Should return: true

-- Check indexes exist
SELECT count(*) FROM pg_indexes 
WHERE tablename = 'tournament_course_mappings';
-- Should return: 3

-- Check no rows yet (first import will populate)
SELECT COUNT(*) FROM tournament_course_mappings;
-- Should return: 0
```

## Post-Deployment

- Run first GolfCourse API import
- Verify data appears in `tournament_course_mappings` table
- Verify Course Intelligence Engine processes mappings
- Monitor logs for any SQL errors

## Rollback Plan (if needed)

```bash
# Revert the migration
npx prisma migrate resolve --rolled-back 20260717013000_add_tournament_course_mapping

# Drop the table manually if needed
DROP TABLE IF EXISTS tournament_course_mappings;
```

## No Breaking Changes

✓ This is a pure additive migration
✓ No existing tables modified
✓ No columns removed or renamed
✓ No data loss risk
✓ No downtime required
✓ Can be deployed during business hours

## Related Documentation

- Full details: `/MIGRATION_CREATED.md`
- Root cause analysis: `/TOURNAMENT_COURSE_MAPPING_ROOT_CAUSE.md`
- Importer details: `/lib/imports/course-intelligence-import.ts`
