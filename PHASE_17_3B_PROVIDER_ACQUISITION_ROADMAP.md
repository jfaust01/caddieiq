# Provider Acquisition Roadmap

**Phase**: 17.3B (Design)  
**Date**: 2026-07-20  
**Status**: Acquisition strategy defined (no data fetched yet)

---

## PROVIDER ANALYSIS

### Provider Landscape

| Provider | Datasets | Type | Status | Access Model | Cost |
|----------|----------|------|--------|--------------|------|
| **SportsDataIO** | Player Stats, Outcomes | Licensed API | ✅ Licensed | API Key | Included |
| **DataGolf** | OWGR Rankings, Ratings | Licensed API | ✅ Licensed | API Key | Included |
| **DraftKings** | Salaries, Ownership | Public API | ✅ Public | HTTP | Free |
| **Genius Sports** | Betting Odds | Licensed API | ⏳ To Evaluate | API Key | Separate License |
| **OWGR** | Rankings (direct) | Public API | ⏳ Limited | Query | Free (rate-limited) |
| **PGA Tour** | Outcomes (direct) | Public API | ⏳ Limited | Feed | Free (deprecated?) |
| **Internal** | Course Fit, Rolling Form | Computed | ✅ Ready | N/A | N/A |

---

## DATASET → PROVIDER MAPPING

### **Dataset 1: Historical OWGR Rankings**

| Property | Value |
|----------|-------|
| **Primary Provider** | DataGolf (maintains 5+ year OWGR archive) |
| **Fallback Provider** | OWGR API (rate-limited, newer data only) |
| **Access Model** | API key (already licensed) |
| **Historical Depth** | 5+ years available |
| **Update Frequency** | Weekly (Thursday OWGR release) |
| **Sample Endpoint** | `GET https://www.datagolf.com/api/player-rankings?date=2026-02-20` |
| **Authentication** | Bearer token in Authorization header |
| **Rate Limits** | 100 req/min (sufficient for bulk import) |
| **Data Format** | JSON array of { player_id, owgr_rank, owgr_points, effective_date } |
| **Cost** | Included in existing DataGolf license |
| **Next Steps** | Validate API credentials; test single-week fetch |

---

### **Dataset 2: Historical Player Statistics (SG)**

| Property | Value |
|----------|-------|
| **Primary Provider** | SportsDataIO (comprehensive PGA stats) |
| **Fallback Provider** | DataGolf (alternative stat definitions) |
| **Access Model** | REST API with API key |
| **Historical Depth** | 3+ years available |
| **Update Frequency** | Weekly (post-tournament) |
| **Sample Endpoint** | `GET https://api.sportsdataio.com/v3/golf/players/{player_id}/stats/seasonal?year=2023` |
| **Authentication** | API Key in query parameter |
| **Rate Limits** | 1000 req/day (batch friendly) |
| **Data Format** | JSON with fields: sg_driving, sg_approach, sg_putting, sg_around_green, sg_total |
| **Cost** | Included in existing SportsDataIO license |
| **Challenges** | SG definitions vary by year (PGA Tour methodology changes) |
| **Next Steps** | Confirm stat definitions for 2023-2026; validate API response structure |

---

### **Dataset 3: Historical DraftKings Salaries**

| Property | Value |
|----------|-------|
| **Primary Provider** | DraftKings Public API (contests and entries) |
| **Fallback Provider** | Manual capture + DraftKings historical data export |
| **Access Model** | HTTP GET (no auth required for public data) |
| **Historical Depth** | ~3 years (if continuously captured) |
| **Update Frequency** | Per-tournament (static after lock) |
| **Sample Endpoint** | `GET https://www.draftkings.com/gapi/sportscards/sports/81` (golf contests) |
| **Authentication** | None (public endpoint) |
| **Rate Limits** | No published limits; respectful 1 req/sec assumed |
| **Data Format** | JSON sport cards with{ player_id, salary, contest_id } |
| **Cost** | FREE (public API) |
| **Challenges** | DraftKings may deprecate public API; require fallback to archive service |
| **Next Steps** | Validate current public API endpoint; establish archive service or capture process |

---

### **Dataset 4: Historical Betting Odds**

| Property | Value |
|----------|-------|
| **Primary Provider** | Genius Sports (licensed odds API) |
| **Fallback Provider** | BetRivers historical feed (if available) |
| **Access Model** | Licensed API with authentication |
| **Historical Depth** | 3+ years (available from Genius Sports) |
| **Update Frequency** | Per-tournament (pre-lock, at-lock, closing) |
| **Sample Endpoint** | `GET https://api.geniussports.com/odds/tournaments/{id}/markets` |
| **Authentication** | OAuth2 or API Key (to be confirmed with provider) |
| **Rate Limits** | TBD (check with Genius Sports) |
| **Data Format** | JSON with fields: win_odds, ou_finish, captured_timestamp, vig |
| **Cost** | Requires separate license negotiation (est. $5K-20K/year) |
| **Status** | ⏳ PENDING EVALUATION - must evaluate ROI vs cost |
| **Next Steps** | Contact Genius Sports for historical data availability and licensing terms |

---

### **Dataset 5: Historical DFS Ownership (Optional)**

| Property | Value |
|----------|-------|
| **Primary Provider** | DraftKings archive or third-party DFS data service |
| **Fallback Provider** | Manual capture from contest details pages |
| **Access Model** | Historical export or API if available |
| **Historical Depth** | 2+ years (best-effort) |
| **Update Frequency** | Per-tournament (multiple snapshots if captured) |
| **Sample Endpoint** | TBD (DraftKings does not publish historical ownership) |
| **Authentication** | TBD |
| **Rate Limits** | TBD |
| **Data Format** | { tournament_id, player_id, ownership_pct, captured_at } |
| **Cost** | FREE (public data) or archive service cost |
| **Priority** | 🟢 LOW (optional context, not required for replay) |
| **Status** | ⏳ DEFER - implement only if time permits |
| **Next Steps** | Research third-party DFS data services; assess cost/benefit |

---

### **Dataset 6: Historical Tournament Outcomes**

| Property | Value |
|----------|-------|
| **Primary Provider** | SportsDataIO (PGA Tour results feed) |
| **Fallback Provider** | PGA Tour API (if available) |
| **Access Model** | REST API with API key |
| **Historical Depth** | 5+ years available |
| **Update Frequency** | Live during tournament, finalized post-event |
| **Sample Endpoint** | `GET https://api.sportsdataio.com/v3/golf/tournaments/{id}/leaderboard` |
| **Authentication** | API Key in query parameter |
| **Rate Limits** | 1000 req/day |
| **Data Format** | JSON with fields: player_id, finish_position, total_score, status |
| **Cost** | Included in existing SportsDataIO license |
| **Dependencies** | **PREREQUISITE** for computing Dataset 7 (Course Fit) and Dataset 8 (Rolling Form) |
| **Next Steps** | Validate API; fetch 5-year history; confirm completeness |

---

### **Dataset 7: Historical Course Fit (Computed)**

| Property | Value |
|----------|-------|
| **Source** | INTERNAL (computed from Dataset 2 + Dataset 6) |
| **Computation** | Group player's tournament outcomes by course; compare mean SG to global mean |
| **Historical Depth** | 3+ years (limited to players with 3+ rounds per course) |
| **Update Frequency** | Per-tournament (computed on-demand during replay) |
| **Storage** | Not stored; computed on-the-fly for each replay |
| **Dependencies** | Outcomes (Dataset 6), Player Stats (Dataset 2) |
| **Cost** | FREE (internal computation) |
| **Next Steps** | Implement computation logic in Phase 17.3C |

---

### **Dataset 8: Historical Rolling Form (Computed)**

| Property | Value |
|----------|-------|
| **Source** | INTERNAL (computed from Dataset 6) |
| **Computation** | 4-week rolling window of tournament finishes; compute finishes, win %, consistency |
| **Historical Depth** | Rolling 4-week windows |
| **Update Frequency** | Per-tournament (computed on-demand during replay) |
| **Storage** | Not stored; computed on-the-fly |
| **Dependencies** | Outcomes (Dataset 6) |
| **Cost** | FREE (internal computation) |
| **Next Steps** | Implement computation logic in Phase 17.3C |

---

## ACQUISITION STRATEGY

### **Phase 17.3C: Critical Path** (Must have for replay)

**Priority 1: Tournament Outcomes (Dataset 6)**
- **Blocker**: Required as prerequisite for rolling form and course fit
- **Effort**: Low (API already licensed, well-known schema)
- **Timeline**: Week 1
- **Action**: Fetch 5-year history from SportsDataIO; validate completeness

**Priority 2: OWGR Rankings (Dataset 1)**
- **Blocker**: Required for field strength calculations
- **Effort**: Low (API already licensed, straightforward)
- **Timeline**: Week 1
- **Action**: Fetch weekly snapshots from DataGolf; backfill 5 years

**Priority 3: Player Statistics (Dataset 2)**
- **Blocker**: Core model input; required for projections
- **Effort**: Medium (API response parsing, SG definitions vary by year)
- **Timeline**: Week 2
- **Action**: Validate SG definitions; fetch 3-year history; handle methodology changes

**Priority 4: DraftKings Salaries (Dataset 3)**
- **Blocker**: Required for DFS value board
- **Effort**: Medium (public API may be fragile; archive service needed)
- **Timeline**: Week 2
- **Action**: Validate public API; establish archive process; backfill 3 years

### **Phase 17.3C: Secondary Path** (Nice-to-have, enables more features)

**Priority 5: Betting Odds (Dataset 4)**
- **Blocker**: Optional; provides model alignment signals
- **Effort**: High (requires Genius Sports licensing evaluation)
- **Timeline**: Week 3-4 (pending vendor evaluation)
- **Action**: Contact Genius Sports; negotiate license; evaluate ROI

**Priority 6: DFS Ownership (Dataset 5)**
- **Blocker**: Optional; context only
- **Effort**: Unknown (requires research)
- **Timeline**: Phase 17.3D (defer)
- **Action**: Research third-party services; assess cost/benefit

### **Computed Datasets (No External Dependency)**

**Datasets 7 & 8: Course Fit & Rolling Form**
- **Blocker**: None (computed from #6 and #2)
- **Effort**: Low (pure computation)
- **Timeline**: Week 3 (after #6 and #2 are loaded)
- **Action**: Implement computation logic; test with historical data

---

## TIMELINE

```
Week 1  [ Outcomes (6) ] [ OWGR Rankings (1) ]
        └─ Enables: Course Fit, Rolling Form computation

Week 2  [ Player Stats (2) ]  [ DK Salaries (3) ]
        └─ Enables: Full model inputs

Week 3  [ Course Fit (7) ] [ Rolling Form (8) ]
        └─ Depends on: Outcomes + Stats

Week 4  [ Integration Tests ] [ Health Dashboard ]

Week 5  ⏳ Pending Genius Sports evaluation for Odds (4)
```

---

## LICENSING & COST SUMMARY

| Dataset | Provider | Access | Cost | Status |
|---------|----------|--------|------|--------|
| OWGR Rankings | DataGolf | Licensed API | ✓ Included | Ready |
| Player Stats | SportsDataIO | Licensed API | ✓ Included | Ready |
| DK Salaries | DraftKings | Public API | ✓ FREE | Ready |
| Betting Odds | Genius Sports | Licensed API | ⏳ TBD | Evaluate |
| DFS Ownership | DraftKings | Public API | ✓ FREE | Defer |
| Tournament Outcomes | SportsDataIO | Licensed API | ✓ Included | Ready |
| Course Fit | Internal | Computed | ✓ FREE | Ready |
| Rolling Form | Internal | Computed | ✓ FREE | Ready |

**Total Additional Cost**: €0 (pending Genius Sports evaluation for optional Odds dataset)

---

## RISKS & MITIGATION

| Risk | Severity | Mitigation |
|------|----------|-----------|
| SportsDataIO API down during bulk import | High | Implement retry logic; batch across multiple days |
| DraftKings public API deprecated | Medium | Establish historical archive service backup |
| DataGolf API rate limits hit | Low | Batch requests; respect rate limits (100/min sufficient) |
| Genius Sports licensing delays | Low | Defer Odds dataset to Phase 17.3D; proceed without |
| Historical data gaps (missing tournaments) | Medium | Log gaps in import job; report in health dashboard |
| Provider data quality issues | Medium | Validation rules enforce data quality; reject invalid records |

---

## SUCCESS CRITERIA

Phase 17.3C is successful when:

- [ ] Tournament Outcomes: 5+ years, 95%+ coverage
- [ ] OWGR Rankings: Weekly snapshots, 5+ years
- [ ] Player Statistics: 3+ years, SG components validated
- [ ] DraftKings Salaries: 3+ years, tournament-aligned
- [ ] All import jobs logged and verified
- [ ] Health dashboard shows coverage metrics
- [ ] Integration tests passing (idempotency, temporal validation, checksum verification)
- [ ] Full replay cycle working end-to-end

Then: **Proceed to Phase 17.4 (Historical Replay Validation)**

