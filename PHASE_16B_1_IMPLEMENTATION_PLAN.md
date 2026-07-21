# Phase 16B.1 — Data Foundation Implementation Plan

**Status:** Implementation Planning  
**Date:** 2026-07-20  
**Phase:** 16B.1 (Data Foundation)  
**Architecture:** Frozen (ARCHITECTURE_MASTER_INDEX.md)

---

## Executive Summary

Phase 16B.1 builds the data foundation required for the course-player matching engine. This phase focuses on database schema, models, repositories, and foundational tests — NOT on algorithm implementation or feature extraction.

**Key Principle:** Every schema decision must reference approved architecture. Every model must support reproducibility, versioning, auditability, and historical immutability.

---

## Implementation Scope

### IN SCOPE (Phase 16B.1)

✅ **Schema Extensions**
- Match models (score, components, metadata)
- Build manifest model (reproducibility)
- Match version tracking model
- Audit trail model (prediction tracking)

✅ **Database Relationships**
- Player → MatchScore (1:many)
- Course → MatchScore (1:many)
- Tournament → MatchScoreBuild (1:many)
- MatchScore → Components (1:many)

✅ **Repositories** (Data Access Layer)
- MatchScoreRepository (CRUD + queries)
- MatchScoreBuildRepository (version tracking)
- AuditTrailRepository (immutable logging)

✅ **Data Validation**
- Score range validation (0-100)
- Confidence calibration (0-100)
- Immutability enforcement
- Referential integrity checks

✅ **Tests**
- Migration validation
- Repository unit tests
- Referential integrity tests
- Version tests
- Historical immutability tests

### OUT OF SCOPE (Phase 16B.2+)

❌ Score calculation logic (algorithm)
❌ Player attribute extraction (feature engineering)
❌ Course attribute extraction (feature engineering)
❌ Explainability engine (Phase 16B.2)
❌ UI integration (Phase 16B.3)
❌ ML model training (Phase 16B.4)

---

## Data Models to Create

### 1. MatchScoreBuild (Build Manifest)

**Purpose:** Reproducibility. Tracks all versioned components for a build.

**Fields:**
- `id` (String @id @default(cuid()))
- `versionId` (String) — Which model version this build belongs to
- `buildHash` (String @unique) — SHA256 of manifest (reproducibility proof)
- `buildManifestJson` (Json) — Complete manifest with all versions
- `status` (Enum: "development" | "candidate" | "active" | "retired")
- `createdBy` (String) — User who created the build
- `activatedAt` (DateTime?)  
- `retiredAt` (DateTime?)
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)

**Relations:**
- `matchScores: MatchScore[]`

**Indices:**
- `buildHash` (unique)
- `status`
- `createdAt`

---

### 2. MatchScore (Prediction Record)

**Purpose:** Core match score + metadata for a player-course pairing.

**Fields:**
- `id` (String @id @default(cuid()))
- `playerId` (String) — Player being evaluated
- `courseId` (String) — Course being evaluated on
- `buildId` (String) — Which build generated this score
- `tournamentId` (String?) — If from tournament context
- `version` (String) — Semantic version (e.g., "1.0.0")
- `overallScore` (Float) — 0-100 final score
- `skillFitScore` (Float) — 0-100 component 1
- `formBonus` (Float) — ±15 component 2
- `venueHistoryBonus` (Float) — ±10 component 3
- `confidenceMultiplier` (Float) — 0.3-1.0 component 4
- `confidenceScore` (Float) — 0-100 separate from accuracy
- `ceilingScore` (Float) — Optimistic scenario
- `floorScore` (Float) — Pessimistic scenario
- `explanation` (String?) — Textual reasoning (500 chars max)
- `explainationComponents` (Json) — Detailed breakdown
- `metadata` (Json) — Additional context (tournament setup, weather, etc.)
- `isHistorical` (Boolean @default(false)) — Recreated from build vs. live prediction
- `recreatedFromBuildId` (String?) — If recreated, which build
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)

**Relations:**
- `player: Player`
- `course: Course`
- `build: MatchScoreBuild`
- `tournament: Tournament?`
- `components: MatchScoreComponent[]`

**Invariants:**
- ✅ No updates to score value (only metadata can be updated)
- ✅ No deletion (only logical archival)
- ✅ createdAt never changes
- ✅ Must have buildId (reproducibility requirement)

**Indices:**
- `playerId, courseId` (composite, find all player-course pairings)
- `buildId` (find all scores from a build)
- `tournamentId` (find tournament predictions)
- `createdAt` (temporal queries)
- `version` (find all predictions from a version)

---

### 3. MatchScoreComponent (Score Breakdown)

**Purpose:** Immutable record of each score component for explainability.

**Fields:**
- `id` (String @id @default(cuid()))
- `scoreId` (String) — Parent MatchScore
- `componentName` (String) — "skillFit" | "formBonus" | "venueHistory" | "confidence" | "volatility"
- `componentValue` (Float) — Value of this component
- `componentReasoning` (String) — Why this component has this value (500 chars)
- `dataUsed` (Json) — Which attributes/signals contributed (immutable snapshot)
- `createdAt` (DateTime @default(now()))

**Relations:**
- `matchScore: MatchScore`

**Invariants:**
- ✅ Immutable (never updated)
- ✅ Created with score, never deleted
- ✅ Records exact data snapshot used

**Indices:**
- `scoreId`
- `componentName`

---

### 4. MatchScoreAuditTrail (Prediction Tracking)

**Purpose:** Immutable audit of every prediction access and decision.

**Fields:**
- `id` (String @id @default(cuid()))
- `scoreId` (String) — Which MatchScore was accessed
- `action` (String) — "created" | "requested" | "explainabilityGenerated" | "recreatedFromBuild" | "archived"
- `actor` (String?) — User or system that triggered action
- `context` (Json) — Surrounding context (tournament, event type, etc.)
- `createdAt` (DateTime @default(now()))

**Relations:**
- `matchScore: MatchScore`

**Invariants:**
- ✅ Immutable (append-only log)
- ✅ Never deleted
- ✅ Provides complete provenance

**Indices:**
- `scoreId`
- `action`
- `createdAt`

---

### 5. MatchVersion (Model Versioning)

**Purpose:** Track semantic versions of the matching engine.

**Fields:**
- `id` (String @id @default(cuid()))
- `versionString` (String @unique) — "1.0.0" (semantic)
- `major` (Int)
- `minor` (Int)
- `patch` (Int)
- `releaseType` (Enum: "alpha" | "beta" | "rc" | "stable")
- `description` (String) — What changed
- `algorithmType` (String) — "hand-tuned" | "gradient-boosted" | "ensemble" | "deep-learning" | "rl" | "llm"
- `calibrationDate` (DateTime) — When weights were last calibrated
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)

**Relations:**
- `builds: MatchScoreBuild[]`

**Invariants:**
- ✅ Version string is immutable (never changes)
- ✅ One build per version minimum

**Indices:**
- `versionString` (unique)
- `releaseType`
- `createdAt`

---

## Migration Strategy

### Migration 001_create_match_models.sql

```sql
-- Create enums
CREATE TYPE match_version_release_type AS ENUM ('alpha', 'beta', 'rc', 'stable');
CREATE TYPE match_algorithm_type AS ENUM ('hand-tuned', 'gradient-boosted', 'ensemble', 'deep-learning', 'rl', 'llm');
CREATE TYPE match_score_build_status AS ENUM ('development', 'candidate', 'active', 'retired');
CREATE TYPE match_score_action AS ENUM ('created', 'requested', 'explainabilityGenerated', 'recreatedFromBuild', 'archived');

-- Create tables
CREATE TABLE match_versions (
  id TEXT PRIMARY KEY,
  version_string TEXT UNIQUE NOT NULL,
  major INT NOT NULL,
  minor INT NOT NULL,
  patch INT NOT NULL,
  release_type match_version_release_type NOT NULL,
  description TEXT,
  algorithm_type match_algorithm_type NOT NULL,
  calibration_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE match_score_builds (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES match_versions(id),
  build_hash TEXT UNIQUE NOT NULL,
  build_manifest_json JSONB NOT NULL,
  status match_score_build_status NOT NULL,
  created_by TEXT,
  activated_at TIMESTAMP,
  retired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE match_scores (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  build_id TEXT NOT NULL REFERENCES match_score_builds(id),
  tournament_id TEXT REFERENCES tournaments(id),
  version TEXT NOT NULL,
  overall_score FLOAT NOT NULL,
  skill_fit_score FLOAT NOT NULL,
  form_bonus FLOAT NOT NULL,
  venue_history_bonus FLOAT NOT NULL,
  confidence_multiplier FLOAT NOT NULL,
  confidence_score FLOAT NOT NULL,
  ceiling_score FLOAT NOT NULL,
  floor_score FLOAT NOT NULL,
  explanation TEXT,
  explanation_components JSONB,
  metadata JSONB,
  is_historical BOOLEAN DEFAULT FALSE,
  recreated_from_build_id TEXT REFERENCES match_score_builds(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE match_score_components (
  id TEXT PRIMARY KEY,
  score_id TEXT NOT NULL REFERENCES match_scores(id),
  component_name TEXT NOT NULL,
  component_value FLOAT NOT NULL,
  component_reasoning TEXT,
  data_used JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE match_score_audit_trails (
  id TEXT PRIMARY KEY,
  score_id TEXT NOT NULL REFERENCES match_scores(id),
  action match_score_action NOT NULL,
  actor TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indices
CREATE INDEX idx_match_scores_player_course ON match_scores(player_id, course_id);
CREATE INDEX idx_match_scores_build ON match_scores(build_id);
CREATE INDEX idx_match_scores_tournament ON match_scores(tournament_id);
CREATE INDEX idx_match_scores_version ON match_scores(version);
CREATE INDEX idx_match_scores_created_at ON match_scores(created_at);
CREATE INDEX idx_match_score_components_score ON match_score_components(score_id);
CREATE INDEX idx_match_score_components_name ON match_score_components(component_name);
CREATE INDEX idx_match_score_audit_score ON match_score_audit_trails(score_id);
CREATE INDEX idx_match_score_audit_action ON match_score_audit_trails(action);
CREATE INDEX idx_match_score_builds_status ON match_score_builds(status);
CREATE INDEX idx_match_versions_version ON match_versions(version_string);
```

---

## Repository Layer

### MatchScoreRepository

```typescript
class MatchScoreRepository {
  // Create
  async create(data: CreateMatchScoreInput): Promise<MatchScore>
  
  // Read (immutable)
  async findById(id: string): Promise<MatchScore | null>
  async findByPlayerAndCourse(playerId: string, courseId: string): Promise<MatchScore[]>
  async findByBuildId(buildId: string): Promise<MatchScore[]>
  async findByTournamentId(tournamentId: string): Promise<MatchScore[]>
  
  // Query with validation
  async findByPlayerAndCourseVersion(playerId: string, courseId: string, version: string): Promise<MatchScore | null>
  
  // Immutability enforcement (no update/delete methods)
}
```

---

## Testing Strategy

### Test Categories

**1. Migration Validation**
- Schema created correctly
- Enums created
- Indices created
- Foreign keys established
- Constraints enforced

**2. Repository Tests**
- Create operations
- Read operations  
- Query correctness
- Error handling

**3. Referential Integrity Tests**
- Player must exist
- Course must exist
- Build must exist
- Cannot delete referenced records

**4. Version Tests**
- Semantic versioning enforced
- Build tied to version
- Scores tied to build
- Version immutability

**5. Historical Immutability Tests**
- Scores cannot be updated (except metadata)
- Audit trail is append-only
- Components cannot be deleted
- createdAt is immutable

---

## Implementation Sequence

### Week 1

1. **Day 1:** Define schema and models
2. **Day 2:** Create Prisma schema additions
3. **Day 3:** Implement migration
4. **Day 4:** Create repositories
5. **Day 5:** Implement tests

### Week 2

1. **Day 1:** Run all tests
2. **Day 2:** Validate referential integrity
3. **Day 3:** Performance testing (query benchmarks)
4. **Day 4:** Documentation
5. **Day 5:** Code review + approval

---

## Architecture Alignment

### FROM ARCHITECTURE_MASTER_INDEX.md

**Section 8: Course-Player Matching Engine**

✅ Build Reproducibility (docs/BUILD_REPRODUCIBILITY.md)
- Every build has manifest
- BuildHash for reproducibility
- All versions recorded
- Build status tracked

✅ Model Governance (docs/MODEL_GOVERNANCE.md)
- Version lifecycle supported
- Audit trail immutable
- Build versioning tracked
- Reproducibility guaranteed

✅ Architecture Invariants (15 permanent rules)
- ✅ No prediction without version
- ✅ No explanation without evidence  
- ✅ No confidence without provenance
- ✅ No overwriting history
- ✅ Historical immutability

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Schema complexity | Medium | Start with MVP (Match, Build, Version, AuditTrail only) |
| Migration failures | High | Test on staging first, rollback procedure documented |
| Performance (indexing) | Medium | Create indices concurrently, monitor query plans |
| Data integrity | High | Referential integrity tests, constraint validation |
| Reproducibility gaps | High | BuildHash verification tests, audit trail completeness |

---

## Success Criteria

✅ All models created  
✅ All migrations pass  
✅ All tests pass  
✅ Zero broken links to existing models  
✅ Reproducibility verified  
✅ Immutability enforced  
✅ Zero architecture deviations  

---

**Phase 16B.1 is ready to implement.**

