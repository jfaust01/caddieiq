# Intelligence Builder Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Definition

Builders (intelligence engines) are **pure functions** that consume data and produce calculated metrics.

**Rule:** Intelligence builders must be deterministic, stateless pure functions.

---

## Pure Function Requirements

```typescript
// ✓ CORRECT: Pure function
function buildPlayerSkillProfile(
  samples: PlayerSample[],
  population: PlayerPopulation
): PlayerSkillProfile {
  // Identical input ALWAYS produces identical output
  // No side effects
  // No external API calls
  // No random values
  // No date/time dependence
  // No database access
  
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
  
  return { skills, percentiles }
}
```

---

## Standard Inputs & Outputs

### Player Skill Intelligence
- **Inputs:** `PlayerSample[]`, `PlayerPopulation`
- **Outputs:** `PlayerSkillProfile` with 5-dimension skills + percentiles
- **Version:** Numbered builds (v1, v2, v3...)
- **Confidence:** Based on sample count

### Course Intelligence
- **Inputs:** `CourseSpecs` (par, yardage, rating, holes, tees, grass)
- **Outputs:** `CourseIntelligence` with 4 trait scores
- **Version:** Single calculation per course
- **Confidence:** Based on data completeness

### Weather Intelligence
- **Inputs:** `WeatherForecast` (5-day forecast)
- **Outputs:** `WeatherContext` normalized by round
- **Version:** Latest only
- **Confidence:** Based on forecast recency

### DFS Value Intelligence
- **Inputs:** Player skill, course fit, salary, field strength, weather
- **Outputs:** Value scores + salary-adjusted rankings
- **Version:** Per-tournament
- **Confidence:** Based on data quality

### Odds Intelligence
- **Inputs:** Moneyline odds, field strength
- **Outputs:** Win probability, implied ranking
- **Version:** Tournament-specific
- **Confidence:** Based on market efficiency

---

## Determinism Testing

Every builder must pass determinism test:

```typescript
describe('PlayerSkillBuilder - Determinism', () => {
  it('produces identical output for identical input', () => {
    const samples = loadTestSamples()
    const population = loadTestPopulation()
    
    // Run multiple times
    const result1 = buildPlayerSkillProfile(samples, population)
    const result2 = buildPlayerSkillProfile(samples, population)
    const result3 = buildPlayerSkillProfile(samples, population)
    
    // All results must be identical
    expect(result1).toEqual(result2)
    expect(result2).toEqual(result3)
  })
})
```

---

## Error Handling

Builders must not throw errors, return result with explanation:

```typescript
// ❌ WRONG: Throwing errors
function buildProfile(samples, population) {
  if (!samples) throw new Error('No samples')
  return { skills: {...} }
}

// ✓ CORRECT: Return result with error info
function buildProfile(
  samples: PlayerSample[] | null,
  population: PlayerPopulation
): Result<PlayerSkillProfile> {
  if (!samples || samples.length === 0) {
    return {
      ok: false,
      error: {
        code: 'INSUFFICIENT_DATA',
        message: 'No player samples available',
        details: { sampleCount: samples?.length || 0 }
      }
    }
  }
  
  return { ok: true, data: { skills: {...} } }
}
```

---

## Versioning & Active Selection

For significant builders, implement versioning:

```typescript
// Model: PlayerIntelligenceBuild tracks all versions
model PlayerIntelligenceBuild {
  id        String   @id
  version   Int      // 1, 2, 3...
  
  // Many builds
  builds    PlayerIntelligence[]
  
  // One active
  activeBuild   PlayerIntelligence?
  activeBuildId String?
}

// Service: Manage builds
export class PlayerSkillBuildService {
  async startNewBuild(): Promise<PlayerIntelligenceBuild> {
    const latest = await this.getLatestBuild()
    const newVersion = (latest?.version || 0) + 1
    
    return this.buildRepository.create({
      version: newVersion,
      buildStatus: 'in-progress'
    })
  }
  
  async promoteToActive(buildId: string): Promise<void> {
    // Validate quality first
    await this.validateBuildQuality(buildId)
    
    // Promote to active
    await this.buildRepository.update({
      id: buildId,
      activeBuild: true
    })
  }
  
  async rollback(previousVersion: number): Promise<void> {
    // Easy rollback if new build is bad
    const previousBuild = await this.buildRepository.findByVersion(previousVersion)
    await this.promoteToActive(previousBuild.id)
  }
}
```

---

## Testing

All builders must have comprehensive tests:

```typescript
describe('CourseIntelligenceBuilder', () => {
  describe('buildIntelligence', () => {
    it('calculates birdie rank correctly', () => {
      const specs = {
        par: 72,
        yardage: 7200,
        rating: 75.5,
        greenSize: 'large'
      }
      
      const result = buildCourseIntelligence(specs)
      
      expect(result.birdieRank).toBeGreaterThan(50) // Easier course
    })
    
    it('handles missing fields gracefully', () => {
      const specs = {
        par: 72,
        yardage: 7200
        // Missing rating
      }
      
      const result = buildCourseIntelligence(specs)
      
      expect(result.ok).toBe(true)
      expect(result.data.confidence).toBeLessThan(0.9)
    })
  })
})
```

---

## Anti-Patterns

🚩 **Builder with side effects**
```typescript
// ❌ WRONG
function buildProfile(samples, population) {
  const profile = {...}
  // Side effect!
  saveToDatabase(profile)
  return profile
}
```

🚩 **Builder calling external APIs**
```typescript
// ❌ WRONG
function buildProfile(samples, population) {
  // External call - not deterministic!
  const external = await fetch('...')
  return { skills: {...} }
}
```

🚩 **Builder with randomness**
```typescript
// ❌ WRONG
function buildProfile(samples, population) {
  const noise = Math.random()  // Not deterministic!
  return { skills: scores + noise }
}
```

🚩 **Builder logging during calculation**
```typescript
// ❌ WRONG
function buildProfile(samples, population) {
  logger.info('Starting build')  // Side effect
  return { skills: {...} }
}
```

---

## Checklist

- [ ] Pure function (no side effects)
- [ ] Deterministic (same input = same output)
- [ ] No external API calls
- [ ] No random values
- [ ] No database access
- [ ] Returns Result<T> (never throws)
- [ ] Proper error handling
- [ ] Confidence metrics included
- [ ] 95%+ test coverage
- [ ] Determinism tests pass
- [ ] Performance benchmarked
- [ ] Versioning (if applicable)

