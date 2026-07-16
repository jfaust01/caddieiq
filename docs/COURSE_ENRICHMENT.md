# Course Intelligence Enrichment

## Overview

The course enrichment pipeline generates `CourseCharacteristic` records from verified Course data. This enrichment:

- Runs idempotently (safe to run repeatedly without duplicates)
- Derives course style, importance weights, and other analytics
- Follows the "Unknown stays unknown" principle — never fabricates values
- Is now executable from both CLI scripts and admin dashboard

## Architecture

The enrichment logic has been extracted into a shared service that is called by:

1. **CLI Script** (`scripts/enrich-course-characteristics.mts`) — for local development and scheduled batch jobs
2. **Admin Action** (`features/admin/database-health/actions/rebuild-course-intelligence.ts`) — for on-demand rebuilds via the dashboard

Both paths use the same underlying service: `lib/services/course-enrichment-service.ts`

## Files

### Service Layer
- **`lib/services/course-enrichment-service.ts`** — Core enrichment logic, reusable by script and admin
  - `enrichCourseCharacteristicsTable(prisma, options)` — Main function
  - Supports progress callbacks for real-time updates
  - Handles batching and error reporting

### Admin Dashboard
- **`features/admin/database-health/rebuild-course-intelligence.tsx`** — UI component with rebuild button and stats
- **`features/admin/database-health/actions/rebuild-course-intelligence.ts`** — Server action with auth guard
- **`features/admin/database-health/database-health-view.tsx`** — Updated to include rebuild section

### CLI Script
- **`scripts/enrich-course-characteristics.mts`** — Refactored to use the shared service

## Usage

### Local Development (CLI)

```bash
# Run enrichment (persists to database)
npx tsx scripts/enrich-course-characteristics.mts

# Dry run (preview without persisting)
npx tsx scripts/enrich-course-characteristics.mts --dry-run

# Verbose logging
npx tsx scripts/enrich-course-characteristics.mts --verbose
```

### Admin Dashboard

1. Navigate to **Admin** → **Database Health**
2. Scroll to **Administrative Actions** section
3. Click **Start Rebuild** button
4. View progress and stats in real-time
5. See counts of:
   - Total courses processed
   - Characteristics created
   - Characteristics updated
   - Any errors encountered

## Implementation Details

### Shared Service

The service exposes:

```typescript
enrichCourseCharacteristicsTable(
  prisma: PrismaClient,
  options?: {
    dryRun?: boolean
    verbose?: boolean
    onProgress?: (progress: EnrichmentProgress) => void
  }
): Promise<EnrichmentStats>
```

Returns:
```typescript
{
  totalCourses: number
  enrichedCount: number
  skippedCount: number
  createdCount: number
  updatedCount: number
  errors: Array<{ courseId: string; error: string }>
}
```

### Progress Streaming

The admin component receives real-time updates via the progress callback, enabling live dashboards and status reporting.

### Batching

- Characteristics are processed in batches of 500 courses
- Each batch is upserted separately, allowing partial success
- Errors are collected and reported without stopping the pipeline

## Security

- Admin action requires authentication and admin role
- CLI script is unrestricted (for local dev/deployment scripts)
- All database access is parameterized

## Verification

After running enrichment, verify population:

```sql
SELECT COUNT(*) FROM course_characteristics;
SELECT * FROM course_characteristics LIMIT 5;
```

The `course_characteristics` table should contain one row per course with derived values like `drivingImportance`, `style`, and other computed fields.

## Next Steps

The service is production-ready. Potential enhancements:

- Add endpoint for scheduled/recurring enrichment
- Integrate with data platform monitoring
- Add database triggers for automatic enrichment on course updates
- Expose enrichment history and audit logs
