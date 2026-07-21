# Historical Dataset Specification

**Author:** Principal Statistician  
**Date:** 2026-07-20  
**Purpose:** Define the exact historical dataset for benchmarking all matching engine versions

---

## Overview

The historical dataset is the **single source of truth** for evaluating all current and future versions of the matching engine. It defines:
- Time period
- Tournament selection criteria
- Player inclusion/exclusion rules
- Data completeness thresholds
- Weather normalization
- Withdrawal/injury handling
- Field strength assessment

---

## Dataset Composition

### 1. Time Period

**Primary Benchmark Window:** PGA Tour 2015-2025 (11 seasons)
- **Rationale:** Sufficient history for statistical significance, post-ShotLink stabilization
- **Minimum for V1:** 2021-2025 (5 seasons), 120+ tournaments minimum
- **Expansion for ML:** 2010-2025 (15 seasons) for deep learning if pursued later

**Seasons Included:**
- 2021 Season (72 events)
- 2022 Season (73 events)
- 2023 Season (75 events)
- 2024 Season (76 events)
- 2025 Season (through launch date)

**Exclusions:**
- COVID-shortened 2020 season (non-representative field sizes)
- PGA Tour Champions / Korn Ferry Tour (different player population)

### 2. Tournament Selection

**Included:**
- ✅ All PGA Tour regular season events
- ✅ FedEx Cup Playoffs (3 events)
- ✅ Major Championships (4 per year)
- ✅ World Golf Championship events
- ✅ Players Championship
- ✅ Signature Events (new format events)

**Excluded:**
- ❌ Team events (4-ball, best ball — different dynamics)
- ❌ 54-hole events (incomplete data)
- ❌ International tours (different scheduling, fields)
- ❌ Mini tours

**Total Tournaments (V1 Benchmark):**
- 2021-2025: 378 tournaments minimum

### 3. Player Inclusion Criteria

**Included:**
- ✅ All players with world ranking
- ✅ Past champions invited fields
- ✅ International invitees
- ✅ Korn Ferry Tour members in limited events

**Excluded:**
- ❌ Players with no verifiable history (first appearance, one-off)
- ❌ Players with <3 prior PGA Tour appearances
- ❌ Players competing in 5+ courses simultaneously (unlikely to extrapolate)

**Minimum Data per Player:**
- ✅ 10 tournament appearances in dataset
- ✅ 3+ appearances at same venue (for venue history)
- ✅ 50+ rounds of scoring data

### 4. Data Completeness Thresholds

**Per Tournament:**
- ✅ All 72 holes completed (no 54-hole cuts due to weather)
- ✅ All rounds under par 75 or over par 81 (eliminate outliers)
- ✅ Field size: 120-160 players (standard)
- ✅ <5% withdrawals (exclude weather disasters)

**Per Player Score:**
- ✅ All 4 rounds completed or withdrew after round 2+ (official standing)
- ✅ No disqualifications
- ✅ Score differential: -12 to +18 relative to par (eliminate data errors)

**Missing Data Handling:**
- ❌ Never interpolate or estimate missing data
- ❌ Exclude tournaments with >5% missing scoring data
- ❌ Exclude players with incomplete round data

---

## Confounding Variable Control

### Weather Normalization

**Per Tournament:**
- Record daily weather conditions (wind, temperature, humidity, rain)
- Adjust field average scores for weather severity
- Create wind direction / wind speed vectors
- Track course hardness (green speed, rough height)

**ShotLink Metrics Included:**
- Driving distance (normalized for 0-wind baseline)
- Driving accuracy (weather-independent)
- Greens in regulation (weather-independent)
- Strokes Gained metrics (pre-normalized by ShotLink)

**Weather-Dependent Exclusion:**
- Exclude tournaments with >25% wind variation day-to-day
- Exclude weather delays >8 hours
- Normalize for temperature (affects ball carry)

### Course Setup Adjustments

**Course Difficulty Tracking:**
- Pin position severity (estimated from scoring average)
- Rough height (estimated from missed fairway penalty)
- Stimp reading (estimated from putting average)
- Green firmness (estimated from approach shot success)

**Exclude Anomalies:**
- Pin placements causing 30%+ scoring variation
- Course setup changes mid-tournament
- Unscheduled maintenance

### Field Strength Assessment

**Measurement by Tournament:**
- Average world ranking of field
- Strength of schedule rating
- Major championship representation %
- Recent form quality (field average SG last 8 weeks)

**Segmentation:**
- Elite fields (average ranking top 15)
- Strong fields (ranking top 30-50)
- Medium fields (ranking top 50-100)
- Weak fields (ranking 100+)

### Withdrawal & Injury Handling

**Withdrawals:**
- Post-round 2 withdrawal: Include official placement (missed cut)
- Pre-round 3 withdrawal: Exclude from ranking evaluation
- Injury-related: Exclude entire season if mid-tournament injury

**Rationale:** Post-cut withdrawals preserve prediction signal (model predicted correctly that player wouldn't compete well). Pre-cut withdrawals are data loss.

**Track Separately:**
- Withdrawals vs. completions by player/course combination
- Model should predict likelihood of withdrawal in v2+

---

## Dataset Statistics

**Expected Dataset Size (2021-2025):**

| Category | Quantity |
|----------|----------|
| Tournaments | 378 |
| Rounds | 65,520 |
| Scoring Records | 262,080 |
| Unique Players | 850+ |
| Player-Tournament Pairs | 18,500+ |
| Player-Venue Pairs | 3,200+ |
| Complete player histories | 200+ |

**Minimum for Statistical Significance:**
- 3,000+ player-tournament pairs for correlation tests (p<0.05)
- 300+ player-tournament pairs per course for venue-specific models
- 100+ tournaments per venue for historical patterns

---

## Dataset Versions

### V1 Benchmark Dataset (Current)

**Seasons:** 2021-2025 (5 seasons, 378 tournaments)  
**Players:** 200+ with complete data  
**Status:** Ready for Phase 16B  

### V2+ Historical Expansion

**Future:** 2015-2025 (11 seasons, 900+ tournaments)  
**Players:** 400+ with extended history  
**Use:** ML model training, deeper historical patterns  

---

## Data Quality Audit

**Pre-Benchmark Validation:**

- [ ] No duplicate scoring records
- [ ] All scores within expected range (-12 to +18)
- [ ] Tournament date ranges non-overlapping
- [ ] Player IDs consistent across seasons
- [ ] Course IDs consistent across years
- [ ] Weather data complete for 95%+ of tournaments
- [ ] <1% missing daily scoring
- [ ] No systematic day-of-week bias

**Annual Audit:**
- Performed each calendar year
- Validates new season data
- Updates field strength rankings
- Recalibrates weather normalization

---

## Query Specifications

**Standard Benchmark Query:**

```sql
SELECT 
  t.tournament_id,
  t.date,
  p.player_id,
  p.world_ranking,
  r.finish_position,
  SUM(r.score) as total_score,
  AVG(r.strokes_gained_total) as avg_sg,
  COUNT(CASE WHEN r.round_number <= 2 THEN 1 END) as rounds_played
FROM tournaments t
JOIN results r ON t.id = r.tournament_id
JOIN players p ON r.player_id = p.id
WHERE t.date BETWEEN '2021-01-01' AND '2025-12-31'
  AND t.tour = 'PGA'
  AND t.event_type NOT IN ('TEAM', 'INTERNATIONAL')
  AND t.field_size BETWEEN 120 AND 160
  AND p.tour_appearances >= 10
  AND r.rounds_completed = 4 OR r.withdrew_after_round >= 2
GROUP BY t.tournament_id, p.player_id
HAVING withdrawal_rate < 0.05
```

**Validation Query:**

```sql
-- Check for data completeness
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT tournament_id) as tournaments,
  COUNT(DISTINCT player_id) as players,
  MIN(score) as min_score,
  MAX(score) as max_score,
  STDDEV(score) as score_stdev
FROM benchmark_dataset
WHERE date BETWEEN '2021-01-01' AND '2025-12-31'
```

---

## Maintenance

**Dataset Update Schedule:**
- Weekly: Add new tournament results
- Monthly: Recalibrate field strength rankings
- Quarterly: Audit for data quality
- Annually: Expand historical window if pursuing ML

**Change Log:**
- All changes tracked with date, owner, rationale
- Versioned snapshots for reproducibility
- Never modify historical data; only add new data

---

**This dataset is the benchmark baseline. All model versions are judged against this single source of truth.**
