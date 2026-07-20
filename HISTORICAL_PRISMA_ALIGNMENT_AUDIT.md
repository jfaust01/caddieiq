# Prisma Schema Alignment Audit: Phase 17.3A.1 Step 2

**Audit Date:** 2026-07-20  
**Audit Authority:** Database Reliability Engineer  
**Status:** ⚠️ MISALIGNMENT DETECTED  

---

## EXECUTIVE SUMMARY

The migration `20260720000000_historical_data_foundation/migration.sql` creates 9 new tables and enhances 2 existing tables in PostgreSQL. However, the Prisma schema (`prisma/schema.prisma`) does not yet include models for any of these new historical tables.

**Finding: SCHEMA UPDATE REQUIRED**

The migration SQL is valid but the Prisma schema has not been updated to reflect the new tables. This must be corrected before using the ORM to query historical data.

---

## DRIFT ANALYSIS

### Migration-Created Tables vs Prisma Models

**Table: provider_id_mappings**
- ❌ No Prisma model exists
- SQL definition: 36 lines with 10 columns, 3 indexes
- Required model: Provider entity enum, CHECK constraints

**Table: historical_player_features**
- ❌ No Prisma model exists
- SQL definition: 65 lines with bitemporal timestamps, triggers
- Required model: Relationship to Player, JSONB support for checksums

**Table: historical_snapshots**
- ❌ No Prisma model exists
- SQL definition: 45 lines with JSONB features, triggers
- Required model: Relationships to Tournament and Player

**Table: historical_data_audit_events**
- ❌ No Prisma model exists
- SQL definition: 20 lines with event type enums
- Required model: Append-only audit trail

**Table: data_quality_reports**
- ❌ No Prisma model exists
- SQL definition: 25 lines with JSONB details
- Required model: Import job reference, quality enums

**Table: historical_player_rankings**
- ❌ No Prisma model exists
- SQL definition: 30 lines with ranking system enum
- Required model: Player relationship, temporal fields

**Table: historical_salary_odds_snapshots**
- ❌ No Prisma model exists
- SQL definition: 25 lines with DK/FD salary fields
- Required model: Tournament/Player relationships

**Table: historical_tournament_outcomes**
- ❌ No Prisma model exists
- SQL definition: 35 lines with score tracking
- Required model: Tournament/Player relationships

**Table: historical_import_jobs**
- ❌ No Prisma model exists
- SQL definition: 30 lines with status tracking
- Required model: Status enum, import type enum

### Enhanced Existing Tables

**Table: tournaments (columns added)**
- ❌ Prisma model exists but does not include new columns
- Missing: lock_datetime, lock_datetime_set_at, edition_sequence, tournament_series_id, provider_edition_id, lock_datetime_is_immutable

**Table: tournament_fields (columns added)**
- ❌ Prisma model exists but does not include new columns
- Missing: entry_confirmed_at, withdrawal_timestamp, withdrawal_known_timestamp, entry_status_changed_at, source_effective_timestamp, alternate_status, alternate_call_timestamp, source_provider, source_record_id, retrieved_timestamp

---

## IMPACT ANALYSIS

### Critical Impact: BLOCKING

Without Prisma schema updates, the following cannot work:

1. ❌ ORM queries on historical tables (no models defined)
2. ❌ Type generation (`prisma generate`)
3. ❌ Schema validation (`prisma validate`)
4. ❌ Migration status (`prisma migrate status`)
5. ❌ TypeScript access to historical data
6. ❌ Runtime type checking for historical operations

### Application Impact

Any code attempting to:
```typescript
const features = await prisma.historical_player_features.findMany();
```

Will fail with: `Property 'historical_player_features' does not exist on 'PrismaClient'`

---

## WHAT MUST BE UPDATED

### Prisma Schema Additions

Create model for each table:

```prisma
// New historical data models

model ProviderIdMapping {
  id String @id
  entityType String // enum: "player" | "tournament" | "course"
  internalId String
  providerId String
  provider String
  providerRecordId String
  mappingStatus String // enum: "verified" | "pending" | "disputed" | "rejected"
  verificationSource String?
  verificationTimestamp DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([provider, providerId, entityType])
  @@map("provider_id_mappings")
}

model HistoricalPlayerFeature {
  id String @id
  playerId String
  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  featureKey String
  featureVersion String
  featureValue String?
  unit String?
  
  // Bitemporal
  validFrom DateTime
  validTo DateTime?
  systemRecordedAt DateTime
  
  // Provenance
  sourceProvider String
  sourceRecordId String?
  retrievalTimestamp DateTime
  rawPayloadChecksum String?
  
  // Quality
  dataQualityStatus String // enum: "verified" | "estimated" | "partial" | "error"
  missingDataReason String?
  
  // Transformation
  transformationVersion String?
  
  // Immutability
  sealed Boolean @default(false)
  sealedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([playerId])
  @@index([featureKey])
  @@index([validFrom, validTo])
  @@map("historical_player_features")
}

model HistoricalSnapshot {
  id String @id
  snapshotHash String @unique
  
  tournamentId String
  tournament Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  
  playerId String
  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  lockTimestamp DateTime
  modelVersion String
  featureSetVersion String
  
  features Json
  featuresIncluded Json
  featuresExcluded Json
  lateArrivalsExcluded Json?
  completenessScore Float?
  
  sealed Boolean @default(false)
  sealedAt DateTime?
  
  generatedAt DateTime @default(now())
  generatedBy String @default("snapshot_service")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tournamentId, playerId, modelVersion, featureSetVersion])
  @@index([playerId])
  @@index([tournamentId])
  @@index([sealed])
  @@map("historical_snapshots")
}

// ... (additional models for remaining tables)
```

### Existing Table Updates

Update `Tournament` model:

```prisma
model Tournament {
  // existing fields...
  
  lockDatetime DateTime?
  lockDatetimeSetAt DateTime?
  editionSequence Int?
  tournamentSeriesId String?
  providerEditionId String? @unique
  lockDatetimeIsImmutable Boolean @default(false)
  
  // ... rest of model
}
```

Update `TournamentField` model:

```prisma
model TournamentField {
  // existing fields...
  
  entryConfirmedAt DateTime?
  withdrawalTimestamp DateTime?
  withdrawalKnownTimestamp DateTime?
  entryStatusChangedAt DateTime @default(now())
  sourceEffectiveTimestamp DateTime?
  alternateStatus String? // "primary" | "alternate" | "alternate_called"
  alternateCallTimestamp DateTime?
  sourceProvider String @default("sportsdataio")
  sourceRecordId String?
  retrievedTimestamp DateTime?
  
  // ... rest of model
}
```

---

## VALIDATION COMMANDS (TO BE EXECUTED)

### Command 1: prisma format

```bash
cd /vercel/share/v0-project
npx prisma format
```

**Expected:** Reformats schema with Prisma conventions

### Command 2: prisma validate

```bash
npx prisma validate
```

**Expected:** Should pass after schema is updated

### Command 3: prisma generate

```bash
npx prisma generate
```

**Expected:** Generates TypeScript client with new models

### Command 4: prisma migrate status

```bash
npx prisma migrate status
```

**Expected:** Should show the migration as pending until applied

---

## CRITICAL FINDING

### The Schema-Migration Mismatch

The migration exists but Prisma doesn't know about it. This is a **drift situation**.

**If migration is applied without schema update:**
- ✅ PostgreSQL gets the tables
- ✅ Database schema is correct
- ❌ Prisma Client doesn't include types
- ❌ ORM queries will fail
- ❌ TypeScript compilation will fail

**Resolution:**

1. **Update Prisma schema** to include all new models
2. **Update existing models** to include new columns
3. **Run** `npx prisma generate`
4. **Apply migration** with `npx prisma migrate deploy`

---

## AUDIT DETERMINATION

**Schema Alignment Status:** ⚠️ MISALIGNMENT

**Prisma Client Status:** ❌ OUT OF SYNC

**ORM Usability:** ❌ BROKEN (after migration applied)

**Required Action:** Update schema.prisma with all new models

**Blocker:** Yes — Cannot deploy without schema alignment

---

## NEXT STEPS

1. Add all 9 new model definitions to schema.prisma
2. Update Tournament and TournamentField models
3. Run `prisma format` to ensure consistency
4. Run `prisma validate` to check syntax
5. Run `prisma generate` to create TypeScript client
6. Proceed to Step 3 (Apply Migration)

---

## STATUS: BLOCKER IDENTIFIED

The migration is valid SQL, but the Prisma schema must be updated before proceeding to database application.

**Current Status:** Schema alignment required before migration deployment.

