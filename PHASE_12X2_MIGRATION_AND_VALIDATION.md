# Phase 12.X.2 — Migration Strategy and Validation

## PHASE 5: Migration Strategy

The migration must preserve all existing relationships while replacing the Round/PlayerRound/RoundStatistic hierarchy.

### Pre-Migration Backup
```sql
-- Backup existing data before running new importer
CREATE TABLE rounds_backup AS SELECT * FROM rounds;
CREATE TABLE player_rounds_backup AS SELECT * FROM player_rounds;
CREATE TABLE round_statistics_backup AS SELECT * FROM round_statistics;
```

### Migration Steps

1. **Clear historical data (keep schema):**
   ```sql
   DELETE FROM round_statistics WHERE id IN (
     SELECT rs.id FROM round_statistics rs
     JOIN player_rounds pr ON rs."playerRoundId" = pr.id
     JOIN rounds r ON pr."roundId" = r.id
     JOIN tournaments t ON r."tournamentId" = t.id
     WHERE t.status = 'COMPLETED' AND t."deletedAt" IS NULL
   );

   DELETE FROM player_rounds WHERE id IN (
     SELECT pr.id FROM player_rounds pr
     JOIN rounds r ON pr."roundId" = r.id
     JOIN tournaments t ON r."tournamentId" = t.id
     WHERE t.status = 'COMPLETED' AND t."deletedAt" IS NULL
   );

   DELETE FROM rounds WHERE id IN (
     SELECT r.id FROM rounds r
     JOIN tournaments t ON r."tournamentId" = t.id
     WHERE t.status = 'COMPLETED' AND t."deletedAt" IS NULL
   );
   ```

2. **Re-run importer:**
   ```typescript
   const summary = await importHistoricalResults()
   console.log('Migration complete:', summary)
   ```

3. **Verify data integrity:**
   - See PHASE 7 validation queries below

### Rollback Strategy

If import fails, restore from backup:
```sql
TRUNCATE TABLE round_statistics CASCADE;
TRUNCATE TABLE player_rounds CASCADE;
TRUNCATE TABLE rounds CASCADE;

INSERT INTO rounds SELECT * FROM rounds_backup;
INSERT INTO player_rounds SELECT * FROM player_rounds_backup;
INSERT INTO round_statistics SELECT * FROM round_statistics_backup;
```

### Idempotency

The upsert logic ensures the migration is idempotent. Re-running the importer:
- Creates missing Rounds (1-4 per tournament)
- Creates/updates PlayerRounds
- Creates/updates RoundStatistics
- Preserves tournament and player IDs

---

## PHASE 6: Repository Review Results

**AUDIT FINDINGS: No critical changes required**

✓ RoundRepository — Already supports roundNumber parameter
✓ PlayerRoundRepository — Already supports bulk upsert with idempotency
✓ RoundStatisticRepository — Already supports bulk upsert
✓ Services — Already handle multiple player_rounds per tournament

All existing queries remain compatible with multi-round model.

---

## PHASE 7: Single Tournament Validation

### Validation Test: Cognizant Classic (Tournament ID: 590)

Run single tournament import first:
```typescript
const allTournaments = await prisma.tournament.findMany({...})
const cognitant = allTournaments.find(t => t.externalId === '590')
// Run import process for just this tournament
```

### Verification Queries

**Query 1: Verify Rounds Created (expect 4)**
```sql
SELECT 
  r."roundNumber",
  COUNT(*) as player_round_count
FROM rounds r
LEFT JOIN player_rounds pr ON pr."roundId" = r.id
WHERE r."tournamentId" = 'cmrlmaawh00024zpam57jf0g6'
GROUP BY r."roundNumber"
ORDER BY r."roundNumber";

-- Expected output:
-- roundNumber | player_round_count
-- 1           | 147
-- 2           | 147
-- 3           | 147
-- 4           | 147
```

**Query 2: Verify PlayerRound Count (expect 588 = 147 × 4)**
```sql
SELECT COUNT(*) as total_player_rounds
FROM player_rounds pr
WHERE pr."roundId" IN (
  SELECT r.id FROM rounds r 
  WHERE r."tournamentId" = 'cmrlmaawh00024zpam57jf0g6'
);

-- Expected: 588
```

**Query 3: Verify RoundStatistics Populated (expect 588)**
```sql
SELECT COUNT(*) as total_round_statistics
FROM round_statistics rs
WHERE rs."playerRoundId" IN (
  SELECT pr.id FROM player_rounds pr
  JOIN rounds r ON pr."roundId" = r.id
  WHERE r."tournamentId" = 'cmrlmaawh00024zpam57jf0g6'
);

-- Expected: 588
```

**Query 4: Sample Data Verification (Austin Eckroat)**
```sql
SELECT
  p."fullName",
  r."roundNumber",
  pr.score,
  pr."toPar",
  pr.position,
  rs.birdies,
  rs.bogeys,
  rs.pars
FROM player_rounds pr
JOIN rounds r ON pr."roundId" = r.id
JOIN tournament_fields tf ON tf.id = pr."tournamentFieldId"
JOIN players p ON p.id = tf."playerId"
JOIN tournaments t ON t.id = r."tournamentId"
LEFT JOIN round_statistics rs ON rs."playerRoundId" = pr.id
WHERE t."externalId" = '590'
  AND p.slug = 'austin-eckroat'
ORDER BY r."roundNumber";

-- Expected output (approximate scores):
-- fullName       | roundNumber | score | toPar | position | birdies | bogeys | pars
-- Austin Eckroat | 1           | 87    | 16    | 2        | 12      | 5      | 11
-- Austin Eckroat | 2           | 74    | 3     | 2        | 4       | 2      | 14
-- Austin Eckroat | 3           | 69    | -2    | 2        | 5       | 1      | 12
-- Austin Eckroat | 4           | 68    | -3    | 2        | 3       | 1      | 14
```

**Query 5: Verify TournamentField Integrity (expect no changes)**
```sql
SELECT COUNT(*) as field_count
FROM tournament_fields tf
WHERE tf."tournamentId" = 'cmrlmaawh00024zpam57jf0g6';

-- Expected: 147 (unchanged)
```

### Expected Importer Summary Output
```
tournamentsConsidered: 1
tournamentsWithLeaderboard: 1
roundsCreated: 4
playerRoundsCreated: 588
playerRoundsUpdated: 0
playerRoundsFailed: 0
roundStatisticsCreated: 588
roundStatisticsUpdated: 0
roundStatisticsFailed: 0
```

---

## PHASE 8: Full Import Post-Validation

After successful single-tournament validation, run full import:

```typescript
const summary = await importHistoricalResults()

// Expected aggregates (43 tournaments total):
// Rounds: 43 × ~4 = ~172
// PlayerRounds: ~43 × 147 × 4 = ~25,284 (varies by completion)
// RoundStatistics: ~25,284
```

---

## Final Verification Checklist

- [ ] **Query 1:** Verify multiple roundNumbers per tournament (1, 2, 3, 4)
- [ ] **Query 2:** Verify PlayerRound count matches 4x increase
- [ ] **Query 3:** Verify RoundStatistics is fully populated
- [ ] **Query 4:** Sample data shows correct scores (87, 74, 69, 68 progression)
- [ ] **Query 5:** TournamentField relationships unchanged

After all five queries pass, migration is complete and ready for production.

