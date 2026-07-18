# Historical Results Import — Request Lifecycle Audit

## Issue

The import button enters "Importing..." state but never exits, even though data is successfully written to the database.

## Complete Request Lifecycle

### Step 1: Frontend User Clicks Button

**File:** `features/admin/database-health/import-historical-results.tsx`

**Code:**
```tsx
async function handleImport() {
  console.log("[v0] Frontend: Import started")
  setIsLoading(true)
  setResult(null)
  setShowStackTrace(false)

  try {
    console.log("[v0] Frontend: Calling importHistoricalResultsAction()")
    const res = await importHistoricalResultsAction()
    console.log("[v0] Frontend: Response received from action", res)
    setResult(res)
    console.log("[v0] Frontend: Result state updated, setting isLoading=false")
  } catch (error) {
    console.error("[v0] Frontend: Caught exception in handleImport", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const stack = error instanceof Error ? error.stack : undefined
    setResult({
      success: false,
      error: message,
      stack,
    })
  } finally {
    console.log("[v0] Frontend: Cleared loading state (isLoading=false)")
    setIsLoading(false)  // ← THIS MUST EXECUTE
  }
}
```

**Expected Log:**
```
[v0] Frontend: Import started
[v0] Frontend: Calling importHistoricalResultsAction()
```

**Key Point:** The function sets `isLoading=true` and waits for `importHistoricalResultsAction()` to return.

---

### Step 2: Server Action Called

**File:** `features/admin/database-health/actions/import-historical-results.ts`

**Code:**
```typescript
export async function importHistoricalResultsAction(): Promise<ImportHistoricalResultsResponse> {
  console.log("[v0] Action: Import started")
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    console.log("[v0] Action: User not admin, returning unauthorized")
    return { success: false, error: "Unauthorized" }
  }

  try {
    console.log("[v0] Action: Calling importHistoricalResults()")
    const summary = await importHistoricalResults()
    console.log("[v0] Action: Import finished successfully")
    const response = { success: true, summary }
    console.log("[v0] Action: Returning success response")
    return response  // ← MUST RETURN SUCCESSFULLY
  } catch (error) {
    // ... error handling ...
    console.log("[v0] Action: Returning error response")
    return errorResponse  // ← MUST RETURN ERROR RESPONSE
  }
}
```

**Expected Logs:**
```
[v0] Action: Import started
[v0] Action: Calling importHistoricalResults()
[v0] Action: Import finished successfully
[v0] Action: Returning success response
```

**Critical:** This is a Server Component Action (marked with `"use server"`). It MUST return a response object or throw an error.

---

### Step 3: Importer Executes

**File:** `lib/imports/historical-results-import.ts`

**Code:**
```typescript
export async function importHistoricalResults(
  optionsOrProvider?: HistoricalResultsImportOptions | SportsDataProvider,
  prisma: PrismaClient = prismaClient,
): Promise<HistoricalResultsImportSummary> {
  try {
    const startTime = Date.now()
    console.log("[v0] Importer: Historical Results Import starting")
    
    // ... import logic (fetch from API, transform, upsert) ...
    
    const endTime = Date.now()
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)
    
    console.log(`[v0] ✅ Historical Results Import Summary (VERIFIED PERSISTENCE):`)
    console.log(`[v0]   Execution time: ${durationSeconds}s`)
    console.log(`[v0] ═════════════════════════════════════════════════════════════\n`)
    console.log(`[v0] Importer: Import finished, returning summary`)
    return summary  // ← MUST RETURN SUMMARY
  } catch (runtimeError) {
    // ... error handling and re-throw ...
    throw error  // ← MUST THROW TO ACTION
  }
}
```

**Expected Logs:**
```
[v0] Importer: Historical Results Import starting
[v0] ✅ Historical Results Import Summary (VERIFIED PERSISTENCE):
[v0]   Execution time: X.XXs
[v0] Importer: Import finished, returning summary
```

**Critical:** This function is long-running (typically 2-30 seconds) and MUST return a summary object.

---

### Step 4: Response Returned to Frontend

**Response Structure:**
```typescript
interface ImportHistoricalResultsResponse {
  success: boolean
  summary?: any
  error?: string
  stack?: string
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "summary": {
    "tournamentsConsidered": 30,
    "tournamentsWithLeaderboard": 30,
    "roundsCreated": 120,
    "playerRoundsCreated": 14944,
    "playerRoundsUpdated": 0,
    "playerRoundsFailed": 0,
    "roundStatisticsCreated": 14944,
    "roundStatisticsUpdated": 0,
    "roundStatisticsFailed": 0,
    "notes": []
  }
}
```

**Expected Log:**
```
[v0] Frontend: Response received from action, {...}
[v0] Frontend: Result state updated, setting isLoading=false
[v0] Frontend: Cleared loading state (isLoading=false)
```

---

## Audit Checklist

### Server Action (`importHistoricalResultsAction`)

✓ **All code paths return a response:**
- ✓ Unauthorized: `return { success: false, error: "Unauthorized" }`
- ✓ Success: `return { success: true, summary }`
- ✓ Error: `return { success: false, error: message, stack }`
- ✓ No code path leaves action hanging

✓ **Promise is always resolved:**
- ✓ `await importHistoricalResults()` is awaited before returning
- ✓ No fire-and-forget async operations
- ✓ Error is caught and response returned, not re-thrown

### Importer (`importHistoricalResults`)

✓ **Always returns a value:**
- ✓ Success: `return summary`
- ✓ Error: caught and re-thrown (action catches it)
- ✓ No hanging promises or background operations

✓ **No unresolved async operations:**
- ✓ All database queries are `await`ed
- ✓ Batch upserts are `await`ed
- ✓ API calls are `await`ed
- ✓ No background jobs or worker threads spawned

### Frontend (`handleImport`)

✓ **Loading state always cleared:**
- ✓ `finally { setIsLoading(false) }` always executes
- ✓ Response is awaited before trying to use it
- ✓ Result state is set with response data
- ✓ Exception handler sets error response and clears loading

---

## How to Debug

If the import hangs (button stays in "Importing..." state):

1. **Check Browser Console:**
   - Look for: `[v0] Frontend: Import started`
   - Look for: `[v0] Frontend: Response received from action`
   - Look for: `[v0] Frontend: Cleared loading state (isLoading=false)`
   - Missing logs indicate where it gets stuck

2. **Check Server Logs:**
   - Look for: `[v0] Action: Import started`
   - Look for: `[v0] Action: Calling importHistoricalResults()`
   - Look for: `[v0] Importer: Historical Results Import starting`
   - Look for: `[v0] Importer: Import finished, returning summary`
   - Look for: `[v0] Action: Returning success response`
   - Missing logs indicate where it hangs

3. **Check for Promise Leaks:**
   - Are there any database queries not awaited?
   - Are there any API calls not awaited?
   - Are there any background operations spawned without awaiting?

4. **Check Frontend State:**
   - Is `isLoading` state stuck at `true`?
   - Did `setResult()` get called?
   - Is there a JavaScript error being silently caught?

---

## Expected Console Output (Success)

**Server Logs:**
```
[v0] Action: Import started
[v0] Action: Calling importHistoricalResults()
[v0] Importer: Historical Results Import starting
[v0] ✅ Historical Results Import Summary (VERIFIED PERSISTENCE):
[v0]   Tournaments considered: 30
[v0]   Tournaments with leaderboard: 30
[v0]   Rounds created: 120
[v0]   Player rounds created: 14944
[v0]   Execution time: 2.34s
[v0] ═════════════════════════════════════════════════════════════
[v0] Importer: Import finished, returning summary
[v0] Action: Import finished successfully
[v0] Action: Returning success response
```

**Browser Console:**
```
[v0] Frontend: Import started
[v0] Frontend: Calling importHistoricalResultsAction()
[v0] Frontend: Response received from action {success: true, summary: {...}}
[v0] Frontend: Result state updated, setting isLoading=false
[v0] Frontend: Cleared loading state (isLoading=false)
```

---

## If Logs Stop At Certain Point

| Missing Log | Likely Issue |
|---|---|
| `[v0] Action: Import started` | Server action not being called, network issue |
| `[v0] Action: Calling importHistoricalResults()` | Admin check failed silently |
| `[v0] Importer: Import finished, returning summary` | Importer hanging or throwing unhandled exception |
| `[v0] Action: Returning success response` | Response construction or return statement failing |
| `[v0] Frontend: Response received from action` | Network timeout or response not being serialized |
| `[v0] Frontend: Cleared loading state` | Frontend exception or state update failing |

