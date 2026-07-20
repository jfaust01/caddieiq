# ADR-002: Intelligence Uses Versioned Builds

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Intelligence Team, Architecture  

---

## Context

Intelligence engines (player skill, course intelligence, etc.) produce calculated metrics from raw data. These calculations can change as:
- Algorithm improvements are made
- Data quality changes
- New features are added
- Bugs are discovered and fixed

The challenge: How to manage calculation versions while allowing safe rollback if a new version has issues?

---

## Decision

**Implement versioned builds with active selection** for intelligence engines.

```typescript
model PlayerIntelligenceBuild {
  id              String @id
  version         Int    // 1, 2, 3...
  buildStatus     String // 'in-progress', 'complete', 'failed'
  buildStartedAt  DateTime
  buildCompletedAt DateTime?
  
  // Contains all calculated profiles for this version
  builds          PlayerIntelligence[]
  
  // Pointer to active version
  activePointer   PlayerIntelligenceBuild? @relation(name: "activeVersion")
  pointedFrom     PlayerIntelligenceBuild? @relation(name: "activeVersion")
}

model PlayerIntelligence {
  id                String @id
  playerId          String
  buildId           String
  
  // Calculated data
  skills            Json   // 5-dimension skill profile
  percentiles       Json   // Normalized percentiles
  confidence        Float
  
  build             PlayerIntelligenceBuild @relation(fields: [buildId], references: [id])
}
```

---

## Rationale

### ✓ Advantages of Versioning

1. **Safe Updates**
   - Build new version without affecting current
   - Validate quality before promoting
   - Instant rollback if issues found

2. **A/B Testing**
   - Test new algorithm on 10% of users first
   - Measure impact before full rollout
   - Disable version if problems detected

3. **Traceability**
   - Can see which version a calculation came from
   - Audit trail for changes
   - Reproduce issues from specific version

4. **Progressive Rollout**
   - Batch 1: v3 for 10% of users
   - Batch 2: v3 for 50% of users
   - Batch 3: v3 for 100% of users
   - Pause/rollback at any point

5. **Data Consistency**
   - All users see consistent data from one version
   - No in-flight migrations
   - Atomic version switches

### ✗ Without Versioning

1. **Breaking Changes** — Can't update algorithm without affecting users
2. **No Rollback** — If bug found, have to hotfix in production
3. **Testing Blind** — No way to validate new calculation works
4. **Long Migrations** — Have to recalculate everything before switching
5. **Data Inconsistency** — Some users on new calc, some on old

---

## Alternatives Considered

### Alternative 1: Single Calculation (No Versions)
```typescript
model PlayerIntelligence {
  playerId String @id
  skills Json
}
```
**Rejected:** No way to update safely, no rollback, risky.

### Alternative 2: Timestamp-Based
```typescript
model PlayerIntelligence {
  playerId String
  timestamp DateTime
  skills Json
  
  @@unique([playerId, timestamp])
}
```
**Rejected:** Adds query complexity, unclear which is "active", hard to control rollout.

### Alternative 3: Feature Flags (No Versions)
**Rejected:** Doesn't solve the problem, just moves complexity to flag layer.

---

## Consequences

### ✓ Positive

- Safe algorithm updates
- Easy rollback
- Traceability
- A/B testing capability
- Progressive rollout
- Better incident response

### ✗ Negative

- More database storage (multiple versions)
- Build process more complex (validation, promotion)
- Requires build orchestration
- Need monitoring to detect version issues
- More operational overhead

---

## Implementation Pattern

```typescript
// 1. Start new build
const newBuild = await buildRepository.create({ version: 3 })

// 2. Calculate all player profiles
for (const player of players) {
  const profile = buildPlayerSkillProfile(player.samples)
  await intelligenceRepository.create({ buildId: newBuild.id, ...profile })
}

// 3. Validate quality
const quality = await validateBuildQuality(newBuild.id)
if (quality.passesThresholds) {
  // 4. Promote to active
  await buildRepository.promoteToActive(newBuild.id)
} else {
  // 4b. Mark as failed
  await buildRepository.markFailed(newBuild.id)
  await alertOps('Build v3 failed quality gates')
}

// 5. Rollback if needed
if (problemsDetected) {
  await buildRepository.promoteToActive(previousBuild.id)
}
```

---

## Related ADRs

- ADR-007: Builders are pure functions (enables reproducible versioning)
- ADR-006: Active-build pointers are used (manages promotion)

---

## Rollout Checklist

- [ ] New build created and data populated
- [ ] Quality metrics validated
- [ ] Performance benchmarked
- [ ] Manual spot-checks passed
- [ ] Promoted to 10% of users
- [ ] Monitored for 24 hours
- [ ] Promoted to 50% of users
- [ ] Monitored for 24 hours
- [ ] Promoted to 100% of users
- [ ] Mark old version for deletion after 30 days

