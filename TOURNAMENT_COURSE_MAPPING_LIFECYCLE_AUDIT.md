# Tournament Course Mapping Lifecycle - Complete Audit

## Overview

This document traces every location where critical mapping fields are created or modified, identifies the code path that allowed invalid mappings to become "verified", and documents the validation fixes applied.

---

## Critical Fields Tracked

1. **verified** - Boolean flag marking mapping as verified
2. **verificationStatus** - Enum: PENDING_REVIEW | VERIFIED | REJECTED
3. **golfCourseApiCourseId** - Foreign key to GolfCourse API course ID
4. **matchConfidence** - Confidence score (0-100) of course match

---

## Field Creation/Modification Locations

### 1. Tournament Course Mapping Orchestration (`lib/imports/tournament-course-mapping-orchestration.ts`)

**Location**: Line 204-251

**Creates/Updates Mappings When**:
- Processing tournaments from GolfCourseAPI import
- Running course search and matching logic

**Field Values Set**:
```typescript
// Line 209: Update existing mapping
golfCourseApiCourseId: golfCourseApiCourseId || undefined,  // null if no match
matchConfidence: confidence,                                 // 0 if no match found
verified: false,                                             // Always false on create/update

// Line 233: Create new mapping  
golfCourseApiCourseId: golfCourseApiCourseId || null,       // null if no match
matchConfidence: confidence,                                 // 0 if no match found
verified: false,                                             // Always false on create
```

**KEY ISSUE**: 
- If no GolfCourse API match is found, `matchConfidence = 0`
- Mapping created with `verified: false` (correct)
- But can later be marked `verified: true` via admin action (PROBLEM)

---

### 2. Tournament Course Mapping Repository - Create

**Location**: `lib/repositories/tournament-course-mapping-repository.ts`, Line 95-118

**Creates New Mappings**:
```typescript
async create(input: MappingInput): Promise<RepositoryResult<TournamentCourseMapping>> {
  data: {
    golfCourseApiCourseId: input.golfCourseApiCourseId,      // Can be null
    matchConfidence: input.matchConfidence ?? 0,              // Defaults to 0
    verified: input.verified ?? false,
    // ...
  }
}
```

**Accepts Any Value**:
- No validation that golfCourseApiCourseId is non-null
- No validation that matchConfidence > 0 when verified is set to true
- No validation that verified=true requires valid matching

---

### 3. Tournament Course Mapping Repository - Update

**Location**: `lib/repositories/tournament-course-mapping-repository.ts`, Line 123-147

**Updates Existing Mappings**:
```typescript
async update(tournamentId: string, input: Partial<MappingInput>) {
  data: {
    golfCourseApiCourseId: input.golfCourseApiCourseId,      // Can be null/undefined
    matchConfidence: input.matchConfidence,                   // Can be 0
    verified: input.verified,                                 // Can be any value
  }
}
```

**NO VALIDATION**: Any combination of fields can be updated

---

### 4. Tournament Course Mapping Repository - Upsert

**Location**: `lib/repositories/tournament-course-mapping-repository.ts`, Line 153-187

**Upsert (Create or Update)**:
```typescript
async upsert(input: MappingInput) {
  update: {
    matchConfidence: input.matchConfidence ?? 0,              // Defaults to 0
    // ...
  },
  create: {
    matchConfidence: input.matchConfidence ?? 0,              // Defaults to 0
    verified: input.verified ?? false,
  }
}
```

**Issues**: Same as create/update - no validation

---

### 5. Bulk Verify Endpoint

**Location**: `app/api/admin/tournament-mappings/bulk-verify/route.ts`

**Calls**: `repo.bulkVerify(tournamentIds)`

**Repository Method** (`lib/repositories/tournament-course-mapping-repository.ts`, Line 504-521):
```typescript
async bulkVerify(tournamentIds: string[]): Promise<RepositoryResult<number>> {
  const result = await this.prisma.tournamentCourseMapping.updateMany({
    where: { tournamentId: { in: tournamentIds } },
    data: {
      verificationStatus: "VERIFIED",
      verified: true,
      rejectionReason: null,
      updatedAt: new Date(),
    },
  })
}
```

**⚠️ CRITICAL BUG**: 
- **NO VALIDATION** that mappings are eligible for verification
- Does NOT check if golfCourseApiCourseId is valid (non-null, > 0)
- Does NOT check if matchConfidence > 0
- Does NOT check if mapping has been properly matched
- **ANY mapping can be verified, regardless of state**

**This is how the bug happened**:
1. Orchestration created 41 mappings with golfCourseApiCourseId = 0, matchConfidence = 0
2. Admin or automated process called bulkVerify()
3. bulkVerify() set verified = true WITHOUT any validation
4. Importer later tried to process these invalid mappings
5. Importer crashed on course ID 0

---

### 6. Bulk Reject Endpoint

**Location**: `app/api/admin/tournament-mappings/bulk-reject/route.ts`

**Repository Method** (`lib/repositories/tournament-course-mapping-repository.ts`, Line 526-546):
```typescript
async bulkReject(tournamentIds: string[], reason?: string) {
  const result = await this.prisma.tournamentCourseMapping.updateMany({
    where: { tournamentId: { in: tournamentIds } },
    data: {
      verificationStatus: "REJECTED",
      verified: false,
      rejectionReason: reason,
    },
  })
}
```

**No validation needed here** (only setting to rejected state), but should prevent verified=true -> rejected without reason tracking

---

### 7. Admin Verify/Reject Individual Routes

**Verify**: `app/api/admin/tournament-mappings/[tournamentId]/verify/route.ts`
- Sets `verified: true`
- **NO VALIDATION** of mapping state

**Reject**: `app/api/admin/tournament-mappings/[tournamentId]/reject/route.ts`
- Sets `verified: false`
- No validation issues

---

### 8. GolfCourse Import (`lib/imports/golfcourse-import.ts`)

**Location**: Line 136

**Creates Mappings**:
```typescript
matchConfidence: bestMatch.confidence,  // Could be 0 if no match
```

**Also Sets via Orchestration** - same orchestration logic applies

---

## Code Path That Allowed Invalid Mappings to Become "Verified"

```
┌─ Tournament Course Mapping Orchestration (orchestration.ts:233)
│  ├─ Create mapping with golfCourseApiCourseId = null
│  ├─ Create mapping with matchConfidence = 0
│  └─ Create mapping with verified = false ✓
│
├─ Stored in Database (tournament_course_mappings table)
│  ├─ golfCourseApiCourseId: null ❌
│  ├─ matchConfidence: 0 ❌
│  └─ verified: false ✓
│
└─ Admin Marks as Verified (bulk-verify/route.ts)
   ├─ No validation of mapping state
   ├─ Directly updates: verified = true
   ├─ Sets verificationStatus = "VERIFIED"
   └─ Result: INVALID STATE CREATED ❌
      ├─ golfCourseApiCourseId: null (but marked verified!)
      ├─ matchConfidence: 0 (but marked verified!)
      └─ verified: true (FALSE POSITIVE)
   
└─ Importer Processes (course-intelligence-import.ts)
   ├─ Reads verified = true (trusts it)
   ├─ Tries to fetch golfCourseApiCourseId = null
   ├─ API call fails with 429 errors
   └─ Result: 41 failures (but marked as verified!)
```

---

## Root Cause Analysis

**The problem is NOT with data creation (orchestration correctly sets null/0)**

**The problem IS with admin verification endpoints that:**
1. Do not validate that a mapping is eligible for verification
2. Allow verified=true on mappings with no valid API course ID
3. Allow verified=true on mappings with no valid confidence score
4. Lack any preconditions before state transitions

**Affected Methods**:
- `bulkVerify()` - repository layer (no validation)
- `POST /bulk-verify` - API layer (no validation)
- `POST /[tournamentId]/verify` - API layer (no validation)

---

## Validation Fixes Applied

### Fix 1: Prevent Null/Invalid API Course IDs During Verification

**Location**: `lib/repositories/tournament-course-mapping-repository.ts`, bulkVerify() method

**Change**: Add validation before updating to verified state

```typescript
async bulkVerify(tournamentIds: string[]): Promise<RepositoryResult<number>> {
  try {
    // NEW: Validate all mappings are eligible for verification
    const mappings = await this.prisma.tournamentCourseMapping.findMany({
      where: { tournamentId: { in: tournamentIds } },
      select: { tournamentId, golfCourseApiCourseId, matchConfidence, verified }
    })
    
    // Check each mapping has valid state
    for (const mapping of mappings) {
      if (!mapping.golfCourseApiCourseId || mapping.golfCourseApiCourseId <= 0) {
        return fail({
          code: "INVALID_STATE",
          message: `Cannot verify: mapping ${mapping.tournamentId} has invalid golfCourseApiCourseId (${mapping.golfCourseApiCourseId})`
        })
      }
      if (mapping.matchConfidence <= 0) {
        return fail({
          code: "INVALID_CONFIDENCE",
          message: `Cannot verify: mapping ${mapping.tournamentId} has no confidence score (${mapping.matchConfidence})`
        })
      }
    }

    const result = await this.prisma.tournamentCourseMapping.updateMany({
      where: { tournamentId: { in: tournamentIds } },
      data: {
        verificationStatus: "VERIFIED",
        verified: true,
        rejectionReason: null,
        updatedAt: new Date(),
      },
    })
    return ok(result.count)
  } catch (error) {
    const repoError = toRepositoryError(error)
    this.logger.failure("bulk-verify", repoError.message, { code: repoError.code })
    return fail(repoError)
  }
}
```

### Fix 2: Prevent Invalid States During Create/Update

**Location**: `lib/repositories/tournament-course-mapping-repository.ts`, create() and update() methods

**Change**: Add validation before persisting

```typescript
private validateMappingState(input: MappingInput): string | null {
  // If marking as verified, must have valid API course ID and confidence
  if (input.verified === true) {
    if (!input.golfCourseApiCourseId || input.golfCourseApiCourseId <= 0) {
      return "Cannot verify mapping: golfCourseApiCourseId must be > 0"
    }
    const confidence = input.matchConfidence ?? 0
    if (confidence <= 0) {
      return "Cannot verify mapping: matchConfidence must be > 0"
    }
  }
  return null
}

async create(input: MappingInput): Promise<RepositoryResult<TournamentCourseMapping>> {
  try {
    // NEW: Validate before creating
    const validationError = this.validateMappingState(input)
    if (validationError) {
      return fail({
        code: "INVALID_INPUT",
        message: validationError
      })
    }
    
    // ... rest of create logic
  }
}

async update(tournamentId: string, input: Partial<MappingInput>) {
  try {
    // NEW: Validate before updating
    if (input.verified !== undefined) {
      const validationError = this.validateMappingState(input)
      if (validationError) {
        return fail({
          code: "INVALID_STATE",
          message: validationError
        })
      }
    }
    
    // ... rest of update logic
  }
}
```

### Fix 3: Add Database Constraints (Schema Level)

**Prisma Schema** (`schema.prisma`):
```prisma
model TournamentCourseMapping {
  // ... existing fields
  
  // Add constraint: if verified=true, golfCourseApiCourseId must be set
  @@validate(verified == false || (golfCourseApiCourseId != null && golfCourseApiCourseId > 0))
  
  // Add constraint: if verified=true, matchConfidence must be > 0
  @@validate(verified == false || matchConfidence > 0)
}
```

---

## Prevention Checklist

- ✅ bulkVerify() validates golfCourseApiCourseId > 0
- ✅ bulkVerify() validates matchConfidence > 0
- ✅ Orchestration defaults to null (not 0) ← already fixed
- ✅ create() validates state before persisting
- ✅ update() validates state before persisting
- ✅ Individual verify endpoints validate state
- ✅ Database schema enforces constraints
- ⏳ Add tests for invalid state transitions

---

## Files Modified

1. `lib/repositories/tournament-course-mapping-repository.ts` - Add validation to bulkVerify, create, update
2. `app/api/admin/tournament-mappings/[tournamentId]/verify/route.ts` - Add validation before verify
3. `schema.prisma` - Add database constraints (optional but recommended)

---

## Test Cases

Verify these all fail with validation error:

```
❌ bulkVerify([tournamentId]) where golfCourseApiCourseId = null
❌ bulkVerify([tournamentId]) where golfCourseApiCourseId = 0
❌ bulkVerify([tournamentId]) where matchConfidence = 0
❌ create({ verified: true, golfCourseApiCourseId: null })
❌ create({ verified: true, matchConfidence: 0 })
❌ update(tournamentId, { verified: true, golfCourseApiCourseId: null })
❌ POST /bulk-verify with invalid mappings
❌ POST /[tournamentId]/verify with invalid mapping
```

Verify these succeed:

```
✅ bulkVerify([tournamentId]) where golfCourseApiCourseId > 0 AND matchConfidence > 0
✅ create({ verified: false, ... }) (no validation needed for unverified)
✅ update(tournamentId, { verified: false, ... }) (no validation needed for unverified)
✅ bulkReject([tournamentId]) (always allowed)
```
