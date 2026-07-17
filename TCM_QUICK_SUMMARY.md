# TournamentCourseMapping - Quick Summary

## The Problem
```
Error: The table 'public.tournament_course_mappings' does not exist.
```

## Root Cause: MISSING MIGRATION

| Item | Status | Details |
|------|--------|---------|
| **1. Prisma Model** | ✓ DEFINED | `prisma/schema.prisma` line 1387 |
| **2. @@map Value** | ✓ CORRECT | `@@map("tournament_course_mappings")` at line 1416 |
| **3. Migration File** | ✗ MISSING | No migration creates this table |
| **4. Database Table** | ✗ DOES NOT EXIST | Result: query fails |

## Evidence

**Prisma Schema (✓ exists):**
```prisma
model TournamentCourseMapping {
  // ... fields ...
  @@map("tournament_course_mappings")  // ← Correct table name
}
```

**Tournament Engine Migration (✓ exists):**
- File: `prisma/migrations/20260714203658_tournament_engine/migration.sql`
- Content: Creates `tournament_courses` table ONLY
- Status: Tournament_course_mappings NOT created

**Migration Search Result:**
```bash
grep -r "tournament_course_mappings" prisma/migrations/
# No output - table creation not found in ANY migration
```

**Code Attempting Query (✓ exists):**
```typescript
const allMappingsRaw = await prisma.tournamentCourseMapping.findMany()
// Fails because table doesn't exist
```

## The Two Tournament Models

| Model | Table | Migration | Purpose |
|-------|-------|-----------|---------|
| `TournamentCourse` | `tournament_courses` | ✓ Created in tournament_engine | SportsDataIO courses |
| `TournamentCourseMapping` | `tournament_course_mappings` | ✗ MISSING | GolfCourse API mapping |

## Root Cause Determination

- **Missing Migration?** ✓ YES - This is the problem
- **Incorrect Prisma Model?** ✗ NO - Model is correct
- **Wrong Table Name?** ✗ NO - Using tournament_course_mappings correctly

## Recommended Correction

Run Prisma migration to create the missing table:

```bash
npx prisma migrate dev --name add_tournament_course_mapping
```

This will:
- Generate migration from schema definition
- Create `tournament_course_mappings` table
- Add indexes and relationships
- Apply to database

## Full Details

See: `TOURNAMENT_COURSE_MAPPING_ROOT_CAUSE.md`
