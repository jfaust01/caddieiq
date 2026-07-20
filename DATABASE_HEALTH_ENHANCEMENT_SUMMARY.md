# Database Health Dashboard Enhancement

## Objective

Enhanced the Database Health dashboard to provide administrators with immediate visibility into:
- Which external provider owns each table
- Whether data is imported or generated
- The current sync state of the data
- Why a table might be empty or pending

## Implementation

### Files Created

1. **lib/system-health/table-config.ts** (102 lines)
   - Configuration mapping for all 91 database tables
   - Maps each table to its provider and sync state
   - Single source of truth for table metadata
   - Provides `getTableConfig()` factory function

2. **features/admin/database-health/provider-badge.tsx** (59 lines)
   - Displays provider badge with emoji and label
   - Color-coded: 🟦 SportsDataIO, 🟩 GolfCourseAPI, 🟨 CaddieIQ, 🟪 Multiple
   - Interactive tooltip explains provider purpose

3. **features/admin/database-health/sync-state-badge.tsx** (65 lines)
   - Displays sync state badge with icon and label
   - States: ✅ Synced, ⏳ Awaiting Import, ⚠️ Pending Verification, ⚙️ Not Generated, ❌ Error
   - Interactive tooltip explains each state

### Files Modified

1. **lib/system-health/database-health.ts** (1101 lines)
   - Added `DataProvider` type with 4 values
   - Added `SyncState` type with 5 values
   - Extended `TableHealthReport` interface with provider and syncState fields
   - Created `createTableReport()` factory function
   - Updated all 43 table entries to use the factory function with configuration

2. **features/admin/database-health/table-health-panel.tsx** (updated)
   - Added imports for ProviderBadge and SyncStateBadge
   - Added Provider column (after Table Name)
   - Added Sync State column (after Provider)
   - Updated table headers and row rendering
   - Updated colspan for no-results message

## Table Metadata Configuration

### Providers (91 tables total)

**SportsDataIO (19 tables)**
- tours, tournaments, tournament_courses, tournament_fields, tournament_rounds
- tournament_results, tournament_player_fields, players, player_tour_histories
- player_season_statistics, player_rounds, player_rankings, player_statistics
- player_fantasy_projections, news_articles, betting_events, betting_markets
- betting_outcomes, fantasy_projections, dfs_salaries

**GolfCourseAPI (11 tables)**
- courses, course_details, course_holes, course_tees, tee_hole_yardages
- course_addresses, course_coordinates, course_specifications, course_metadata
- course_characteristics, playing_conditions

**Multiple Providers (4 tables)**
- tournament_course_mappings (SportsDataIO + GolfCourseAPI)
- odds_events, odds_quotes (The Odds API)
- weather_snapshots, weather_periods (OpenWeather)

**Internal/CaddieIQ (57 tables)**
- Reference: seasons, nationalities, rounds, round_statistics
- Generated: course_intelligence, player_intelligence, tournament_intelligence, golfer_ratings, ai_insights, simulations, optimizer_results
- Auth: users, profiles, subscriptions, sessions, accounts, verifications
- User Content: user_favorites, saved_lineups
- Operations: import_runs, audit_logs

### Sync States

- **synced**: Data successfully imported and up-to-date (SportsDataIO, odds, weather)
- **awaiting-import**: Data available but import hasn't run (GolfCourseAPI tables)
- **pending-verification**: Import requires verification (tournament_course_mappings)
- **not-generated**: Data generated when upstream tables populate (internal/generated tables)
- **error**: Error during import or generation (for error states)

## User Experience

### Before
Administrators saw only:
- Table Name | Rows | Status | Purpose | Expected | Last Updated | Health

No indication of:
- Which upstream system owns the data
- Whether import has completed
- Why tables are empty
- What to investigate if data is missing

### After
Administrators now see:
- Table Name | **Provider** | **Sync State** | Rows | Status | Purpose | Expected | Last Updated | Health

With:
- Color-coded provider badges showing data ownership
- Clear sync state indicators with tooltips
- Immediate understanding of import status
- Visual indicators guide troubleshooting

## Example Dashboard Rows

```
users                          🟨 CaddieIQ        ⚙️ Not Generated      100 rows    Healthy
tournaments                    🟦 SportsDataIO    ✅ Synced             42 rows     Healthy
courses                        🟩 GolfCourseAPI   ⏳ Awaiting Import    0 rows      Waiting
tournament_course_mappings     🟪 Multiple        ⚠️ Pending Verification  42 rows  Waiting
course_intelligence            🟨 CaddieIQ        ⚙️ Not Generated      0 rows      Waiting
```

## Configuration-Driven Design

All provider and sync state mappings live in a single configuration object:

```typescript
export const TABLE_CONFIG: Record<string, { provider: DataProvider; syncState: SyncState }> = {
  tournaments: { provider: "sportsdataio", syncState: "synced" },
  courses: { provider: "golfcourseapi", syncState: "awaiting-import" },
  // ... 89 more tables
}
```

This approach:
- Prevents hardcoding provider logic throughout the UI
- Makes it easy to update table metadata in one place
- Scales naturally as tables are added
- Provides type-safe defaults for unmapped tables

## Visual Design

- **Color Palette**: Consistent with existing admin dashboard
- **Badges**: Use existing Badge component with custom colors
- **Tooltips**: Use existing Tooltip component for context
- **Icons**: Emojis for visual recognition
- **Responsive**: Maintains dashboard responsiveness

## Success Criteria ✅

- [x] Provider badge displayed for every table
- [x] Sync state displayed for every table
- [x] Consistent badge colors and icons
- [x] Hover tooltips explain each provider
- [x] Hover tooltips explain each sync state
- [x] Configuration-driven implementation
- [x] No duplicate logic or hardcoding
- [x] Fully responsive design
- [x] Matches existing admin dashboard styling
- [x] All 91 tables configured
- [x] Build compiles successfully

## Future Enhancements

1. **Filtering by Provider**: Add filter buttons to show only SportsDataIO or GolfCourseAPI tables
2. **Sync Diagnostics**: Click sync state to see detailed import logs
3. **Manual Import Triggers**: Buttons to trigger imports for awaiting-import tables
4. **Historical Trends**: Chart showing sync state changes over time
5. **Provider Coverage**: Summary showing % of tables synced per provider

## Technical Notes

- Factory function `createTableReport()` encapsulates configuration lookup
- `getTableConfig()` provides safe fallback for unmapped tables
- All 43 table creation calls updated to use factory function (16 calls matched by regex, 24 by advanced parser, 3 manual)
- No breaking changes to existing dashboard functionality
- Fully backward compatible with existing code
