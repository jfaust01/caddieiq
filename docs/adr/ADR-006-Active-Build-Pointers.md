# ADR-006: Active-Build Pointers are Used

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Intelligence Team  

---

## Context

Intelligence engines produce versioned builds (see ADR-002). The question: How do we track which version is "active" (being used)?

Two approaches:
1. **Boolean flag** — `isActive: true/false`
2. **Pointer pattern** — Build points to active build

---

## Decision

**Use pointer pattern: builds reference their "active" build.**

```prisma
model PlayerIntelligenceBuild {
  id              String @id
  version         Int
  
  // Self-referential: what's the active version?
  activePointerId String?
  activePointer   PlayerIntelligenceBuild? 
    @relation("active", fields: [activePointerId], references: [id])
  pointedFrom     PlayerIntelligenceBuild? 
    @relation("active")
}
```

---

## Rationale

### ✓ Advantages of Pointer Pattern

1. **Atomic Switches**
   - Change pointer = instant version switch
   - No race conditions
   - All users see consistent version

2. **No Boolean Confusion**
   - Can't have multiple `isActive: true`
   - Can't have none active by mistake
   - Pointer is unambiguous

3. **History Tracking**
   - Can see which version was active when
   - Rollback history available
   - Audit trail

4. **Performance**
   - Query active version once per request
   - Cache in React cache()
   - No repeated lookups

5. **Promotes Safety**
   - Deliberate action to switch
   - Can't accidentally deactivate
   - Requires explicit promotion

### ✗ Problems with Boolean Flag

```typescript
// ❌ WRONG: Boolean flag
model PlayerIntelligenceBuild {
  id       String @id
  isActive Boolean = false
}

// Problems:
// 1. Can have multiple isActive: true (race condition)
// 2. Can have none active (query returns nothing)
// 3. Hard to track version history
// 4. Update required to deactivate old version
// 5. Potential corruption
```

---

## Implementation Pattern

### Creating New Build
```typescript
async function startNewBuild(): Promise<PlayerIntelligenceBuild> {
  const currentActive = await buildRepository.findActive()
  const newVersion = (currentActive?.version || 0) + 1
  
  // Create new build (not yet active)
  const newBuild = await buildRepository.create({
    version: newVersion,
    buildStatus: 'in-progress',
    activePointerId: null  // Not active yet
  })
  
  return newBuild
}
```

### Populating Build
```typescript
async function populateBuild(buildId: string): Promise<void> {
  // Calculate all profiles for new build
  const players = await playerRepository.findAll()
  
  for (const player of players) {
    const profile = buildPlayerSkillProfile(player.samples, population)
    await intelligenceRepository.create({
      buildId,
      playerId: player.id,
      ...profile
    })
  }
  
  // Mark build complete
  await buildRepository.update({
    id: buildId,
    buildStatus: 'complete'
  })
}
```

### Promoting to Active
```typescript
async function promoteToActive(buildId: string): Promise<void> {
  // Validate build quality
  const quality = await validateBuild(buildId)
  if (!quality.passes) {
    throw new Error('Build does not meet quality gates')
  }
  
  // Update pointer: this build is now active
  await buildRepository.update({
    id: buildId,
    activePointerId: buildId  // Points to itself
  })
  
  logger.info('New build promoted to active', { version })
}
```

### Rolling Back
```typescript
async function rollback(targetVersion: number): Promise<void> {
  const targetBuild = await buildRepository.findByVersion(targetVersion)
  if (!targetBuild) {
    throw new Error(`Version ${targetVersion} not found`)
  }
  
  // Revert pointer: point to previous version
  await buildRepository.update({
    id: targetBuild.id,
    activePointerId: targetBuild.id
  })
  
  logger.warn('Rolled back to version', { targetVersion })
}
```

### Querying Active Build
```typescript
// ✓ Service method to get active build
async function getActiveProfile(playerId: string): Promise<Result<PlayerSkillProfile>> {
  // Get active build reference
  const buildRef = await buildRepository.findActive()
  if (!buildRef) {
    return unavailableProfile('No active build')
  }
  
  // Get profile for active build
  const profile = await intelligenceRepository.findByBuildAndPlayer(
    buildRef.id,
    playerId
  )
  
  if (!profile) {
    return unavailableProfile('Profile not calculated')
  }
  
  return { ok: true, data: profile }
}
```

---

## Request-Level Caching

```typescript
import { cache } from 'react'

// Cache active build for entire request
export const getActiveIntelligenceBuild = cache(
  async (): Promise<PlayerIntelligenceBuild> => {
    const result = await buildRepository.findActive()
    if (!result.ok) throw result.error
    return result.data
  }
)

// Usage in multiple services
const build1 = await getActiveIntelligenceBuild()  // DB query
const build2 = await getActiveIntelligenceBuild()  // Cached!
const build3 = await getActiveIntelligenceBuild()  // Cached!
// Only 1 DB query per request
```

---

## Consequences

### ✓ Positive

- Atomic version switches
- No race conditions
- Clear active version
- Easy rollback
- History tracking
- Safe by default

### ✗ Negative

- Requires self-referential schema
- Pointer management overhead
- Must update database to switch
- Can't switch without explicit action

---

## Related ADRs

- ADR-002: Intelligence uses versioned builds
- ADR-001: Feature-based architecture enables version management

