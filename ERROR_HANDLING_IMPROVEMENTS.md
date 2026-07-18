# Historical Results Import — Error Handling Improvements

## Overview

Improved error handling throughout the Historical Results Import pipeline to provide meaningful, actionable error messages while preserving complete stack traces for debugging.

---

## Changes Made

### 1. **lib/imports/historical-results-import.ts**

**Before:**
- Caught runtime errors and returned them as a summary with `notes`
- Error details were logged but not propagated to caller
- No stack trace preservation

**After:**
- Runtime errors are now **re-thrown** after logging
- Complete stack trace logged to console with formatted output
- Original exception preserved for action layer to handle
- Error includes file, line number, exception type, and message

**Code:**
```typescript
catch (runtimeError) {
  // Log complete error details
  console.error(`[v0] RUNTIME ERROR - Import Failed`)
  console.error(`[v0] Error Type: ${name}`)
  console.error(`[v0] Error Message: ${message}`)
  console.error(`[v0] Stack Trace:...`)
  
  // Re-throw to preserve exception
  const error = runtimeError instanceof Error ? runtimeError : new Error(String(runtimeError))
  throw error
}
```

---

### 2. **features/admin/database-health/actions/import-historical-results.ts**

**Before:**
- Caught errors and returned only error message
- No stack trace or structured response
- No development-specific debugging

**After:**
- Returns structured JSON response:
  ```json
  {
    "success": false,
    "error": "Error message",
    "stack": "... (development only)"
  }
  ```
- Stack trace only included in development environment
- Complete error logging with file/line/type/message
- Proper error documentation via TypeScript interface

**Code:**
```typescript
export interface ImportHistoricalResultsResponse {
  success: boolean
  summary?: any
  error?: string
  stack?: string
}

catch (error) {
  // Extract and log complete error details
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  const name = error instanceof Error ? error.name : "UnknownError"

  console.error(`[v0] Historical Results Import Error: ${name}`)
  console.error(`[v0] Message: ${message}`)
  console.error(`[v0] Stack Trace: ...`)

  // Return structured error response
  return {
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? stack : undefined,
  }
}
```

---

### 3. **features/admin/database-health/import-historical-results.tsx**

**Before:**
- Displayed generic "Import Failed" message
- No error details shown to user
- No way to view stack trace for debugging

**After:**
- Displays actual error message to user
- Expandable stack trace viewer (development environments)
- Structured error display with visual hierarchy
- Click to toggle stack trace visibility

**UI Improvements:**
```tsx
{!result.success ? (
  <>
    <div className="flex items-center gap-2 text-red-600">
      <AlertCircle className="size-4" />
      <span className="font-semibold">Import Failed</span>
    </div>
    <p className="text-sm">{result.error}</p>  {/* ← Actual error message */}
    {result.stack && (
      <div>
        <button onClick={() => setShowStackTrace(!showStackTrace)}>
          {showStackTrace ? "Hide Stack Trace" : "Show Stack Trace"}
        </button>
        {showStackTrace && (
          <pre className="mt-1 overflow-x-auto rounded bg-red-50 p-2">
            {result.stack}
          </pre>
        )}
      </div>
    )}
  </>
)}
```

---

## Error Flow

### Before
```
Importer throws → Caught by importer → Logged as notes → Action receives summary
→ UI shows "Import Failed" (generic)
```

### After
```
Importer throws → Logged with full details → Re-thrown
→ Action catches → Logs again → Returns structured response with stack trace
→ UI displays actual error message + expandable stack trace
```

---

## Features

✓ **Preserved Exceptions:** Original error object propagated, not swallowed  
✓ **Structured Response:** Consistent JSON format with success/error/stack  
✓ **Complete Stack Traces:** File, line number, exception type, message  
✓ **Development-Only Details:** Stack trace only in NODE_ENV=development  
✓ **Console Logging:** Full error details logged for debugging  
✓ **User-Friendly UI:** Actual error messages displayed to users  
✓ **Expandable Details:** Stack trace can be toggled in UI  

---

## Testing

### Test Case: API Error (e.g., 500 response)

**Expected Output:**
```
[v0] Historical Results Import Error: Error
[v0] Message: API Error: 500 from /json/Leaderboard/590
[v0] Stack Trace:
[v0]   at async getLeaderboard (lib/providers/sportsdataio/provider.ts:145:23)
[v0]   at async importHistoricalResults (lib/imports/historical-results-import.ts:148:45)
```

**UI Display:**
- Error message: "API Error: 500 from /json/Leaderboard/590"
- Expandable stack trace showing file paths and line numbers

### Test Case: Runtime Error (e.g., ReferenceError)

**Expected Output:**
```
[v0] RUNTIME ERROR - Import Failed
[v0] Error Type: ReferenceError
[v0] Error Message: prov is not defined
[v0] Stack Trace:
[v0]   at async importHistoricalResults (lib/imports/historical-results-import.ts:148:25)
```

**UI Display:**
- Error message: "prov is not defined"
- Clear indication of the problem for developers

---

## Benefits

1. **Debugging:** Complete stack traces for developers
2. **User Experience:** Meaningful error messages instead of generic "unexpected response"
3. **Production Safety:** Stack traces hidden in production (only in development)
4. **Error Preservation:** Original exceptions not swallowed
5. **Consistency:** Structured error response throughout pipeline

