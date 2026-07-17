# Rounds Table Implementation Plan

## Overview
Complete the final missing layer of the leaderboard pipeline by adding service methods and UI component to display tournament round scoring.

## Files to Create

### 1. Service Extension
**File:** `/features/tournaments/services/tournament-service.ts`

**Addition:** Add `getRoundsByTournament()` method
- Queries rounds using existing RoundRepository
- Joins with PlayerRound data
- Returns UI-shaped RoundWithScores array
- Handles missing data gracefully

### 2. UI Component
**File:** `/features/tournaments/components/tournament-rounds-table.tsx`

**Responsibility:** Display rounds leaderboard
- Tab-based navigation (Round 1, 2, 3, 4, Overall)
- Table layout with sortable columns
- Player status highlighting (leader, top 10, made cut, missed cut, withdrawn)
- Empty state handling

## Repositories Reused
✅ `RoundRepository.getByTournament()` - Get all rounds for tournament
✅ `PlayerRoundRepository.getByRound()` - Get player scores for round
✅ `getFieldRepository()` - Resolve player names from field entries

## Database Queries
```sql
-- Fetch rounds for tournament
SELECT * FROM "round" WHERE "tournamentId" = ? ORDER BY "roundNumber" ASC

-- Fetch player scores for round (via PlayerRoundRepository)
SELECT pr.* 
FROM "player_round" pr
WHERE pr."roundId" = ?
INCLUDE player name from TournamentField join
```

## Data Flow
```
Tournament Page
  ↓
tournament-service.getRoundsByTournament()
  ↓ RoundRepository.getByTournament()
  ↓ PlayerRoundRepository.getByRound() (for each round)
  ↓
TournamentRoundsTable Component
  ↓
Display tabbed rounds with player scores
```

## Component Structure
```
TournamentRoundsTable
  ├── Tabs (Round 1, 2, 3, 4, Overall)
  ├── Toolbar (Sort controls)
  └── Table
      ├── Row (Player with score + status badges)
      ├── Status highlights
      └── Sorting
```

## Styling Reused
- Card + Table layout from CaddieIQ leaderboards
- Badge styling for status indicators
- Skill Leaderboards component structure as template
- DFS Leaderboards row styling for consistency

## Performance
- No new database queries beyond existing repositories
- Cached using React cache() like other tournament methods
- Handles 100+ player tables efficiently
- Optional: Lazy-load tabs if performance needed

## Empty State Handling
1. **No rounds imported:** "No round scoring has been imported for this tournament."
   - Admin button to trigger import (if user is admin)
2. **Tournament not started:** "Round scoring will become available once play begins."
3. **No player scores:** "No scoring data available."

## Integration Point
Add to tournament-command-center.tsx after DFS Leaderboards section

## Success Criteria
✅ Displays all rounds for tournament
✅ Shows player scores with accurate status
✅ Supports sorting by position, score, player
✅ Graceful empty states
✅ Matches existing CaddieIQ styling
✅ No duplicate query logic
✅ Reuses existing repositories
