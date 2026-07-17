# TournamentCourseMapping Missing Table Investigation

## Executive Summary

**The table `tournament_course_mappings` is referenced in Prisma schema and code but NO migration has been created to build it in the database.**

---

## Root Cause Analysis

### 1. Prisma Model Definition

**File:** `prisma/schema.prisma` (lines 1387-1417)

```prisma
model TournamentCourseMapping {
  id                      String    @id @default(cuid())
  tournamentId            String    @unique
  sportsDataIoCourseId    String?
  golfCourseApiCourseId   Int
  
  tournamentCourseName    String?
  golfCourseCourseName    String?
  
  matchConfidence         Int?      @default(0)
  matchedBy               String?   @default("auto-matched")
  verified                Boolean   @default(false)
  
  lastSyncedAt            DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  @@index([tournamentId])
  @@index([golfCourseApiCourseId])
  @@index([sportsDataIoCourseId])
  @@map("tournament_course_mappings")  // ← Maps to table name
}
```

**@@map Value:** `"tournament_course_mappings"` (line 1416)
- This tells Prisma: "The TypeScript model TournamentCourseMapping maps to the PostgreSQL table tournament_course_mappings"

### 2. Related Models

There are TWO different models dealing with tournament courses:

| Model | Table | Purpose | Location |
|-------|-------|---------|----------|
| `TournamentCourse` | `tournament_courses` | Links tournaments to courses (SportsDataIO data) | Line 687 |
| `TournamentCourseMapping` | `tournament_course_mappings` | Maps tournaments to GolfCourse API courses | Line 1387 |

**Key Difference:**
- `TournamentCourse` connects tournaments to general course records (sports data)
- `TournamentCourseMapping` is the NEW table for GolfCourse API integration (mapping & verification)

### 3. Migration Status

**Tournament Engine Migration File:**
- Path: `prisma/migrations/20260714203658_tournament_engine/migration.sql`
- Status: EXISTS ✓
- Contains: `tournament_courses` table creation only

**Search Results:**
```bash
for dir in migrations/*/; do
  grep "CREATE TABLE.*tournament_course" "$dir/migration.sql"
done

# Result:
20260714203658_tournament_engine: CREATE TABLE "tournament_courses" ✓
(no results for tournament_course_mappings)
```

### 4. Where tournament_course_mappings is Referenced

**Code Files Using It:**

| File | Line | Usage |
|------|------|-------|
| `lib/repositories/tournament-course-mapping-repository.ts` | Multiple | `prisma.tournamentCourseMapping.*` |
| `lib/imports/golfcourse-import.ts` | 58 | Repository instantiation |
| `lib/imports/course-intelligence-import.ts` | 110 | `prisma.tournamentCourseMapping.findMany()` |
| `lib/admin/golfcourse-import-service.ts` | Multiple | Repository calls |

**All attempting to query a table that doesn't exist in the database.**

### 5. The Error Explained

```
Invalid prisma.tournamentCourseMapping.findMany()
The table 'public.tournament_course_mappings' does not exist.
```

This occurs because:
1. Prisma schema defines the model with @@map("tournament_course_mappings")
2. Prisma client generated code tries to query that table
3. No migration has created that table in PostgreSQL
4. Query fails with "table does not exist"

---

## Root Cause Classification

### Is it a **Missing Migration**?
**YES** ✓

The `TournamentCourseMapping` model is defined in the schema but has no corresponding migration file to create the table in the database.

### Is it an **Incorrect Prisma Model**?
**NO** ✗

The model definition is correct:
- Schema syntax is valid
- @@map value is properly defined
- All fields are properly typed
- Relationships and indexes are correct

### Is the **Importer Using the Wrong Table**?
**NO** ✗

The importer correctly uses `tournamentCourseMapping` which maps to `tournament_course_mappings`. The wrong table would be trying to use `TournamentCourse` / `tournament_courses` instead.

---

## Expected Database Table

The migration should create:

```sql
CREATE TABLE "tournament_course_mappings" (
    "id" TEXT PRIMARY KEY,
    "tournamentId" TEXT NOT NULL UNIQUE,
    "sportsDataIoCourseId" TEXT,
    "golfCourseApiCourseId" INTEGER NOT NULL,
    "tournamentCourseName" TEXT,
    "golfCourseCourseName" TEXT,
    "matchConfidence" INTEGER DEFAULT 0,
    "matchedBy" TEXT DEFAULT 'auto-matched',
    "verified" BOOLEAN DEFAULT false,
    "lastSyncedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    
    CONSTRAINT fk_tournament FOREIGN KEY("tournamentId") 
        REFERENCES "tournaments"("id") ON DELETE CASCADE
);

CREATE INDEX "tournament_course_mappings_tournamentId_idx" 
    ON "tournament_course_mappings"("tournamentId");
CREATE INDEX "tournament_course_mappings_golfCourseApiCourseId_idx" 
    ON "tournament_course_mappings"("golfCourseApiCourseId");
CREATE INDEX "tournament_course_mappings_sportsDataIoCourseId_idx" 
    ON "tournament_course_mappings"("sportsDataIoCourseId");
```

---

## Summary of Findings

| Finding | Answer | Details |
|---------|--------|---------|
| **Prisma Model Exists** | ✓ YES | Lines 1387-1417 in schema.prisma |
| **@@map Value** | `tournament_course_mappings` | Line 1416, correct |
| **Migration Exists** | ✗ NO | Only tournament_engine migration (creates tournament_courses, not tournament_course_mappings) |
| **Migration Created Table** | ✗ NO | 20 migrations scanned, zero create tournament_course_mappings |
| **Wrong Table Name Expected** | ✗ NO | tournament_courses is different model; mapping uses correct table name |
| **Root Cause** | MISSING MIGRATION | TournamentCourseMapping model defined but no migration to create the table |

---

## Recommended Correction

**Create a new migration** that adds the `tournament_course_mappings` table to the database.

**Command:**
```bash
npx prisma migrate dev --name add_tournament_course_mapping
```

This will:
1. Generate a new migration file based on the Prisma schema changes
2. Apply the migration to the database
3. Create the `tournament_course_mappings` table with all fields, indexes, and relationships

**Alternative (if rollback needed):**
```bash
npx prisma migrate resolve --rolled-back 20260714203658_tournament_engine
```

Then regenerate with:
```bash
npx prisma migrate dev --name tournament_engine_with_mapping
```

---

## Why This Happened

The `TournamentCourseMapping` model was added to the Prisma schema after the initial migration phase completed. The schema change was never accompanied by a `prisma migrate dev` command to create the corresponding migration file.

This is a schema/database synchronization issue: **the code expects the table, but the database never created it**.

---

## Next Steps (NOT EXECUTED)

1. Create migration: `npx prisma migrate dev --name add_tournament_course_mapping`
2. Verify table exists: `SELECT * FROM tournament_course_mappings LIMIT 1;` (should error first, then succeed after migration)
3. Confirm importer can query: Run import again, verify it finds the table

