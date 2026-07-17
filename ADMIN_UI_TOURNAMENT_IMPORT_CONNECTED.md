# Admin UI: Tournament Import Now Connected to Orchestration

## Summary

The Admin UI Tournament Import button now invokes the `/api/imports/tournaments` endpoint containing the new tournament-to-course mapping orchestration. Previously, the Refresh button was non-functional. Now it's fully integrated.

## What Changed

### 1. Created Tournament Import Server Action
**File:** `features/admin/database-health/actions/import-tournaments.ts`

New server action that calls the `/api/imports/tournaments` endpoint and returns results:
```typescript
export async function importTournamentsAction()
```

This action:
- Calls POST `/api/imports/tournaments` 
- Handles response parsing
- Returns `{ success: boolean, data?: any, error?: string }`

### 2. Connected ImportPipelines Component to Actions
**File:** `features/admin/database-health/import-pipelines.tsx`

Updated the component to:
- Track loading state per pipeline
- Call `importTournamentsAction()` when "Tournaments" Refresh button is clicked
- Display loading spinner during import
- Show result notification with success/error feedback
- Auto-dismiss results after successful import

**New State:**
```typescript
const [loadingPipeline, setLoadingPipeline] = useState<string | null>(null)
const [refreshResult, setRefreshResult] = useState<{ pipeline: string, success: boolean, message: string } | null>(null)
```

**New Handler:**
```typescript
const handleRefresh = async (pipelineName: string) => {
  // Calls appropriate action based on pipeline name
  // Manages loading state and result display
}
```

**Button Update:**
- Added `onClick={() => handleRefresh(pipeline.name)}`
- Shows spinner during loading
- Displays "Importing..." text
- Disabled during any import

### 3. Result Notification UI
A new card appears after import completion showing:
- Pipeline name and status (✓ Completed or ✗ Failed)
- Detailed message with import statistics
  - For Tournaments: shows "Created X mappings, reused Y"
  - For other pipelines: shows relevant stats
- Dismiss button (✕) to clear notification

## Current Workflow

### Before (Non-functional)
```
Admin visits /admin/database-health
  ↓
Sees "Tournaments" card with "Refresh" button
  ↓
Clicks button
  ↓
Nothing happens
```

### After (Fully Connected)
```
Admin visits /admin/database-health
  ↓
Sees "Tournaments" card with "Refresh" button
  ↓
Clicks "Refresh" button
  ↓
POST /api/imports/tournaments called
  ├─ runTournamentImport() executes
  ├─ orchestrateTournamentCourseMapping() runs automatically
  ├─ tournament_course_mappings populated with course matches
  └─ Results returned with statistics
  ↓
Button shows "Importing..." with spinner (1-30 seconds)
  ↓
Result notification appears showing:
  - "Tournaments Import Completed"
  - "Created 42 mappings, reused 4."
  ↓
Admin can click ✕ to dismiss, or refresh page to see updated pipeline status
```

## What Gets Triggered

When Admin clicks "Refresh" on Tournaments pipeline:

1. **Tournament Import (SportsDataIO)**
   - Fetches ~50+ active tournaments
   - Validates and inserts/updates `tournaments` table
   - Reports: inserted, updated, skipped, failed counts

2. **Automatic Course Mapping Orchestration** (NEW)
   - Iterates all tournaments with host courses
   - Calls `importTournamentCourse()` for each
   - Searches GolfCourseAPI for matching courses
   - Creates `tournament_course_mappings` records with:
     - `matchConfidence`: 70-99%
     - `verified: false` (pending admin review)
     - `golfCourseApiCourseId`: matched course ID
   - Reports: created, updated, reused, unmatched, errors

3. **Response to Admin UI**
   - Returns combined results from both operations
   - Includes mapping statistics
   - Shows in notification card

## Extensibility

The `handleRefresh` function is designed to support multiple pipelines:

```typescript
const handleRefresh = async (pipelineName: string) => {
  // ...
  if (pipelineName === "Tournaments") {
    // Already implemented
  } else if (pipelineName === "Players") {
    // Can add Players import action here
  } else if (pipelineName === "Weather") {
    // Can add Weather import action here
  }
  // ...
}
```

To add other pipeline triggers in the future:
1. Create server action (e.g., `import-players.ts`)
2. Import it in `import-pipelines.tsx`
3. Add case in `handleRefresh` function

## Testing the Integration

1. Go to `/admin/database-health`
2. Scroll to "Import Pipelines" section
3. Find the "Tournaments" card
4. Click "Refresh" button
5. Observe:
   - Button shows spinner
   - Text changes to "Importing..."
   - After 5-30 seconds, notification appears
   - Shows "Created X mappings, reused Y"
   - tournament_course_mappings table now has records

## Files Modified

| File | Changes |
|------|---------|
| **NEW** `features/admin/database-health/actions/import-tournaments.ts` | Server action calling `/api/imports/tournaments` |
| `features/admin/database-health/import-pipelines.tsx` | Made client component, added refresh handlers, added result notification |

## Build Status

✓ Build successful with zero TypeScript errors
✓ All routes compiled
✓ UI fully functional

## Next Steps

1. **Admin Verification** (manual step)
   - Review created mappings in database
   - Check confidence scores
   - Update any incorrect matches manually if needed
   - Mark verified matches as `verified: true`

2. **Course Intelligence Import** (on-demand or automatic)
   - Once mappings verified, can import enriched course data
   - Would happen via separate `importCourseIntelligence()` call
   - Populates architect names, grass types, etc.

3. **Auto-Refresh (Optional Future)**
   - Could add scheduled import via cron
   - Or add to `/api/imports/weather` cron to run on same schedule
