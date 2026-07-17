# Incremental Tournament Course Mapping Workflow

## Overview

The tournament course mapping workflow is now **incremental and efficient**. It only processes tournaments that require mapping, skips already-valid mappings, and is designed to resume automatically if interrupted.

## Key Improvements

### 1. Only Process What's Needed

**Before:** Every execution queried all tournaments and checked each one.
**After:** Only tournaments without valid mappings are processed.

A tournament requires mapping if:
- No `TournamentCourseMapping` record exists, OR
- The existing mapping is not verified (`verified: false`), OR
- A manual "force remap" flag is set

### 2. Skip Valid Mappings

Tournaments with verified, valid mappings are skipped entirely—**no GolfCourseAPI calls** are made for them.

**Expected behavior after first run:**
- Initial run: 43 tournaments processed, ~43 API calls
- Subsequent runs: 0-3 tournaments processed (only new imports), ~0-3 API calls

### 3. Persist Progress After Every Mapping

After each successful mapping, `lastSyncedAt` is updated in the database. This enables resumability:
- If the workflow is interrupted, it resumes from the remaining unmapped tournaments
- Completed mappings are never reprocessed

### 4. Handle Rate Limiting Properly

When GolfCourseAPI returns HTTP 429 (Too Many Requests):
- **Workflow respects the `Retry-After` header** if present
- Falls back to exponential backoff if header is missing
- Automatically sleeps and retries without losing progress

Example log output:
```
[v0] Rate limited. Sleeping for 5000ms...
```

### 5. Comprehensive Progress Tracking

The workflow returns detailed metrics:

```typescript
{
  total: 43,                  // All tournaments evaluated (new + already mapped)
  alreadyMapped: 35,          // Tournaments with verified mappings (skipped)
  completed: 8,               // Unmapped tournaments processed this run
  created: 5,                 // New mappings created
  updated: 3,                 // Existing mappings updated
  reused: 0,                  // Mappings reused without API call
  failed: 0,                  // Mapping failures
  apiCallsMade: 8,            // Total GolfCourseAPI calls
  totalDurationMs: 12450,     // Total execution time
  status: "completed",
  message: "Processed 8/8 unmapped tournaments..."
}
```

## Structured Logging

Each stage of processing is logged for observability:

### Stage 1: Fetch Unmapped Tournaments
```
[v0] Fetching tournaments that require mapping...
[v0] Found 8 unmapped tournaments, 35 already mapped
[v0] Query: Fetch unmapped tournaments
```

### Stage 2: Process Each Tournament
```
[v0] STAGE: Fetch unmapped tournaments [1/8] Workday Charity Open
[v0] STAGE: Skip existing mapping [1/8] Tournament Name (if reused)
[v0] STAGE: Search GolfCourseAPI [1/8] Silverado Resort
[v0] STAGE: Mapping created/updated [1/8] Workday Charity Open
```

### Stage 3: Rate Limiting
```
[v0] STAGE: Retry after 429 [3/8] World Golf Championships - Sleeping 5000ms
```

## Resumability

The workflow is **durable** (powered by Vercel Workflow SDK) and **incremental** (persists progress):

1. **Interrupted mid-run?** On restart, only remaining unmapped tournaments are processed
2. **Rate limited?** Workflow sleeps and automatically resumes
3. **Container restarted?** Workflow state is persisted; execution continues from last checkpoint

## Database Schema

No schema changes required. Existing fields are used:

- `verified: Boolean` - Indicates if mapping is valid (admin-approved)
- `lastSyncedAt: DateTime` - Tracks when mapping was last updated (enables resumability)

## Frontend Display

The import pipelines component shows real-time progress:

```
Course Mapping in Progress

Processing: 3/8 (37%)
[████████░░░░░░░░░░░░░░░]

Already Mapped:  35
Newly Mapped:    3
Updated:         0
Failed:          0
```

When complete, final metrics are displayed:
```
Course Mapping Complete

Already Mapped:  35
Newly Mapped:    8
Updated:         0
Failed:          0
```

## API Calls Optimization

### First Run (New Database)
- 43 tournaments processed
- 43 API calls to GolfCourseAPI

### Second Run (After Initial Mapping)
- 0 tournaments processed (all verified)
- 0 API calls

### Adding New Tournaments
- Only new tournaments are processed
- API calls = number of newly imported tournaments

**Result:** Massive reduction in redundant API calls after initial setup.

## Configuration

No environment variables or configuration changes needed. The workflow uses:
- `GOLFCOURSE_API_KEY` - Already configured in project

## Monitoring

Use Vercel Workflow SDK CLI to inspect runs:

```bash
# View current run
npx workflow web <run_id>

# List all mapping workflow runs
npx workflow inspect runs --backend vercel

# Get detailed run info
npx workflow inspect run <run_id> --backend vercel
```

## Error Handling

If a single tournament mapping fails:
- Error is logged with the tournament name
- Workflow continues processing remaining tournaments
- Failed tournaments are counted in the summary
- On next run, failed mappings can be retried

## Future Enhancements

1. **Force Remap Flag** - Add column to allow manual remapping of specific tournaments
2. **Batch Retry** - Group failed mappings for bulk retry
3. **API Call Optimization** - Cache successful searches to reduce requests
4. **Manual Verification UI** - Admin dashboard to mark mappings as verified
