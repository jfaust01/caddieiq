# Tournament Course Mapping - Vercel Workflow SDK Architecture

## Overview

The tournament course mapping system is built using **Vercel Workflow SDK**, which provides officially supported, durable background execution with automatic retry, persistence, and state management.

## Why Workflow SDK?

Previous architectures (fire-and-forget, queue-based) are **not guaranteed** to execute on Vercel serverless. Workflow SDK solves this with:

✓ **Durable execution** - If the container shuts down, execution resumes automatically from the last step
✓ **Built-in retry** - Failures are retried with exponential backoff
✓ **State persistence** - Workflow state survives container restarts
✓ **No additional services** - Built into Vercel, no external job queue needed
✓ **Observability** - World API provides real-time progress tracking

## Architecture

### 1. Workflow Definition
**File:** `lib/workflows/tournament-mapping-workflow.ts`

```typescript
"use workflow";  // Makes it durable

export async function tournamentMappingWorkflow(): Promise<MappingProgress> {
  // Orchestrates the overall mapping process
  // Step functions are called within this workflow context
}
```

**Key features:**
- Top-level `"use workflow"` directive enables durability
- Calls step functions for all Node.js operations
- Returns `MappingProgress` data with results
- Automatically retries on transient failures

### 2. Step Functions

Steps have **full Node.js/Prisma access** and automatic retry:

```typescript
async function fetchTournamentCourses() {
  "use step";  // Full Node.js access
  return await prisma.tournamentCourse.findMany({ ... });
}

async function processSingleCourseMapping(courseData, index, total) {
  "use step";  // Can use Prisma, HTTP, GolfCourseAPI, etc.
  // Process one tournament course mapping
  // Handles rate limiting, retries, errors
}
```

**Benefits:**
- No sandbox restrictions (Workflow sandbox only applies to workflow function itself)
- Results automatically persisted
- Failures trigger retry logic
- Rate limiting handled with `sleep()` from workflow SDK

### 3. Workflow Startup

**File:** `app/api/admin/tournament-mapping/start-workflow/route.ts`

```typescript
const run = await start(tournamentMappingWorkflow, []);  // Returns immediately
return Response.json({ runId: run.runId }, { status: 202 });
```

**What happens:**
1. `start()` queues the workflow and returns 202 immediately
2. HTTP response is sent to client (browser stops spinning)
3. Workflow execution continues **independently** and **durably**
4. No connection to browser needed - workflow persists in Vercel infrastructure

### 4. Status Polling

**File:** `app/api/admin/tournament-mapping/status/route.ts`

Uses **World API** to query the running workflow state:

```typescript
const world = await getWorld();
const runs = await world.runs.list({ pagination: { cursor: undefined } });
const mappingRun = runs?.find(run => run.name?.includes("tournamentMappingWorkflow"));
const fullRun = await world.runs.get(mappingRun.id, { resolveData: "all" });
```

Returns current progress: `{ status, total, completed, percentage, ... }`

**Frontend polls every 2 seconds** via `getTournamentMappingStatusAction()`

## Data Flow

```
Frontend (import-pipelines.tsx)
  │
  ├─ Click "Refresh"
  │    ↓
  ├─ importTournamentsAction()      [1-2 seconds]
  │    │ (tournament import only)
  │    └─ Returns immediately
  │
  ├─ startTournamentMappingAction()
  │    │
  │    └─ POST /api/tournament-mapping/start-workflow
  │         │
  │         └─ start(tournamentMappingWorkflow)
  │              └─ Returns 202 ✓ [Browser spinner stops]
  │
  └─ Poll GET /api/tournament-mapping/status
       │ (every 2 seconds)
       │
       └─ getWorld().runs.get(runId)
            └─ Returns progress: { status, completed/total, ... }
```

## Execution Timeline

| Time | Component | Action | Browser |
|------|-----------|--------|---------|
| T=0s | Browser | Click "Refresh" | Spinner on |
| T=1s | Tournament Import | Completes | - |
| T=1s | Mapping Workflow | Started via `start()` | - |
| T=1.5s | API Route | Returns 202 | **Spinner off** ✓ |
| T=2s | Frontend | Start polling for progress | Shows progress bar |
| T=2s | Workflow | Fetching courses (background) | - |
| T=5s | Workflow Step | Processing course 1 of 43 | Progress: 1/43 (2%) |
| T=10s | Workflow Step | Processing course 5 of 43 | Progress: 5/43 (12%) |
| ... | Workflow | Processing continues | Progress updates live |
| T=120s | Workflow | Completes | Progress: 43/43 (100%) |
| T=121s | Frontend | Polling detects completion | Shows final results |

**Key insight:** The entire browser interaction completes in ~1.5 seconds, while the actual mapping continues for 2+ minutes in the background.

## Comparison: Before vs After

### Before (Broken)
```
Browser → Server Action (blocks)
  → runTournamentImport() [1-2s]
  → await orchestrateTournamentCourseMapping() [120s] ← BLOCKS HERE
  → Eventually timeout or response
Browser frozen for 120+ seconds ✗
```

### After (Correct)
```
Browser → Server Action → API Route → start() → Return 202 [~1.5s]
Browser freed ✓

Meanwhile (background):
Workflow → Step 1 → Step 2 → ... → Step 43 [120s]
Survives restarts, automatically retried on failure ✓
```

## Handling Rate Limiting

When GolfCourseAPI returns 429:

```typescript
try {
  const searchResults = await client.searchCourses(course.name);
} catch (apiError) {
  if (apiError.statusCode === 429) {
    rateLimited = true;  // Signal to wait
  }
}

// In workflow: if rate limited, sleep before next iteration
if (result.rateLimited) {
  await sleep("5s");  // Workflow-native sleep, not setTimeout
}
```

The `sleep()` pauses the workflow gracefully - no spinning, no threads, fully managed by Workflow SDK.

## Verifying It Works

1. **Start mapping:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/tournament-mapping/start-workflow
   # Returns: { runId: "..." }
   ```

2. **Check status:**
   ```bash
   curl http://localhost:3000/api/admin/tournament-mapping/status
   # Returns: { status: "in_progress", completed: 12, total: 43, percentage: 28 }
   ```

3. **View workflow runs (CLI):**
   ```bash
   npx workflow inspect runs
   ```

4. **View specific run:**
   ```bash
   npx workflow web <run_id>
   ```

## Production Deployment

On Vercel:
- Workflow SDK automatically connects to Vercel infrastructure
- No environment variables needed (uses VERCEL_URL automatically)
- Runs are persisted across deployments
- In-progress workflows continue if you deploy mid-run

## Files Modified

- `features/admin/database-health/actions/import-tournaments.ts` - Only runs tournament import
- `features/admin/database-health/actions/start-tournament-mapping.ts` - Calls workflow API route
- `features/admin/database-health/actions/get-tournament-mapping-status.ts` - Calls status API route
- `features/admin/database-health/import-pipelines.tsx` - Added polling for workflow status

## Files Created

- `lib/workflows/tournament-mapping-workflow.ts` - Durable workflow with steps
- `app/api/admin/tournament-mapping/start-workflow/route.ts` - Starts workflow
- `app/api/admin/tournament-mapping/status/route.ts` - Returns workflow status via World API

## Error Handling

**FatalError** (permanent failures):
```typescript
throw new FatalError("Invalid tournament ID");  // Workflow terminates
```

**RetryableError** (transient failures):
```typescript
throw new RetryableError("API timeout", { retryAfter: "5m" });  // Auto-retry
```

**Runtime errors in steps:**
- Caught by try/catch in workflow
- Logged but don't terminate the entire workflow
- Processing continues with next tournament

## Limitations & Considerations

- **Max workflow duration:** ~1 hour (Vercel serverless limit)
- **Step timeout:** 30 seconds per step (can split long operations)
- **Serialization:** Only pass serializable data between workflow/steps (no functions, no circular refs)
- **Rate limiting:** Implement with `sleep()` from workflow SDK, not `setTimeout`

## Testing Locally

```bash
# Start dev server
npm run dev

# In another terminal: start workflow web UI
npx workflow web

# Trigger workflow via browser UI
# Watch it execute in the web UI
```

---

This architecture is **officially supported by Vercel** and provides guaranteed execution with automatic durability.
