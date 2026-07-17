# Migration Created: tournament_course_mappings Table

## Summary

A new Prisma migration has been created to add the missing `tournament_course_mappings` table required by the TournamentCourseMapping model.

## Migration Details

**File Location:** `prisma/migrations/20260717013000_add_tournament_course_mapping/migration.sql`

**Created:** 2025-07-17 at 01:30:00 UTC

**Status:** ✓ Created and staged in Git

## What This Migration Does

Creates the `tournament_course_mappings` table with all fields and indexes as defined in the Prisma schema:

### Table Structure

| Column | Type | Constraints | Default |
|--------|------|-----------|---------|
| `id` | TEXT | PRIMARY KEY | CUID |
| `tournamentId` | TEXT | UNIQUE NOT NULL | - |
| `sportsDataIoCourseId` | TEXT | Nullable | NULL |
| `golfCourseApiCourseId` | INTEGER | NOT NULL | - |
| `tournamentCourseName` | TEXT | Nullable | NULL |
| `golfCourseCourseName` | TEXT | Nullable | NULL |
| `matchConfidence` | INTEGER | Nullable | 0 |
| `matchedBy` | TEXT | Nullable | 'auto-matched' |
| `verified` | BOOLEAN | NOT NULL | false |
| `lastSyncedAt` | TIMESTAMP(3) | Nullable | NULL |
| `createdAt` | TIMESTAMP(3) | NOT NULL | CURRENT_TIMESTAMP |
| `updatedAt` | TIMESTAMP(3) | NOT NULL | auto-update |

### Indexes Created

1. `tournament_course_mappings_tournamentId_key` (UNIQUE) - Ensures one mapping per tournament
2. `tournament_course_mappings_golfCourseApiCourseId_idx` - Fast lookups by GolfCourse API ID
3. `tournament_course_mappings_sportsDataIoCourseId_idx` - Fast lookups by SportsDataIO course ID

## Git Status

The migration file is unstaged and ready to be committed:

```
new file:   prisma/migrations/20260717013000_add_tournament_course_mapping/migration.sql
```

## Deployment Steps

### Local Development

```bash
# Apply the migration to your local database
npx prisma migrate dev

# This will:
# 1. Apply the migration to your database
# 2. Regenerate Prisma client types
# 3. Sync schema.prisma with database state
```

### Production Deployment

```bash
# On your production environment during deployment
npx prisma migrate deploy

# This will:
# 1. Apply any pending migrations (including this one)
# 2. Update the _prisma_migrations tracking table
# 3. Not modify schema.prisma (already version controlled)
```

## Verification Steps

After the migration is applied, verify success:

```sql
-- Check table exists
SELECT tablename FROM pg_tables WHERE tablename = 'tournament_course_mappings';

-- Check indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'tournament_course_mappings';

-- Expected indexes: 3 (1 unique + 2 regular)
```

## What This Fixes

This migration resolves the error:
```
Invalid prisma.tournamentCourseMapping.findMany()
The table 'public.tournament_course_mappings' does not exist.
```

After this migration is applied, the GolfCourse API importer will be able to:
- Query existing tournament course mappings
- Store course mapping verification status
- Track import metadata (matched confidence, method, last sync time)
- Enable the Course Intelligence Engine to process verified mappings

## No Breaking Changes

- The migration only creates a new table
- No existing application logic is modified
- The Prisma model was already defined and waiting for this table
- All application code remains unchanged

## Related Files

- **Prisma Model:** `prisma/schema.prisma` (lines 1387-1417)
- **Importer Code:** `lib/imports/course-intelligence-import.ts` (uses this table)
- **Repository:** `lib/repositories/tournament-course-mapping-repository.ts` (CRUD operations)
