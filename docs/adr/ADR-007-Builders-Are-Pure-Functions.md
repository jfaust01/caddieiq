# ADR-007: Builders Are Pure Functions

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Intelligence Team  

---

## Context

Intelligence engines produce calculated metrics (player skill profiles, course difficulty scores, etc.). How should these calculations be implemented?

Options:
1. **Service methods** — Part of orchestration layer
2. **Pure functions** — Input → output, no side effects
3. **Stateful builders** — Maintain mutable state

---

## Decision

**Intelligence builders must be pure functions.**

```typescript
// ✓ CORRECT: Pure function
export function buildPlayerSkillProfile(
  samples: PlayerSample[],
  population: PlayerPopulation
): Result<PlayerSkillProfile> {
  if (samples.length === 0) {
    return { ok: false, error: new Error('No samples') }
  }
  
  const skills = {
    long: calculateLongDrive(samples),
    short: calculateShortGame(samples),
    overall: calculateOverall(samples),
    consistency: calculateConsistency(samples),
    comfort: calculateComfort(samples)
  }
  
  const percentiles = {
    long: calculatePercentile(skills.long, population.longScores),
    short: calculatePercentile(skills.short, population.shortScores),
    overall: calculatePercentile(skills.overall, population.overallScores),
    consistency: calculatePercentile(skills.consistency, population.consistencyScores),
    comfort: calculatePercentile(skills.comfort, population.comfortScores)
  }
  
  return { 
    ok: true, 
    data: { skills, percentiles }
  }
}

// Called from service:
export class PlayerSkillService {
  async getProfile(playerId: string) {
    const samplesResult = await this.repository.getSamples(playerId)
    if (!samplesResult.ok) return samplesResult
    
    const population = await this.repository.getPopulation()
    
    // Call pure builder
    return buildPlayerSkillProfile(samplesResult.data, population)
  }
}
```

---

## Rationale

### ✓ Advantages of Pure Functions

1. **Determinism**
   - Same input ALWAYS produces same output
   - Reproducible calculations
   - Same version always works same way

2. **Testability**
   - No mocking required
   - No database needed
   - Can test with test data
   - 100% coverage easy

3. **Debugging**
   - If bug found, can reproduce exactly
   - Stack traces clear
   - No hidden state to track
   - Easy to understand

4. **Performance**
   - Can cache results safely
   - Can parallelize easily
   - No synchronization needed
   - Can pre-calculate

5. **Versioning**
   - Can run multiple versions simultaneously
   - No version conflicts
   - Easy to rollback
   - A/B testing friendly

6. **Reusability**
   - Can call from anywhere
   - No hidden dependencies
   - Can move to service layer later
   - Can parallelize across workers

### ✗ Problems with Stateful Builders

```typescript
// ❌ WRONG: Stateful builder with side effects
class PlayerSkillBuilder {
  private cache = {}
  
  async buildProfile(playerId: string) {
    // Side effects!
    const samples = await db.getPlayerSamples(playerId)
    
    // Mutable state!
    this.cache[playerId] = samples
    
    // Non-deterministic (accesses current time)
    const timestamp = new Date()
    
    // Shared state (race condition risk)
    this.lastBuiltId = playerId
    
    return { skills: {...} }
  }
}

// Problems:
// 1. Can't test without database
// 2. Different order of calls changes behavior
// 3. Cache can get stale
// 4. Not truly deterministic
// 5. Race conditions possible
```

---

## Pure Function Characteristics

### ✓ Required

1. **Same input = Same output**
   ```typescript
   // Same data, same result
   buildProfile(samples1, pop) === buildProfile(samples1, pop)
   ```

2. **No side effects**
   ```typescript
   // ❌ Database writes
   // ❌ API calls
   // ❌ console.log (observably)
   // ❌ Global state changes
   // ❌ File writes
   ```

3. **No hidden dependencies**
   ```typescript
   // ✓ All dependencies are parameters
   function build(samples, population) { ... }
   
   // ❌ Dependencies from outer scope
   let globalPopulation = null
   function build(samples) { ... }  // Uses globalPopulation!
   ```

4. **No time/random dependence**
   ```typescript
   // ❌ WRONG: Depends on current time
   const build = () => ({ timestamp: new Date() })
   
   // ❌ WRONG: Random values
   const build = () => ({ noise: Math.random() })
   
   // ✓ CORRECT: Deterministic
   const build = (timestamp, seed) => ({ timestamp, noise: seed })
   ```

---

## Testing Pattern

```typescript
describe('PlayerSkillBuilder', () => {
  describe('determinism', () => {
    it('produces identical output for identical input', () => {
      const samples = loadFixtureSamples()
      const population = loadFixturePopulation()
      
      const run1 = buildPlayerSkillProfile(samples, population)
      const run2 = buildPlayerSkillProfile(samples, population)
      const run3 = buildPlayerSkillProfile(samples, population)
      
      expect(run1).toEqual(run2)
      expect(run2).toEqual(run3)
    })
  })
  
  describe('error handling', () => {
    it('returns error for empty samples', () => {
      const result = buildPlayerSkillProfile([], population)
      
      expect(result.ok).toBe(false)
      expect(result.error.code).toBe('INSUFFICIENT_DATA')
    })
  })
  
  describe('calculations', () => {
    it('calculates long drive percentile correctly', () => {
      const samples = [{
        distanceCarry: 280,  // 90th percentile
        // ...
      }]
      
      const result = buildPlayerSkillProfile(samples, {
        longScores: [200, 220, 240, 260, 280, 300]
      })
      
      expect(result.data.percentiles.long).toBeCloseTo(0.83, 1)
    })
  })
})
```

---

## Service Pattern

```typescript
export class PlayerSkillIntelligenceService {
  async buildForPlayer(playerId: string): Promise<Result<PlayerSkillProfile>> {
    // 1. Get data (services handle I/O)
    const samplesResult = await this.playerRepository.getSamples(playerId)
    if (!samplesResult.ok) return samplesResult
    
    const populationResult = await this.playerRepository.getPopulation()
    if (!populationResult.ok) return populationResult
    
    // 2. Call pure builder (no I/O)
    const profileResult = buildPlayerSkillProfile(
      samplesResult.data,
      populationResult.data
    )
    
    if (!profileResult.ok) return profileResult
    
    // 3. Store result (service orchestrates)
    await this.intelligenceRepository.saveProfile({
      playerId,
      ...profileResult.data
    })
    
    return profileResult
  }
}
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ WRONG: Builder calls database
async function buildProfile(playerId) {
  const samples = await db.getPlayerSamples(playerId)  // ❌
  // ...
}

// ❌ WRONG: Builder has side effects
function buildProfile(samples) {
  const result = { ... }
  await saveToDatabase(result)  // ❌
  return result
}

// ❌ WRONG: Builder depends on time
function buildProfile(samples) {
  const built = { timestamp: new Date() }  // ❌
  // ...
}

// ❌ WRONG: Builder throws instead of returning Result
function buildProfile(samples) {
  if (!samples) throw new Error(...)  // ❌
  // ...
}
```

---

## Consequences

### ✓ Positive

- Easy to test
- Reproducible results
- Safe to cache
- Easy to version
- Easy to parallelize
- Easy to debug

### ✗ Negative

- Service must handle I/O
- Builders can't access database
- Need to pass all dependencies
- More function parameters

---

## Related ADRs

- ADR-002: Versioned builds work because builders are pure
- ADR-004: Deterministic UTC formatting enabled by pure functions
- ADR-006: Pure functions enable active-build switching

