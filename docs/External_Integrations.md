# CaddieIQ External Integrations

**Documented:** July 20, 2026  
**Audience:** DevOps, Backend Engineers, Integration Leads  
**Purpose:** Complete reference for external data providers and integrations

---

## Integration Overview

CaddieIQ integrates with 6 major external providers:

| Provider | Status | Purpose | Update Frequency | Criticality |
|----------|--------|---------|------------------|------------|
| SportsDataIO | ✅ Production | Tournament, player, course, news master data | Real-time/Daily | CRITICAL |
| GolfCourseAPI | ✅ Production | Course coordinates, detailed characteristics | Weekly | HIGH |
| Weather API | ✅ Production | Current and forecast weather | Real-time | MEDIUM |
| DataGolf | ✅ Production | Strokes Gained statistics | Daily | HIGH |
| Odds Provider | ⚠️ Beta | Betting lines and odds | Real-time | MEDIUM |
| Geocoding | ✅ Production | Address to coordinates | One-time | LOW |

---

## 1. SportsDataIO

### Overview
**Status:** Production  
**Purpose:** Primary data source for tournaments, players, courses, and results  
**Provider:** SportsDataIO (sports data aggregator)  
**Maturity:** Stable, proven in production

### Authentication
```
API Endpoint: https://api.sportsdataio.com
Authentication: Header-based API key
Header: "X-API-Key: {SPORTSDATAIO_API_KEY}"
Rate Limit: 5,000 requests/day (standard tier)
```

### Data Provided

#### Tournaments
- Tournament schedule (name, dates, venue, format)
- Tournament status (scheduled, active, completed, canceled)
- Field entries (player commitments, withdrawals)
- Leaderboard and results
- Prize money

#### Players
- Player roster (name, nationality, ID)
- Player stats (career, season, recent)
- Player profiles (handedness, bio)
- Injury reports

#### Courses
- Course master data (name, location, holes)
- Course characteristics (grass type, par, yardage)
- Hole-by-hole details

#### Results
- Round scores
- Leaderboards
- Final results

#### News
- Tournament news
- Player news
- Tour announcements

### Importers
- `player-import.ts` - Imports player master data
- `tournament-import.ts` - Imports tournament schedules
- `course-import.ts` - Imports course master data
- `news-import.ts` - Imports news items
- `tournament-relations.ts` - Links tournaments to courses
- `field-relations.ts` - Links players to tournament fields

### Consumers
- All features depend on this core data
- Player rankings
- Tournament analysis
- DFS slates
- News feeds

### Failure Handling
- **Partial failures:** Continue with successful records, log failures
- **Full service down:** Return cached data with staleness marker
- **Rate limits:** Implement exponential backoff
- **Invalid data:** Log and skip record, don't fail entire import

### Refresh Strategy

#### Scheduled Updates
```typescript
// Daily: 3:00 AM UTC
Schedule: Player stats update
Data: Seasonal and career statistics

// Daily: 6:00 AM UTC
Schedule: Tournament update
Data: Updated schedules, any new tournaments

// Real-time during events
Schedule: Leaderboard updates
Data: Live scores, leaderboard position changes
```

#### On-Demand Imports
```typescript
// Via admin API: /api/imports/[type]
POST /api/imports/players
POST /api/imports/tournaments
POST /api/imports/courses
```

### Known Issues
1. **Lag:** Live scores can be 5-15 minutes behind source
2. **Missing data:** Some historical records incomplete
3. **Corrections:** Occasional score corrections require updates
4. **Duplicates:** Some players appear twice in dataset (merged IDs)

### Configuration
```env
SPORTSDATAIO_API_KEY=xxxxxxxxxxxx
SPORTSDATAIO_BASE_URL=https://api.sportsdataio.com
SPORTSDATAIO_TOUR_IDS=pga,dpwt,liv,lpga # Comma-separated
```

---

## 2. GolfCourseAPI

### Overview
**Status:** Production  
**Purpose:** Course coordinates, detailed hole-by-hole data, and characteristics  
**Provider:** GolfCourseAPI  
**Maturity:** Stable

### Authentication
```
API Endpoint: https://api.golfcourseapi.com
Authentication: API key (query parameter)
Parameter: ?apikey={GOLFCOURSEAPI_KEY}
Rate Limit: 1,000 requests/day (standard tier)
```

### Data Provided
- Course coordinates (latitude, longitude, elevation)
- Hole-by-hole data (par, handicap, length, green size)
- Course slope/rating
- Course amenities (clubhouse, pro shop, practice facility)
- Course photos

### Importers
- `course-geolocation.ts` - Maps course ID to coordinates and hole data

### Consumers
- Course intelligence (fit scoring needs coordinates)
- Mapping (venue location)
- Course browser UI

### Failure Handling
- **Missing coordinates:** Manual entry required (admin)
- **Partial data:** Use available data, mark incomplete
- **API errors:** Retry with exponential backoff, skip on timeout

### Refresh Strategy
```typescript
// Weekly: Monday 2:00 AM UTC
Schedule: Course data refresh
Scope: Updated course info, new courses
```

### Known Issues
1. **Coverage:** ∼85% of PGA venues, limited amateur courses
2. **Accuracy:** Some coordinates slightly off (±0.01°)
3. **Holes:** Some courses missing hole-by-hole data

### Configuration
```env
GOLFCOURSEAPI_KEY=xxxxxxxxxxxx
GOLFCOURSEAPI_BASE_URL=https://api.golfcourseapi.com
```

---

## 3. Weather API

### Overview
**Status:** Production  
**Purpose:** Current and forecast weather for tournament venues  
**Provider:** OpenWeatherMap (or similar)  
**Maturity:** Stable

### Authentication
```
API Endpoint: https://api.openweathermap.org
Authentication: API key (query parameter)
Parameter: ?appid={WEATHER_API_KEY}
Rate Limit: 60 calls/min (free tier); 1,000 calls/day (paid)
```

### Data Provided
- Current conditions (temperature, wind, humidity, precipitation)
- 5-day forecast (hourly or 3-hourly)
- Wind direction and speed
- Precipitation probability
- UV index

### Importers
- `weather-import.ts` - Fetches weather for tournament venues

### Consumers
- Weather intelligence
- Tournament analysis
- Player projections
- UI weather display

### Failure Handling
- **API down:** Use last known weather with staleness marker
- **Missing data:** Mark as unavailable, don't fail
- **Forecast errors:** Return available data

### Refresh Strategy
```typescript
// Real-time during tournaments
Schedule: Every 1 hour during active tournaments
Scope: Tournament venues only

// Off-season
Schedule: Daily at tournament start times
Scope: Upcoming tournaments (7-day forecast)
```

### Known Issues
1. **Accuracy:** Forecasts typically reliable 3 days out
2. **Microclimates:** Doesn't account for local variations
3. **Data lag:** Updates can be 15-30 minutes behind observation

### Configuration
```env
WEATHER_API_KEY=xxxxxxxxxxxx
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5
WEATHER_REFRESH_INTERVAL_MINUTES=60
```

---

## 4. DataGolf

### Overview
**Status:** Production  
**Purpose:** Advanced statistical models (Strokes Gained, player ratings)  
**Provider:** DataGolf  
**Maturity:** Established

### Authentication
```
API Endpoint: https://api.datagolf.com
Authentication: API key (header)
Header: "Authorization: Bearer {DATAGOLF_API_KEY}"
Rate Limit: 1,000 requests/day (standard tier)
```

### Data Provided
- Strokes Gained by category (off-tee, approach, short game, putting)
- Player rankings (various models)
- Win probability models
- Skill ratings

### Integration Points
- `lib/analytics/strokes-gained/` - SG calculations
- Player Intelligence - Input for player ratings

### Consumers
- Player intelligence (skill ratings)
- Analytics (strokes gained display)
- Rankings (alternative ranking system)
- Tournament analysis

### Failure Handling
- **API down:** Fall back to internal SG models
- **Missing player:** Return null, handle gracefully
- **Stale data:** Use cached data with staleness marker

### Refresh Strategy
```typescript
// Daily: 8:00 AM UTC
Schedule: Player statistics update
Scope: All players with tournament activity
```

### Known Issues
1. **Lag:** Data typically 24-48 hours behind competition
2. **Historical data:** Limited historical SG archive
3. **Coverage:** Only covers official PGA events

### Configuration
```env
DATAGOLF_API_KEY=xxxxxxxxxxxx
DATAGOLF_BASE_URL=https://api.datagolf.com
```

---

## 5. Odds Provider

### Overview
**Status:** Beta  
**Purpose:** Betting lines, odds, and implied probabilities  
**Provider:** [To be determined - currently integrated with generic odds aggregator]  
**Maturity:** Early stage

### Authentication
```
API Endpoint: https://api.odds-provider.com (placeholder)
Authentication: API key
Rate Limit: [To be determined]
```

### Data Provided
- Tournament winner odds (moneyline)
- Top 10/20/40 finishes
- Prop bets (various types)
- Live odds updates
- Line movement

### Importers
- `odds-import.ts` - Fetches current odds

### Consumers
- Betting intelligence
- Odds comparison UI
- Fair value calculation

### Failure Handling
- **Missing lines:** Mark as unavailable
- **Stale odds:** Return with timestamp
- **API errors:** Use last known odds

### Refresh Strategy
```typescript
// Real-time during tournaments
Schedule: Every 15 minutes during events
Scope: Active tournaments

// Off-event
Schedule: Daily at 8:00 PM UTC
Scope: Upcoming tournament odds
```

### Known Issues
1. **Coverage:** Limited to major sportsbooks
2. **Prop types:** Limited prop coverage
3. **Historical data:** No historical odds archive

### Configuration
```env
ODDS_PROVIDER_API_KEY=xxxxxxxxxxxx
ODDS_PROVIDER_BASE_URL=https://api.odds-provider.com
```

---

## 6. Geocoding

### Overview
**Status:** Production  
**Purpose:** Address to coordinates mapping (fallback for courses)  
**Provider:** Google Maps API (or similar)  
**Maturity:** Stable

### Authentication
```
API Endpoint: https://maps.googleapis.com
Authentication: API key
Rate Limit: 25,000 requests/day (paid tier)
Cost: ~$0.005 per request after free tier
```

### Data Provided
- Coordinates from address
- Address components (city, state, zip)
- Place details

### Integration Points
- Part of `course-geolocation.ts`
- Used when GolfCourseAPI missing data

### Consumers
- Course mapping
- Location-based features
- UI mapping display

### Failure Handling
- **No match:** Require manual entry
- **API errors:** Skip geocoding, use existing data

### Refresh Strategy
```typescript
// One-time per new course
Schedule: On-demand when course added
Scope: New course addresses
```

### Known Issues
1. **Cost:** Free tier limited, paid tier required at scale
2. **Accuracy:** Addresses sometimes ambiguous
3. **Coverage:** Works best in US/Western countries

### Configuration
```env
GOOGLE_MAPS_API_KEY=xxxxxxxxxxxx
GEOCODING_ENABLED=true
```

---

## Integration Architecture

### Data Flow

```
External Provider API
    ↓
Provider Layer (lib/providers/[provider]/)
    ↓ (returns raw typed response)
Domain Mapper (lib/domain/[entity]/mapper.ts)
    ↓ (returns domain model)
Validation Layer (planned)
    ↓ (validates business rules)
Repository Layer (lib/repositories/)
    ↓ (persists to database)
PostgreSQL
```

### Import Orchestration

```
Import Manager (lib/imports/import-manager.ts)
    ├→ Call providers in sequence
    ├→ Map to domain models
    ├→ Validate (when available)
    ├→ Upsert via repositories
    ├→ Build relationships
    └→ Record results in ImportRun
```

---

## Monitoring & Observability

### Health Checks

```typescript
// Check provider connectivity
GET /api/system-health/providers

// Response: { 
//   sportsdataio: { status: 'ok', lastCheck: '2026-07-20T...' },
//   weather: { status: 'error', reason: 'timeout' },
//   ...
// }
```

### Import Logs

```typescript
// View import history
GET /api/admin/imports

// Response: [
//   { id: '...', type: 'player', status: 'success', runAt: '...', records: 500 },
//   { id: '...', type: 'tournament', status: 'partial', failures: 3, ...  },
//   ...
// ]
```

### Error Tracking

| Level | Description | Action |
|-------|-------------|--------|
| CRITICAL | Service completely down, no fallback | Alert ops, manual intervention |
| HIGH | Service degraded, partial data loss | Log, use fallback, alert daily |
| MEDIUM | Some records failing, majority OK | Log, monitor trend |
| LOW | Individual record failures | Log only |

---

## Failure Scenarios & Recovery

### Scenario 1: SportsDataIO Down During Event

**Impact:** Live scores not updating  
**Detection:** API timeout after 3 retries  
**Response:**
1. Log alert
2. Serve cached leaderboard with staleness marker
3. Retry every 5 minutes
4. Notify admin if down >30 min

**Recovery:**
- When API recovers, do full import to catch up
- Verify data consistency
- Clear staleness marker

### Scenario 2: Weather API Rate Limited

**Impact:** Weather data not refreshing  
**Detection:** HTTP 429 response  
**Response:**
1. Implement exponential backoff (5s, 10s, 20s, ...)
2. Queue requests for retry
3. Use cached weather data

**Recovery:**
- When rate limit window resets, retry queued requests

### Scenario 3: Corrupted Data from Provider

**Impact:** Invalid player names, nonsensical scores  
**Detection:** Validation layer rejects records  
**Response:**
1. Log corruption event
2. Skip record (don't persist)
3. Alert human for investigation

**Recovery:**
- Manual data review
- Provider issue resolution
- Re-import affected records

### Scenario 4: Duplicate Player IDs

**Impact:** Same player appears twice in database  
**Detection:** Multiple slugs for same player  
**Response:**
1. Log duplicate detection
2. Create merge task for data team
3. Continue import (don't fail)

**Recovery:**
- Manual merge of duplicate records
- Update slug mapping

---

## Future Integration Plans

### Phase 16
- [ ] Multiple odds providers (fan Duel, bet365, etc.)
- [ ] Real-time push updates (webhooks instead of polling)
- [ ] GraphQL federation with providers

### Phase 17
- [ ] Player injury data provider
- [ ] Equipment preferences API
- [ ] Social media sentiment API

### Phase 18
- [ ] Alternative SG models (Statsbomb, PGA Tour)
- [ ] Advanced weather data (microclimates)
- [ ] Betting exchange APIs

### Phase 19
- [ ] Real-time shot-by-shot data
- [ ] Video clip integration
- [ ] Broadcast data feeds

---

## Development & Testing

### Mock Providers

Located in `lib/providers/__mocks__/`:

```typescript
// Mock SportsDataIO
const mockSportsDataIO = {
  getPlayer: async (id: string) => ({ /* mock player */ }),
  getTournament: async (id: string) => ({ /* mock tournament */ })
}
```

### Testing Integration

```typescript
// Test with mock provider
const provider = new MockSportsDataIOProvider()
const importer = new PlayerImporter(provider, repository)
const result = await importer.import(['123', '456'])
expect(result.success).toBe(true)
```

### Staging Environment

- Uses production-like data subset
- Rate limits set high for testing
- Can reset/reseed database
- Separate API keys from production

---

## Troubleshooting

### Import Stuck/Slow

```typescript
// Check import status
GET /api/admin/imports/current

// Check provider health
GET /api/system-health/providers

// Manually trigger retry
POST /api/admin/imports/retry?id=...
```

### Data Inconsistency

```typescript
// Check data coverage
GET /api/admin/data-coverage

// Export problematic data
GET /api/admin/exports/players?status=invalid

// Mark for re-import
POST /api/admin/reimport?type=player&ids=...
```

### Provider Rate Limit

```typescript
// View current rate limit status
GET /api/system-health/providers/sportsdataio

// Reset rate limit counter (careful!)
POST /api/admin/reset-rate-limit?provider=sportsdataio
```

