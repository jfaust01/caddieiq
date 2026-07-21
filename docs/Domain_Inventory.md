# CaddieIQ Domain Inventory

**Documented:** July 20, 2026  
**Audience:** Architects, product, technical leads  
**Purpose:** Complete catalog of business domains and their current state

---

## 1. Player Domain

**Purpose:** Represent professional golfers with skill metrics, demographics, and career history

**Current Maturity:** MVP  
**Primary Owner:** Player Intelligence Team

### Data Model
```
Player {
  id: string (CUID)
  externalRef: ExternalReference
  name: string
  nationality: string
  handedness: LEFT | RIGHT | UNKNOWN
  status: ACTIVE | INACTIVE | INJURED | RETIRED
  
  // Computed relationships
  statistics: PlayerStatistic[]
  rounds: Round[]
  fieldEntries: TournamentFieldEntry[]
}
```

### Dependencies
- SportsDataIO (player master data, roster)
- Player Statistics (computed from rounds)
- Rankings (computed from recent performance)

### Repositories
- `PlayerRepository` - Persistence

### Services
- `PlayerService` (planned) - Player-scoped operations

### Intelligence
- `PlayerIntelligence` - Skill ratings, projections, trends
- `PlayerSkillIntelligence` - Detailed skill models by statistic

### Known Limitations
- Limited career history (only recent seasons)
- No injury/status tracking from external sources
- No social media integration
- No equipment preferences

### Future Roadmap
- Phase 16: Career history archive
- Phase 17: Injury probability modeling
- Phase 18: Equipment preference tracking
- Phase 19: Player comparison tools

---

## 2. Course Domain

**Purpose:** Represent golf courses with characteristics, hole-by-hole details, and venue information

**Current Maturity:** MVP+  
**Primary Owner:** Course Team

### Data Model
```
Course {
  id: string (CUID)
  externalRef: ExternalReference
  name: string
  location: string
  country: string
  latitude: number
  longitude: number
  grassType: BENT | BERMUDA | POA | RYE | ZOYSIA | FESCUE | OTHER
  courseStyle: LINKS | PARKLAND | DESERT | HEATHLAND | MOUNTAIN | OTHER
  
  // Derived fields
  characteristics: CourseCharacteristic[]
  holes: Hole[]
}
```

### Dependencies
- SportsDataIO (course master data)
- GolfCourseAPI (coordinates, detailed characteristics)
- Geocoding (address → coordinates fallback)

### Repositories
- `CourseRepository` - Master course data
- `CourseCharacteristicRepository` - Course traits
- `CourseCoordinatesRepository` - Geolocation

### Services
- `CourseAnalyticsService` - Course analysis orchestration
- `CourseEnrichmentService` - Enrich with external data

### Intelligence
- `CourseIntelligence` - Course-fit scoring, player strength matching
- `CourseAnalytics` (planned) - Statistical course analysis

### Known Limitations
- Limited hole-by-hole data
- No real-time course conditions
- No amateur course support (PGA only)
- No user-generated course ratings

### Future Roadmap
- Phase 16: Hole-by-hole strokes gained
- Phase 17: Real-time greens speed/conditions
- Phase 18: Amateur course database
- Phase 19: Course rating/review system

---

## 3. Tournament Domain

**Purpose:** Represent golf tournaments with schedule, field, results, and format

**Current Maturity:** MVP+  
**Primary Owner:** Tournament Team

### Data Model
```
Tournament {
  id: string (CUID)
  externalRef: ExternalReference
  name: string
  tourType: PGA | DP_WORLD | LIV | KORN_FERRY | LPGA
  status: SCHEDULED | ACTIVE | COMPLETED | CANCELED
  format: STROKE_PLAY | MATCH_PLAY | TEAM | STABLEFORD
  startDate: Date
  endDate: Date
  course: Course (one-to-one)
  
  // Relationships
  field: TournamentFieldEntry[]
  rounds: Round[]
}
```

### Dependencies
- SportsDataIO (tournament schedule, results)
- Player domain (field composition)
- Course domain (venue)

### Repositories
- `TournamentRepository` - Tournament master data
- `TournamentFieldRepository` - Field entries
- `RoundRepository` - Round results

### Services
- `TournamentService` - Tournament orchestration
- `TournamentMappingConfidenceService` - Validate mappings

### Intelligence
- All intelligence domains consume tournament context
- `CommandCenter` - Tournament-wide analysis

### Known Limitations
- No amateur tournament support
- No international tour detail
- Limited tournament history (recent seasons only)
- No weather history at tournament level

### Future Roadmap
- Phase 16: Amateur tournament support
- Phase 17: International tour detail
- Phase 18: Tournament history archive
- Phase 19: Custom tournament creation (private/amateur)

---

## 4. Round & Statistics Domain

**Purpose:** Track player performance: scores, strokes gained, and hole-by-hole statistics

**Current Maturity:** MVP+  
**Primary Owner:** Analytics Team

### Data Model
```
Round {
  id: string (CUID)
  player: Player
  tournament: Tournament
  roundNumber: number
  status: SCHEDULED | IN_PROGRESS | COMPLETED | CANCELED
  totalScore: number
  
  // Relationships
  statistics: RoundStatistic[]
}

RoundStatistic {
  id: string (CUID)
  round: Round
  holeNumber: number
  score: number
  strokesGained: number
  statisticType: STROKES_GAINED | SCRAMBLING | GIR | etc.
  value: number
}
```

### Dependencies
- SportsDataIO (round scores, results)
- DataGolf (strokes gained calculations)
- Player domain (player reference)
- Tournament domain (tournament reference)

### Repositories
- `RoundRepository` - Round persistence
- `RoundStatisticRepository` - Statistic persistence

### Intelligence
- `Analytics/StrokesGained` - SG calculations
- `Analytics/RecentForm` - Recent performance trends

### Known Limitations
- Limited hole-by-hole strokes gained
- No club-level data
- No shot-by-shot data (not available from sources)
- No amateur round tracking

### Future Roadmap
- Phase 16: Enhanced SG metrics
- Phase 17: Amateur round tracking
- Phase 18: Detailed shot-by-shot scoring
- Phase 19: Custom scoring entry

---

## 5. News Domain

**Purpose:** Track tournament and player-specific news, updates, and announcements

**Current Maturity:** MVP  
**Primary Owner:** Content Team

### Data Model
```
News {
  id: string (CUID)
  externalRef: ExternalReference
  title: string
  summary: string
  content: string
  source: string
  publishedAt: Date
  
  // Relationships
  tournament: Tournament (optional)
  players: Player[]
}
```

### Dependencies
- SportsDataIO (news feed)
- Providers (future: multiple news sources)

### Repositories
- `NewsRepository` - News persistence

### Services
- `NewsService` (planned) - News filtering, relevance

### Intelligence
- `NewsIntelligence` (planned) - News sentiment, impact modeling

### Known Limitations
- Limited to official sources
- No news aggregation
- No sentiment analysis
- No player annotation

### Future Roadmap
- Phase 16: Multiple news sources
- Phase 17: Sentiment analysis
- Phase 18: Player tagging
- Phase 19: Community comments

---

## 6. Betting & Odds Domain

**Purpose:** Track and analyze betting odds, lines, and implied probabilities

**Current Maturity:** Alpha  
**Primary Owner:** Analytics Team

### Data Model
```
Betting {
  id: string (CUID)
  externalRef: ExternalReference
  tournament: Tournament
  player: Player
  betType: MONEYLINE | PROP | TOP_10 | TOP_20 | etc.
  sportsbook: string
  line: number
  impliedProbability: number
  timestamp: Date
}
```

### Dependencies
- Odds provider (real-time odds)
- Tournament domain (tournament reference)
- Player domain (player reference)

### Repositories
- `BettingRepository` - Betting data persistence

### Services
- (Planned) - Odds comparison, line movement

### Intelligence
- `OddsIntelligence` - Probability modeling, discrepancies

### Known Limitations
- Limited sportsbook coverage
- No historical odds
- No line movement tracking
- Limited prop types

### Future Roadmap
- Phase 16: Expanded sportsbook coverage
- Phase 17: Historical odds archive
- Phase 18: Line movement analysis
- Phase 19: Prop betting models

---

## 7. Fantasy/DFS Domain

**Purpose:** DFS slates, salary allocations, and value analysis

**Current Maturity:** MVP  
**Primary Owner:** DFS Team

### Data Model
```
Fantasy {
  id: string (CUID)
  externalRef: ExternalReference
  tournament: Tournament
  sportsbook: DRAFTKINGS | FANDUEL | etc.
  slateType: CLASSIC | GPP | SHOWDOWN | etc.
  players: DFSPlayer[]
}

DFSPlayer {
  id: string (CUID)
  player: Player
  salary: number
  projectedPoints: number
  value: number  // projected / salary
}
```

### Dependencies
- SportsDataIO (DFS slates)
- Player Intelligence (projections)
- Analytics (value scoring)

### Repositories
- `FantasyRepository` - Slate persistence
- `DFSPlayerRepository` - Player allocation

### Services
- `DFSValueService` - Value calculation

### Intelligence
- `DFSValue` - Player value, salary efficiency

### Known Limitations
- Limited to major sportsbooks
- No lineup optimization
- No contest structure
- No historical slate data

### Future Roadmap
- Phase 16: Additional sportsbooks
- Phase 17: Lineup optimizer
- Phase 18: Contest analysis
- Phase 19: Historical performance tracking

---

## 8. Course Intelligence Domain

**Purpose:** Analyze courses, identify player strengths/weaknesses, predict course fit

**Current Maturity:** MVP+  
**Primary Owner:** AI/Analytics Team

### Key Capabilities
- Course-fit scoring (player vs. course match)
- Player strength/weakness identification
- Birdie/bogey hole identification
- Course difficulty ranking
- Course comparison

### Algorithm Inputs
- Course characteristics (grass, style, layout)
- Player statistics (recent performance)
- Historical player-course results
- Weather conditions

### Outputs
- Course fit score (0-100)
- Confidence level
- Explanation (text)
- Risk/reward analysis

### Known Limitations
- Limited historical player-course data
- No real-time course conditions
- Simplified confidence modeling
- No visual course breakdown

### Roadmap
- Phase 16: Visual course analysis
- Phase 17: Real-time condition adjustments
- Phase 18: Predictive confidence modeling
- Phase 19: Alternative course scenarios

---

## 9. Player Intelligence Domain

**Purpose:** Skill ratings, projections, trend analysis, and player comparisons

**Current Maturity:** MVP  
**Primary Owner:** Analytics/ML Team

### Key Capabilities
- Player skill rating across statistics
- Trend detection (improving/declining)
- Form adjustment (recent vs. season)
- Injury probability (planned)
- Player comparison

### Outputs
- Skill ratings (0-100 per statistic)
- Trend indicators (up/stable/down)
- Confidence levels
- Projections for next round

### Known Limitations
- Limited sample size (recent seasons)
- No injury data integration
- Simplified trend detection
- No career arc modeling

### Roadmap
- Phase 16: Career arc modeling
- Phase 17: Injury probability
- Phase 18: Equipment impact
- Phase 19: Peer comparison

---

## 10. DFS Value Domain

**Purpose:** Calculate fantasy points, salary efficiency, and DFS recommendations

**Current Maturity:** MVP+  
**Primary Owner:** DFS Team

### Key Capabilities
- Projected fantasy points calculation
- Salary efficiency scoring
- Value tier identification
- Contrarian detection
- Stack identification

### Algorithm Inputs
- Player skill ratings
- Course fit analysis
- Salary allocation
- Recent performance
- Weather

### Outputs
- Projected points
- Value score
- Recommendation tier (value/mid/fade/pivot)
- Salary efficiency

### Known Limitations
- Simplified stacking logic
- Limited contrarian detection
- No lineup-level optimization
- No game theory modeling

### Roadmap
- Phase 16: Advanced stacking
- Phase 17: Lineup optimization
- Phase 18: Game theory models
- Phase 19: Contrarian detection

---

## 11. Odds Intelligence Domain

**Purpose:** Analyze betting odds, implied probabilities, and value bets

**Current Maturity:** Alpha  
**Primary Owner:** Analytics Team

### Key Capabilities
- Implied probability extraction
- Fair value calculation
- Line discrepancy detection
- Sportsbook comparison

### Algorithm Inputs
- Betting lines (multiple sportsbooks)
- Internal win probability models
- Historical accuracy
- Player skill ratings

### Outputs
- Fair value probability
- Discrepancy indicators
- Sportsbook differences
- Betting recommendations (planned)

### Known Limitations
- Limited sportsbook data
- No historical accuracy tracking
- Simplified fair value models
- No risk modeling

### Roadmap
- Phase 16: Multi-book aggregation
- Phase 17: Historical accuracy
- Phase 18: Kelly Criterion modeling
- Phase 19: Automated alerts

---

## 12. Weather Intelligence Domain

**Purpose:** Analyze weather impact on scoring and course difficulty

**Current Maturity:** MVP  
**Primary Owner:** Analytics Team

### Key Capabilities
- Weather data collection
- Weather impact on scoring
- Wind direction/speed analysis
- Temperature impact
- Precipitation effect

### Outputs
- Course difficulty adjustment
- Player performance adjustment
- Weather-specific recommendations

### Known Limitations
- Limited historical weather data
- Simplified wind models
- No microclimatic effects
- No long-term forecasting

### Roadmap
- Phase 16: Historical weather archive
- Phase 17: Advanced wind modeling
- Phase 18: Microclimate analysis
- Phase 19: Extended forecasting

---

## 13. Analytics Domains

**Purpose:** Statistical analysis and derived metrics

### Strokes Gained (`lib/analytics/strokes-gained`)
- Integrates with DataGolf
- Calculates SG by category
- Benchmarks against tour average

### Recent Form (`lib/analytics/recent-form`)
- Tracks performance over last N rounds
- Calculates form trend
- Identifies hot/cold streaks

### Momentum (`lib/analytics/momentum`)
- Analyzes trend strength
- Calculates momentum score
- Detects inflection points

### Value (`lib/analytics/value`)
- Player value calculation
- Salary efficiency analysis
- Value tier identification

### Consistency (`lib/analytics/consistency`)
- Measures performance consistency
- Calculates variance
- Identifies streaky players

### Wind Analysis (`lib/analytics/wind`)
- Analyzes wind impact
- Models wind resistance
- Calculates wind-adjusted projections

---

## 14. External Data Quality

### Data Completeness
- **Players:** 95% (major tours covered)
- **Courses:** 85% (PGA venues complete, some characteristics missing)
- **Tournaments:** 90% (major tours, limited history)
- **Rounds/Stats:** 85% (recent seasons, limited history)
- **News:** 80% (official sources only)
- **Odds:** 75% (limited sportsbooks)

### Data Freshness
- **Player rosters:** Real-time updates
- **Tournament schedules:** Daily refresh
- **Scores/rounds:** Real-time during events
- **News:** Daily refresh (hourly during events)
- **Odds:** Real-time updates
- **Weather:** Real-time updates

### Known Data Issues
1. Missing course coordinates (∼5% of courses)
2. Incomplete player career history (recent seasons only)
3. Limited historical odds data
4. No amateur tournament data
5. Limited prop betting data

---

## Integration Readiness Matrix

| Domain | Import System | Validation | Testing | Documentation |
|--------|---------------|-----------|---------|---|
| Player | ✅ Complete | ⚠️ Partial | ✅ Full | ✅ Full |
| Course | ✅ Complete | ⚠️ Partial | ✅ Full | ✅ Full |
| Tournament | ✅ Complete | ⚠️ Partial | ✅ Full | ✅ Full |
| Round | ✅ Complete | ⚠️ Partial | ✅ Full | ✅ Full |
| News | ✅ Complete | ⚠️ Partial | ⚠️ Basic | ✅ Full |
| Betting | ⚠️ Partial | ❌ None | ⚠️ Basic | ⚠️ Basic |
| Fantasy | ✅ Complete | ⚠️ Partial | ✅ Full | ✅ Full |

---

## Domain Dependencies Graph

```
Tournament
  ├→ Course
  ├→ Players (via TournamentField)
  └→ Rounds
      └→ RoundStatistics

Player
  ├→ Statistics
  ├→ News
  ├→ Betting
  └→ Fantasy

Intelligence Domains (all depend on)
  ├→ Player Intelligence (input)
  ├→ Course Intelligence (input)
  ├→ Analytics (input)
  └→ Rankings (output)
```

---

## Unimplemented Domains (Planned)

### Injury Domain
- Tracks known injuries
- Predicts injury probability
- Models return-to-play

### Equipment Domain
- Player equipment preferences
- Equipment impact on performance
- Sponsor tracking

### Social/Community Domain
- User profiles
- Player ratings
- Community discussions

### Betting Recommendation Domain
- Betting signals
- Value opportunities
- Risk management

### Advanced Prediction Domain
- Tournament winner prediction
- Leaderboard modeling
- Hedge strategies

