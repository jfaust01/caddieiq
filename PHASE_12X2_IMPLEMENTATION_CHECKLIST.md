# Phase 12.X.2 — Implementation Checklist

## Pre-Implementation

- [ ] Code review of PHASE 1-4 importer changes
- [ ] Review PHASE 5 migration strategy
- [ ] Backup production database
- [ ] Create backup tables (rounds_backup, player_rounds_backup, round_statistics_backup)

## Implementation Steps

### Step 1: Backup Existing Data
```bash
# Run in PostgreSQL console
CREATE TABLE rounds_backup AS SELECT * FROM rounds;
CREATE TABLE player_rounds_backup AS SELECT * FROM player_rounds;
CREATE TABLE round_statistics_backup AS SELECT * FROM round_statistics;
```

### Step 2: Clear Historical Data
```bash
# Delete existing historical data (keep schema)
# Run the DELETE queries from PHASE_12X2_MIGRATION_AND_VALIDATION.md
```

### Step 3: Validate Code
- [ ] TypeScript compilation passes
- [ ] No linting errors
- [ ] Import statement changes verified

### Step 4: Run Single Tournament Test
```bash
# Import just Cognizant Classic (externalId: '590')
# Expected: 4 rounds, 588 player_rounds, 588 round_statistics
```

### Step 5: Execute Validation Queries
- [ ] Query 1: Verify Rounds Created (expect 4 per tournament)
- [ ] Query 2: Verify PlayerRound Count (expect 588)
- [ ] Query 3: Verify RoundStatistics Populated (expect 588)
- [ ] Query 4: Verify Sample Data (Austin Eckroat scores progression)
- [ ] Query 5: Verify TournamentField Integrity (unchanged)

### Step 6: Run Full Import
```bash
# Run importer for all completed tournaments
# Expected: ~172 rounds, ~25,284 player_rounds, ~25,284 round_statistics
```

### Step 7: Monitor Import
- [ ] Check console output for errors
- [ ] Verify upsert counts in summary
- [ ] Check for any FAIL_FAST errors
- [ ] Monitor database performance

## Post-Implementation

### Verification
- [ ] All five final verification queries pass
- [ ] No orphaned records (roundId references valid)
- [ ] No duplicate PlayerRounds per player per round
- [ ] All RoundStatistics linked to valid PlayerRounds

### Testing
- [ ] Leaderboard displays correctly
- [ ] Round-by-round data visible
- [ ] Tournament ranking preserved
- [ ] No breaking changes in existing queries

### Documentation
- [ ] Update schema documentation
- [ ] Document new multi-round model
- [ ] Document PHASE 1-4 changes in importer
- [ ] Update any related migration guides

## Rollback Plan (If Needed)

If any step fails:
1. Stop the import process
2. Run TRUNCATE + INSERT from backup tables
3. Restore from backup

```sql
TRUNCATE TABLE round_statistics CASCADE;
TRUNCATE TABLE player_rounds CASCADE;
TRUNCATE TABLE rounds CASCADE;

INSERT INTO rounds SELECT * FROM rounds_backup;
INSERT INTO player_rounds SELECT * FROM player_rounds_backup;
INSERT INTO round_statistics SELECT * FROM round_statistics_backup;
```

## Success Criteria (All Must Pass)

- ✓ Multiple roundNumbers per tournament (1, 2, 3, 4)
- ✓ One PlayerRound per player per round
- ✓ RoundStatistics fully populated
- ✓ Correct score values (actual strokes, not rank)
- ✓ TournamentField relationships preserved
- ✓ No data loss or breaking changes

