# Cross-Domain Dependency Graph

**Phase:** 15.3B Documentation

## Dependency Matrix

```
                    Tournament | Course | Player | Weather | News | DFS | Odds | P.Skill | C.Intel
────────────────────────────────────────────────────────────────────────────────────────────────
Tournament          -          | ✓      | ✓      | ✓       | ✓    | ✓   | ✓    | -       | -
Course              ✗          | -      | -      | -       | -    | -   | -    | -       | ✓
Player              ✗          | -      | -      | -       | -    | -   | -    | ✓       | -
Weather             ✗          | ✗      | ✗      | -       | -    | ✓   | -    | -       | -
News                ✗          | ✗      | ✗      | ✗       | -    | -   | -    | -       | -
DFS                 ✓          | ✓      | ✓      | ✓       | ✗    | -   | ✓    | ✓       | ✓
Odds                ✗          | -      | -      | -       | -    | ✓   | -    | -       | -
Player Skill        ✓          | ✓      | ✓      | ✓       | ✗    | ✓   | -    | -       | ✓
Course Intel        ✓          | ✓      | ✗      | ✗       | ✗    | ✓   | ✗    | ✗       | -
```

**Legend:**
- ✓ = depends on (upstream)
- ✗ = independent of
- `-` = self

## Critical Upstream Dependencies

### To Render Tournament Detail Page:
1. **Tournament** (required)
   - No tournament = no page

2. **Course** (optional)
   - Linked from Tournament
   - If missing, course intel unavailable

3. **Player** (required for field)
   - Tournament field requires players
   - If player missing, removed from field

4. **Weather** (optional)
   - Used for context
   - If unavailable, shows "unavailable" message

5. **News** (optional)
   - Used for intel tab
   - If unavailable, empty feed

6. **Player Skill** (required for leaderboard)
   - Each field player needs skill profile
   - If missing, shows "calculating..." or null

7. **Course Intelligence** (optional)
   - Used for intel tab
   - If unavailable, shows "unavailable"

8. **DFS Value** (optional)
   - Calculated on-demand per tournament
   - If unavailable, skipped

## Dependency Chains

### Tournament Detail Page Render
```
Page
├─ Tournament (must exist)
├─ Course (linked, optional)
│  └─ Course Intelligence (optional)
│     ├─ CourseDetails
│     ├─ CourseHole[]
│     └─ CourseTee[]
├─ TournamentField (required)
│  └─ Player[] (required)
│     └─ PlayerSkill[] (required)
│        ├─ Round[]
│        └─ RoundStatistic[]
├─ Weather (optional)
│  └─ WeatherSnapshot (optional)
├─ News (optional)
│  └─ NewsArticle[] (optional)
├─ DFS (optional, per-request)
│  ├─ PlayerSkill (already loaded)
│  ├─ CourseFit (depends on Course + Player)
│  ├─ DfsSalary (required)
│  └─ OddsQuote (optional)
└─ Odds (optional)
   └─ OddsQuote[] (optional)
```

## Circular Dependency Check

**Critical:** No circular dependencies exist

**Verification:**
```
Tournament → Course → CourseIntelligence
  ✓ No back-reference to Tournament

Player → PlayerSkill → [depends on Player samples]
  ✓ No back-reference to PlayerSkill

DFS → PlayerSkill + CourseFit
  ✓ Both are read-only, no back-reference
```

## Failure Propagation

### If Tournament unavailable:
- Page shows 404
- All dependent features unavailable

### If Course unavailable:
- Tournament still loads
- Course intelligence shows "unavailable"
- Page degrades gracefully

### If Player missing from field:
- Field renders without that player
- Leaderboard shows remaining players
- DFS rankings skip player

### If PlayerSkill unavailable:
- Leaderboard shows "calculating..."
- DFS rankings skip player
- Course fit unavailable for that player

### If Weather unavailable:
- Weather section shows "unavailable"
- DFS still calculates (uses default weather)
- Page degrades gracefully

### If News unavailable:
- News tab shows empty feed
- No error
- Page loads normally

### If DFS unavailable:
- DFS tab shows "calculating..."
- Does NOT block page load
- Ephemeral calculation, retry on next request

## Performance Implications

### Critical Path (must optimize):
1. Tournament lookup
2. Field lookup
3. Player skill batch load
4. Course intelligence lookup

### Secondary Path (can be async):
1. Weather fetch
2. News fetch
3. DFS calculation

### Deferred (lazy load):
1. Historical player stats
2. Player bio
3. Archive news

