# Failure Points & Recovery Analysis

**Phase:** 15.3B Documentation

## Critical Path Failures

### 1. Tournament Not Found
**Detection:** TournamentRepository returns null  
**Current Handling:** API returns 404  
**User Impact:** Page shows "Tournament not found"  
**Recovery:** Manual tournament import or creation

### 2. Field Empty
**Detection:** TournamentField has 0 players  
**Current Handling:** Service returns empty leaderboard  
**User Impact:** Leaderboard shows "No players committed"  
**Recovery:** Wait for field import, manual player addition

### 3. Player Skill Data Missing
**Detection:** PlayerSkillRepository returns empty  
**Current Handling:** Service returns unavailable profile  
**User Impact:** Leaderboard shows "Calculating..." or null skills  
**Recovery:** Automatic on next build cycle (monthly)

### 4. Course Data Incomplete
**Detection:** Missing holes or tees  
**Current Handling:** CourseIntelligenceService returns null  
**User Impact:** Course Intel unavailable  
**Recovery:** Complete import or manual data entry

---

## Provider Failures

### SportsDataIO Down
**Detection:** HTTP 5xx, timeout  
**Current Handling:** Log error, retry with exponential backoff  
**Recovery:**
- Immediate: Show cached data (if available)
- Short-term: Retry every 5 minutes for 4 hours
- Long-term: Manual rerun or wait for next scheduled import

### GolfCourseAPI Rate Limited
**Detection:** HTTP 429  
**Current Handling:** Queue import, retry after rate limit window  
**Recovery:**
- Wait for rate limit reset
- Partial import (prioritize courses for upcoming tournaments)

### Weather API Unavailable
**Detection:** HTTP 5xx, timeout  
**Current Handling:** Use fallback provider or cached forecast  
**Recovery:**
- If fallback fails, return honest "unavailable" (don't fabricate)
- UI shows "Weather data unavailable"
- Try again in 1 hour

### News Feeds Down
**Detection:** RSS fetch timeout  
**Current Handling:** Log error, skip feed, try others  
**Recovery:**
- Try next feed source
- Skip feed for this cycle
- Retry on next scheduled import (1 hour)

---

## Data Quality Failures

### Validation Failures
| Failure | Example | Handling |
|---------|---------|----------|
| Missing required field | Player without name | Skip record, log |
| Invalid data type | CourseRating = "ABC" | Skip record, log |
| Constraint violation | Duplicate ID | Update existing, log |
| Referential integrity | courseId doesn't exist | Skip record, log |

### Normalization Failures
| Failure | Example | Handling |
|---------|---------|----------|
| Date parsing fails | Date = "invalid-date" | Skip record, log |
| Currency conversion fails | Price = NaN | Skip record, log |
| Name parsing fails | Name too long | Truncate, log warning |

---

## Service Layer Failures

### Player Skill Build Fails
**Trigger:** Engine error during batch build  
**Impact:** All players' skills become stale  
**Handling:**
- Log error for each player
- Fail gracefully (skip that player)
- Continue building others
- Report summary to admin

**Recovery:**
- Investigate error logs
- Fix root cause
- Rerun build for failed players

### Course Intelligence Calc Fails
**Trigger:** Missing course specifications  
**Impact:** Course intel unavailable  
**Handling:** Return null, not error  
**Recovery:** Complete course import, recalc

### DFS Value Calc Fails
**Trigger:** Missing salary data  
**Impact:** DFS projections unavailable  
**Handling:** Return 503 (service unavailable)  
**Recovery:** Retry when salary data available

---

## API Failures

### Tournament Endpoint 500 Error
**Trigger:** Unhandled exception in route handler  
**Impact:** Page doesn't load  
**Handling:**
- Log error with context
- Return 500 response
- UI shows "Error loading tournament"

**Recovery:**
- Investigate logs
- Fix root cause
- User retries page load

### Batch Player Skill Endpoint Timeout
**Trigger:** Too many players, query takes > 30s  
**Impact:** Leaderboard doesn't load  
**Handling:**
- Implement query pagination (max 50 players)
- Cache results (5 minutes)
- Return 504 if still timeout

**Recovery:**
- Optimize query (add indexes)
- Implement query batching
- User retries (gets cached result)

---

## Database Failures

### Constraint Violation
**Example:** Duplicate tournament ID  
**Handling:** Update existing record (upsert)  
**Impact:** No data loss, seamless

### Connection Pool Exhausted
**Detection:** "Too many connections" error  
**Handling:** Queue requests, retry exponentially  
**Impact:** Slow API response, eventual timeout  
**Recovery:** DB auto-recovers, requests retry

### Transaction Deadlock
**Detection:** Transaction timeout  
**Handling:** Automatic rollback + retry  
**Impact:** Brief service interruption  
**Recovery:** Automatic (built-in retry logic)

---

## Cascading Failures

### Tournament + Course Both Missing
**Impact:** Page completely unusable  
**Handling:** Show error page with recovery instructions  
**Recovery:** Import both entities

### All Intelligence Engines Fail
**Impact:** Tournament Intel tab completely unavailable  
**Handling:** Show "No intelligence data available"  
**Recovery:** Fix underlying data (complete imports)

### Salary Import Fails
**Impact:** DFS, Odds, Betting features unavailable  
**Handling:** Show "DFS data unavailable"  
**Recovery:** Retry salary import

---

## Network Failures

### Client Network Timeout
**Detection:** Request timeout > 30s  
**Handling:** Browser automatic retry + user manual retry  
**Recovery:** User retries (receives cached or new data)

### CDN Down
**Detection:** Static assets 5xx  
**Handling:** Browser fallback + fallback CDN  
**Recovery:** CDN auto-recovers

---

## Monitoring & Alerting

**Critical Alerts:**
- Tournament import fails
- Course import fails
- Skill build fails (all players)
- API endpoints returning 5xx > 1%

**Warning Alerts:**
- Provider API degraded
- Database query slow (> 1s)
- Salary import delayed
- Weather forecast unavailable

**Logging:**
- Every failure logged with context
- Import success/failure counts
- Service latency by endpoint
- Error rate by data source

---

## Recovery Patterns

### Pattern 1: Automatic Retry
```
Try → Fail → Log → Wait → Retry (exponential backoff)
```
Used for: Provider APIs, transient errors

### Pattern 2: Fallback
```
Try Primary → Fail → Try Fallback → Fail → Return Unavailable
```
Used for: Weather providers, data sources

### Pattern 3: Graceful Degradation
```
Try Load Feature → Fail → Load Without Feature → Return Partial Response
```
Used for: Optional data (weather, news), non-blocking features

### Pattern 4: Manual Intervention
```
Try Auto → Fail → Log → Alert Admin → Admin Manual Fix
```
Used for: Data quality issues, critical imports

