# Tournament Course Mapping Card

## Overview

The Tournament Course Mapping card is a dedicated dashboard widget in the Database Health admin panel that provides real-time visibility into the tournament course mapping workflow.

## Location

`features/admin/database-health/import-pipelines.tsx`

The card is rendered in the import pipelines grid alongside other pipeline cards, matching the existing design and layout.

## Features

### Status States

The card displays status with color-coded badges:

- **Idle** (slate) - No mapping workflow is running. Click "Start Mapping" to begin.
- **Running** (blue) - Workflow is actively processing tournaments. Shows progress bar.
- **Completed** (emerald) - Workflow finished successfully. Shows final statistics.
- **Failed** (red) - Workflow encountered errors. Shows error message and "Retry" button.

### Real-Time Progress Tracking

While the workflow is running:

- **Progress Bar**: Visual indicator showing percentage complete (based on unmapped tournaments)
- **Live Counters**: 
  - Total Evaluated: Total tournaments in the system
  - Already Mapped: Skipped (valid existing mappings)
  - Newly Mapped: Successfully created mappings
  - Failed: Count of failures
  - API Calls: Number of GolfCourseAPI requests made

- **Auto-Polling**: Fetches status every 2 seconds via `getTournamentMappingStatusAction(runId)`
- **Automatic Stop**: Polling stops when workflow completes or fails

### Completion Summary

When the workflow completes successfully:

- Displays final statistics (all counters)
- Shows total duration
- Shows API call count
- "Run Again" button available

### Error Handling

If the workflow fails:

- Error message displayed directly on the card
- Shows why it failed (e.g., "Rate limit exceeded")
- "Retry" button allows re-running the workflow
- UI does not get stuck in loading state

### Action Buttons

State-appropriate buttons:

- **Idle**: "Start Mapping" - Triggers both tournament import and mapping
- **Running**: Disabled button showing "Running" with spinner
- **Completed**: "Run Again" - Restart the workflow
- **Failed**: "Retry" - Retry the failed workflow

## Data Flow

### Starting the Workflow

1. User clicks "Start Mapping" button
2. `handleRefresh("Tournaments")` called
3. `importTournamentsAction()` runs first (imports new tournaments)
4. `startTournamentMappingAction()` triggered (starts Vercel Workflow)
5. Response returns `runId`
6. `setMappingRunId(runId)` stores the ID
7. `startMappingPolling(runId)` begins polling

### Polling for Status

1. `setInterval` calls `pollMappingStatus()` every 2 seconds
2. `getTournamentMappingStatusAction(runId)` passed to query specific run
3. Status API queries Workflow SDK's `getRun(runId)`
4. Progress data returned and displayed live
5. When status is "completed" or "failed", polling stops automatically

### Backend Integration

The card integrates with:

- **`startTournamentMappingAction()`** - Server action that calls start-workflow API
- **`getTournamentMappingStatusAction(runId)`** - Server action that queries status API
- **`/api/admin/tournament-mapping/start-workflow`** - API route that calls `start(tournamentMappingWorkflow, [])`
- **`/api/admin/tournament-mapping/status`** - API route that calls `getRun(runId)` from Workflow SDK
- **`tournamentMappingWorkflow()`** - Vercel Workflow that orchestrates the mapping process

## Styling

The card follows the existing CaddieIQ admin dashboard design:

- **Card Layout**: `Card` component with flex column layout
- **Header**: Title with status badge (color-coded)
- **Statistics**: Grid layout showing key metrics (text-sm, font-mono)
- **Progress Bar**: Blue bar showing unmapped tournament processing
- **Actions**: Buttons with appropriate states
- **Error Display**: Red background error box for failures

### Color Scheme

- **Idle**: Slate 500/15 text
- **Running**: Blue 500/15 text (matches spinner)
- **Completed**: Emerald 500/15 text
- **Failed**: Destructive red text

## Component State

```typescript
const [mappingStatus, setMappingStatus] = useState<{
  status: "in_progress" | "completed" | "failed"
  total: number
  alreadyMapped: number
  completed: number
  percentage: number
  created: number
  updated: number
  reused: number
  failed: number
  apiCallsMade: number
  totalDurationMs: number
  message: string
  runId: string
} | null>(null)

const [mappingRunId, setMappingRunId] = useState<string | null>(null)
const [isPolling, setIsPolling] = useState(false)
const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null)
```

## Key Functions

### `pollMappingStatus()`

Queries the workflow status using the stored `runId`. Stops polling when status is completed or failed.

### `startMappingPolling(runId: string)`

Initiates polling after workflow starts. Stores the run ID and begins 2-second interval polling.

### `getMappingStatusBadge()`

Returns string representation of current status for the badge.

### `handleRefresh(pipelineName: string)`

For "Tournaments" pipeline: runs import then starts mapping workflow.

## Testing

To test the card:

1. Navigate to `/admin/database-health`
2. You should see the Tournament Course Mapping card in the grid
3. Click "Start Mapping" (only available if not running)
4. Watch the progress bar update in real-time
5. When complete, view the final statistics
6. Click "Run Again" to re-run

## Error Cases

### Workflow not found

If `runId` is invalid or workflow is not found, status API returns "pending" state.

### Workflow failed

Error message displayed on card. Click "Retry" to re-run.

### Polling stopped abruptly

Component cleanup ensures interval is cleared on unmount. Reload the page to poll again.

## Future Enhancements

Possible improvements:

- Add "View Logs" button that shows workflow execution logs
- Display current activity (e.g., "Searching Augusta National GC...")
- Show rate limiting information with countdown timer
- Add filtering/sorting for which tournaments to map
- Export final mapping results
- Historical run tracking (last 5 runs, etc.)
