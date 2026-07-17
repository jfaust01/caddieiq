# Debug Logging Trace - TournamentRoundsTable Data Flow

## Purpose
This guide explains how to use the detailed logging added to trace where round scoring data becomes empty.

---

## Data Flow Layers

### Layer 1: Tournament Command Center
**File:** `tournament-command-center.tsx` (lines 316-327)

**Logs:**
```
[v0] ════════════════════════════════════════════════════
[v0] BEFORE TournamentRoundsTable render
[v0] rounds.length: 1
[v0] Round 0: id=cmrpj5j4d00009hronspr9a6a, number=1, playerScores=107
[v0] ════════════════════════════════════════════════════
```

**What it shows:**
- `rounds.length`: Total number of rounds fetched
- For each round: ID, round number, and count of playerScores

**If playerScores is 0 here:**
→ Problem is in the service layer (getRoundsByTournament)

---

### Layer 2: getRoundsByTournament Service
**File:** `tournament-service.ts` (lines 131-181)

**Logs (Part A - Initial fetch):**
```
[v0] ════════════════════════════════════════════════════
[v0] getRoundsByTournament service
[v0] tournamentId: cmrlmaaaa000000000000aaaa
[v0] roundRepo.getByTournament returned: 1 rounds
[v0] ════════════════════════════════════════════════════
```

**What it shows:**
- The tournament ID being queried
- How many rounds the repository returned

**If rounds.length is 0 here:**
→ Problem is in the repository layer (RoundRepository)

---

### Layer 2B: Player Rounds Building
**File:** `tournament-service.ts` (lines 146, 175-177)

**Logs (Part B - For each round):**
```
[v0] Round 1: playerRoundRepo.getByRound returned 107 player rounds
[v0] Round 1: built 107 player score entries (filtered from 107)
```

**What it shows:**
- How many player rounds were fetched from database
- How many were successfully mapped to playerScores
- If numbers differ: some entries were filtered out (missing playerId)

**If built count is 0 but returned count > 0:**
→ Problem is in the mapping logic (player name resolution)

---

### Layer 3: TournamentRoundsTable Component
**File:** `tournament-rounds-table.tsx` (lines 30-32, 85-91)

**Logs (Part A - Initial render):**
```
[v0] TournamentRoundsTable rendering
[v0]   rounds.length: 1
```

**Logs (Part B - Active round data):**
```
[v0] ════════════════════════════════════════════════════
[v0] INSIDE TournamentRoundsTable
[v0] activeRound: 0
[v0] currentRound.playerScores.length: 107
[v0] ════════════════════════════════════════════════════
```

**What it shows:**
- Which round tab is active (0 = Round 1, 'overall' = Overall)
- How many player scores are in the current round

**If currentRound.playerScores.length > 0 but nothing renders:**
→ Problem is in the table rendering logic (JSX/HTML)

**If currentRound.playerScores.length is 0:**
→ Check if activeRound is correct and current round actually has data

---

## Debugging Decision Tree

### Step 1: Check before TournamentRoundsTable
Look for log from tournament-command-center.tsx:
```
[v0] Round 0: id=..., number=1, playerScores=107
```

**If playerScores=0:**
→ Go to Step 2a (Service Issue)

**If playerScores>0:**
→ Go to Step 3 (Component Issue)

---

### Step 2a: Service Issue Diagnosis
Look for logs from tournament-service.ts:

**Check Round Fetch:**
```
[v0] roundRepo.getByTournament returned: 1 rounds
```
If 0: Go to Step 2b (Repository Issue)
If >0: Continue

**Check Player Rounds Fetch:**
```
[v0] Round 1: playerRoundRepo.getByRound returned 107 player rounds
```
If 0: Go to Step 2b (Repository Issue)
If >0: Continue

**Check Player Score Building:**
```
[v0] Round 1: built 107 player score entries (filtered from 107)
```
If built count = 0 and returned > 0: Player resolution failed
If built count = returned: All data mapped correctly

---

### Step 2b: Repository Issue Diagnosis
Query the database directly:

```sql
-- Check if rounds exist
SELECT COUNT(*) FROM rounds WHERE "tournamentId" = '{tournament_id}';

-- Check if player_rounds exist
SELECT COUNT(*) FROM player_rounds 
WHERE "roundId" IN (
  SELECT id FROM rounds WHERE "tournamentId" = '{tournament_id}'
);
```

If both return 0: Import never ran or failed completely
If both return >0: Database is fine, issue is in mapping/resolution

---

### Step 3: Component Rendering Issue
Look for logs from tournament-rounds-table.tsx:

```
[v0] activeRound: 0
[v0] currentRound.playerScores.length: 107
```

**If playerScores.length > 0:**
→ Data is there, rendering bug exists
→ Inspect table structure, CSS, or player rendering logic

**If playerScores.length = 0 but command-center showed > 0:**
→ activeRound is selecting wrong round
→ Check tab selection logic

---

## Expected Good State Logs

When everything works, you should see:

```
[v0] ════════════════════════════════════════════════════
[v0] BEFORE TournamentRoundsTable render
[v0] rounds.length: 1
[v0] Round 0: id=cmrpj5j4d00009hronspr9a6a, number=1, playerScores=107
[v0] ════════════════════════════════════════════════════

[v0] ════════════════════════════════════════════════════
[v0] getRoundsByTournament service
[v0] tournamentId: cmrlmaaaa000000000000aaaa
[v0] roundRepo.getByTournament returned: 1 rounds
[v0] ════════════════════════════════════════════════════
[v0] Round 1: playerRoundRepo.getByRound returned 107 player rounds
[v0] Round 1: built 107 player score entries (filtered from 107)
[v0] getRoundsByTournament returning: 1 rounds with scores
[v0]   Round 1: 107 player scores

[v0] TournamentRoundsTable rendering
[v0]   rounds.length: 1

[v0] ════════════════════════════════════════════════════
[v0] INSIDE TournamentRoundsTable
[v0] activeRound: 0
[v0] currentRound.playerScores.length: 107
[v0] ════════════════════════════════════════════════════
```

---

## How to Use This

1. **Refresh the tournament page**
2. **Open browser console** (F12 or DevTools)
3. **Look for [v0] logs** (may need to scroll up)
4. **Share the complete log output** from all layers
5. **Follow the decision tree** above to identify the issue

---

## To Collect All Logs

In browser console:
```javascript
// Filter and copy all [v0] logs
copy(
  Array.from(document.querySelectorAll('.console-message')).
  map(el => el.innerText).
  filter(t => t.includes('[v0]')).
  join('\n')
)
```

Or use the Network tab → disable cache → refresh → copy console output

---

## Next Steps After Collecting Logs

1. Identify which layer data becomes empty
2. Share the logs and we'll fix the specific layer
3. Once fixed, remove the logging (commented out)

