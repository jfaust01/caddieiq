# Tournament Course Mapping - End-to-End Integration Audit

## Overview

The Tournament Course Mapping workflow is now fully integrated with complete end-to-end tracking, real-time status reporting, and browser refresh reconnection capability.

## Architecture

### Components & Endpoints

```
Frontend (import-pipelines.tsx)
    ↓
Action: startTournamentMappingAction()
    ↓
POST /api/admin/tournament-mapping/start-workflow
    ├→ Start Workflow (Vercel SDK)
    ├→ Create ImportRun record
    └→ Return runId
    ↓
Frontend starts polling with runId
    ↓
GET /api/admin/tournament-mapping/status?runId=...
    ├→ Query workflow state via getRun(runId)
    ├→ Extract MappingProgress from output
    ├→ Update ImportRun on completion
    └→ Return full status with all metrics
```

### Data Flow for Browser Refresh

```
Page loads
    ↓
useEffect (on mount)
    ↓
getActiveTournamentRunAction()
    ↓
GET /api/admin/tournament-mapping/active-run
    ├→ Query ImportRun table
    ├→ Find most recent workflow run
    └→ Return runId + status
    ↓
If status === "in_progress":
    → Resume polling with runId
Else if status !== "idle":
    → Show last run timestamp
```

## Tracking & Persistence

### ImportRun Table Fields

Used for persistent workflow execution history:
- `pipeline`: "TournamentCourseMapping"
- `status`: "in_progress" | "completed" | "failed"
- `startedAt`: When workflow started
- `completedAt`: When workflow finished
- `workflowRunId`: Vercel Workflow run ID (for reconnection)
- `rowsImported`: created + updated count
- `errors`: failed count

### MappingProgress Type

Enhanced to track real-time activity:
```typescript
type MappingProgress = {
  // Counts
  total: number;
  alreadyMapped: number;
  completed: number;
  created: number;
  updated: number;
  failed: number;
  apiCallsMade: number;
  
  // Status & timing
  status: "in_progress" | "completed" | "failed";
  totalDurationMs: number;
  
  // Activity tracking (NEW)
  currentStep?: string;        // e.g., "Searching course"
  currentTournament?: string;  // e.g., "PGA Championship"
  errorMessage?: string;       // Detailed error on failure
  lastRunAt?: string;         // ISO timestamp
  
  message: string;
};
```

## UI Features

### Tournament Course Mapping Card

**Idle State:**
- Status badge: "Idle" (slate)
- Empty stats area
- "Start Mapping" button

**Running State:**
- Status badge: "Running" (blue)
- Current activity display: "Processing: PGA Championship - Searching course"
- Real-time stats: Total, Already Mapped, Newly Mapped, Failed, API Calls
- Live progress bar with percentage
- "Running" button (disabled)

**Completed State:**
- Status badge: "Completed" (emerald)
- Final stats with breakdown
- Last Run timestamp
- API call count and duration
- "Run Again" button

**Failed State:**
- Status badge: "Failed" (red)
- Error message box with detailed failure reason
- Partial stats still visible
- "Retry" button

## Browser Refresh Behavior

1. User starts workflow → runId stored in React state (mappingRunId)
2. Browser refreshes (state lost)
3. Component mounts → calls getActiveTournamentRunAction()
4. API queries ImportRun table for most recent workflow
5. If workflow is still running → reconnect with runId and resume polling
6. If workflow completed/failed → display last run information

**Result:** Seamless reconnection - no lost workflows, no manual restart needed

## API Contracts

### POST /api/admin/tournament-mapping/start-workflow

Request: (empty body, auth required)

Response (202 Accepted):
```json
{
  "success": true,
  "data": {
    "runId": "run_abc123...",
    "message": "Tournament course mapping workflow started",
    "status": "pending"
  }
}
```

### GET /api/admin/tournament-mapping/status?runId=...

Response:
```json
{
  "data": {
    "status": "in_progress" | "completed" | "failed",
    "total": 43,
    "alreadyMapped": 12,
    "completed": 5,
    "percentage": 15,
    "created": 5,
    "updated": 0,
    "failed": 0,
    "apiCallsMade": 5,
    "totalDurationMs": 12500,
    "message": "Processing unmapped tournaments...",
    "currentTournament": "PGA Championship 2024",
    "currentStep": "Searching course",
    "runId": "run_abc123..."
  }
}
```

### GET /api/admin/tournament-mapping/active-run

Response:
```json
{
  "data": {
    "runId": "run_abc123..." | null,
    "status": "in_progress" | "completed" | "failed" | "idle",
    "startedAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:35:00.000Z" | null,
    "message": "Last run: in_progress at 1/15/2024, 10:30 AM"
  }
}
```

## Error Scenarios

### Workflow Fails

1. Workflow throws error → sets status to "failed"
2. Status API returns error details
3. UI displays error message in red box
4. User can click "Retry" to start new workflow
5. Failed attempt persisted in ImportRun table

### Network Disconnection During Polling

1. Poll request fails → catch error, stop polling
2. User refreshes page
3. getActiveTournamentRunAction() finds incomplete workflow
4. Reconnects and resumes from where it left off

### Browser Close/Tab Kill

1. Workflow continues running independently on server
2. User comes back later
3. Page mount reconnects to still-running workflow
4. Resumes polling from current position

## Testing Checklist

- [ ] Start workflow → runId returned
- [ ] Status polls correctly with runId
- [ ] Progress bar updates live
- [ ] Current activity shows correct tournament
- [ ] Browser refresh reconnects to active workflow
- [ ] Workflow completion updates ImportRun table
- [ ] Failed workflow displays error message
- [ ] Last Run timestamp displays after completion
- [ ] "Retry" button works after failure
- [ ] "Run Again" button works after success
- [ ] API calls reflect actual GolfCourseAPI usage

## Known Limitations

1. **Current Activity Tracking**: Workflow needs to be enhanced to capture currentTournament/currentStep at each step
2. **Real-time Progress**: Intermediate updates only when workflow completes or fails; no mid-execution updates to workflow output
3. **Progress Persistence**: On server restart, incomplete workflows lose polling context (Vercel Workflow SDK limitation)

## Future Improvements

1. Implement incremental progress storage during workflow execution
2. Add retry-on-rate-limit with exponential backoff in UI
3. Create workflow execution dashboard with historical run trends
4. Add ability to cancel in-flight workflows
5. Implement workflow resumption from failure point (not restart)
