# Tournament Overview Page Redesign Analysis

## Current State Assessment

### Current Page Structure

The Tournament Detail page is currently built as a **Command Center** with an overflow of full-width sections:

```
TournamentCommandCenter (Main orchestrator)
├── CommandCenterHeader (Navigation + filters)
├── CommandCenterSearch
├── QuickActions
├── PersonalizationWidget
├── MorningBrief (AI summary)
├── TournamentStory (Narrative)
├── TrendingPlayers
├── AiCoachWidget
├── CaddieChat
├── TournamentDetailTabs (Overview/Field tabs)
│   ├── Tab: Overview
│   │   ├── TournamentOverview (Metadata)
│   │   └── FieldRankingLeaders (Top 5)
│   └── Tab: Field
│       └── TournamentField (Full list)
├── TournamentDfsLeaderboards (Full DFS table)
├── TournamentCourseIntelligence (Course profile + full insights)
├── TournamentWeatherIntelligence (Weather timeline)
├── TournamentOddsIntelligence (Odds tables)
├── TournamentSkillLeaderboards (Skill tables)
├── FieldFitBoard (Course fit matrix)
├── TournamentRoundsTable (Rounds results)
├── TournamentHealthWrapper (Status checks)
└── TournamentElevationHub (Elevation widget)
```

**Current Issues:**
1. **Too long** - ~4000px+ viewport height with many stacked sections
2. **Duplicate information** - Leaderboards appear twice (Overview + dedicated section)
3. **Full-width tables on Overview** - DFS, field fit, leaderboards all render in full
4. **No progressive disclosure** - Everything loads upfront
5. **Poor mobile experience** - Tables don't collapse, long vertical scrolling
6. **Dense rendering** - Many sections compete for visual hierarchy

### Current Component Inventory

**Information Architecture Components:**
- `TournamentHero` - Tournament name, dates, location, weather (compact header)
- `TournamentOverview` - Metadata facts (dates, tour, season, course, purse)
- `FieldRankingLeaders` - Top 5 leaders by ranking
- `TournamentFieldBanner` - Field report summary
- `TournamentDfsLeaderboards` - Full DFS value breakdown

**Intelligence Components:**
- `TournamentCourseIntelligence` - Course profile, fit traits, takeaways (FULL)
- `TournamentWeatherIntelligence` - Weather timeline, impact analysis (FULL)
- `TournamentOddsIntelligence` - Odds tables, market data (FULL)
- `TournamentSkillLeaderboards` - Skill rankings (FULL)
- `FieldFitBoard` - Course fit matrix (FULL)
- `FieldFantasyAnalysis` - DFS strategy (various components)

**Command Center Components:**
- `MorningBrief` - AI-generated daily summary
- `TournamentStory` - Narrative context
- `TrendingPlayers` - Notable player list
- `AiCoachWidget` - Recommendations
- `QuickActions` - Navigation shortcuts
- `PersonalizationWidget` - User preferences

---

## Proposed New Architecture

### New Page Structure

```
TournamentOverviewPage (Server Component)
├── CompactHeader
│   ├── Tournament name + status
│   ├── Dates, location, course, par, yardage
│   └── Share + export actions
│
├── TournamentDetailTabs (Existing - reuse)
│   └── Overview tab becomes → TournamentOverviewDashboard
│
└── TournamentOverviewDashboard
    ├── KpiSummaryRow
    │   ├── Leader / Winner card
    │   ├── Current/Winning score card
    │   ├── Cut line card
    │   ├── Field strength card
    │   └── Scoring average card
    │
    ├── TwoPrimaryDashboard
    │   ├── LeftColumn
    │   │   ├── CompactLeaderboard (Top 5 only)
    │   │   └── [View full leaderboard] link
    │   └── RightColumn
    │       ├── CourseFitSummary (Top 3-5 traits)
    │       └── [View course analysis] link
    │
    ├── KeyInsightsRow (3-4 insight cards)
    │   ├── Wind impact
    │   ├── Scoring difficulty
    │   ├── Course personality
    │   └── Green difficulty
    │
    ├── WeatherAndFieldRow
    │   ├── LeftColumn: WeatherSummaryCard
    │   │   └── Current conditions + [View forecast] link
    │   └── RightColumn: FieldStrengthCard
    │       └── Top 5 notable players + [View field] link
    │
    ├── DfsSummaryCard
    │   ├── Best value plays (5-6 only)
    │   ├── Optimal lineup summary
    │   └── [View DFS analysis] link
    │
    └── CourseAndHistoryRow
        ├── LeftColumn: CourseOverviewCard
        │   └── Course image, name, par, yardage, rating, slope
        └── RightColumn: RecentResultsCard
            └── Last 5 winners
```

### New Component Hierarchy

**New Components to Create:**
1. `TournamentOverviewDashboard` - Main redesigned overview
2. `TournamentKpiRow` - 4-5 KPI cards
3. `CompactLeaderboard` - Top 5 + "view full" link
4. `CourseFitSummary` - 3-5 most important traits only
5. `KeyInsightsGrid` - Compact insight cards (wind, scoring, etc.)
6. `WeatherSummaryCard` - Compact weather conditions only
7. `FieldStrengthCard` - Field score + top 5 players
8. `DfsSummaryCard` - Best value + optimal lineup summary
9. `CourseOverviewCard` - Compact course facts + image
10. `RecentResultsCard` - Last 5 tournament winners
11. `TournamentCompactHeader` - Condensed hero (reuse existing hero, make it tighter)

---

## Content Movement to Tabs

### Overview Tab (New Dashboard)
**Visible without scroll:**
- Tournament identity (name, dates, location)
- KPI summary row (5 key metrics)
- Compact leaderboard (top 5)
- Course fit summary (3-5 traits)
- Key insights (3-4 cards)

**With minimal scrolling:**
- Weather conditions + link
- Field strength + link
- DFS summary + link
- Course overview + link
- Recent results + link

### Field Tab (Existing)
- Full player field
- Player rankings
- Player status
- Field composition stats
- Withdrawals

### Course Tab (NEW - MOVE HERE)
- Full course profile
- Hole-by-hole breakdown
- Course analytics
- Course intelligence details
- Course history
- Difficulty details

### Weather Tab (NEW - MOVE HERE)
- Full forecast timeline
- Historical weather
- Weather impact analysis
- Hourly predictions
- Admin controls (if admin)

### Analytics Tab (NEW - MOVE HERE)
- Skill leaderboards
- Course fit factors (full matrix)
- Scoring models
- Historical trends
- Field strength analysis

### DraftKings Tab (NEW - MOVE HERE)
- Full salary table
- Projections
- Value analysis
- Ownership percentages
- Lineup optimization tools

### Betting Tab (NEW - MOVE HERE)
- Odds tables
- Market movement
- Sportsbook data
- Props available

---

## Content Deduplication

**Currently Repeated:**
1. **Leaderboard** - Appears in:
   - FieldRankingLeaders (Overview)
   - TournamentField (Field tab, full)
   - → Keep: Compact in Overview, full in Field tab

2. **Course information** - Appears in:
   - TournamentHero
   - TournamentOverview
   - TournamentCourseIntelligence
   - → Keep: Compact in Header/KPI, detailed in Course tab

3. **Weather conditions** - Appears in:
   - TournamentHero (summary)
   - TournamentWeatherIntelligence (full)
   - → Keep: Chip in header, full timeline in Weather tab

4. **Field composition** - Appears in:
   - TournamentFieldBanner
   - TournamentField
   - → Keep: Banner with link, full in Field tab

5. **DFS data** - Appears in:
   - TournamentDfsLeaderboards (Overview)
   - Encoded in other recommendations
   - → Keep: 5-6 players in Overview card, full in DFS tab

6. **Course fit** - Appears in:
   - FieldFitBoard (matrix)
   - Multiple intelligence components
   - → Keep: 3-5 top traits in Overview, full in Course/Analytics tabs

---

## Implementation Plan

### Phase 1: Create Compact Components
1. Create `CompactLeaderboard` - Show only top 5, add [View full] link
2. Create `CourseFitSummary` - Extract top 3-5 traits with progress bars
3. Create `TournamentKpiRow` - Create 5 cards: Leader, Score, Cut, Field Strength, Scoring Avg
4. Create `KeyInsightsGrid` - Extract insight summaries (wind, scoring, personality)

### Phase 2: Create Summary Cards
5. Create `WeatherSummaryCard` - Current conditions only
6. Create `FieldStrengthCard` - Field score + notable players
7. Create `DfsSummaryCard` - Top value + optimal lineup preview
8. Create `CourseOverviewCard` - Course facts + image link
9. Create `RecentResultsCard` - Last 5 winners

### Phase 3: Assemble Dashboard
10. Create `TournamentOverviewDashboard` - Assemble all components in layout
11. Refactor `CompactHeader` - Make tournament header tighter
12. Update `TournamentDetailTabs` - Move Overview content to new dashboard

### Phase 4: Move Full Content to Tabs
13. Create Course tab component → Move full course intelligence
14. Create Weather tab component → Move full weather intelligence
15. Create Analytics tab component → Move leaderboards, fit board
16. Create DFS tab component → Move DFS analysis
17. Create Betting tab component → Move odds intelligence
18. Create History tab component → Move tournament rounds

### Phase 5: Update Main Layout
19. Update `TournamentCommandCenter` to use new structure
20. Remove redundant full-width sections from main flow
21. Keep command center widgets above (Morning Brief, AI Coach, etc.)
22. Optimize for mobile responsive grid

### Phase 6: Testing & Validation
23. Verify no data loss
24. Test responsive layouts (desktop, tablet, mobile)
25. Validate all links work (Overview → full tabs)
26. Check build, tests pass
27. Create before/after screenshots

---

## Visual Design Requirements

**Color & Theme:**
- Dark CaddieIQ theme (existing)
- Green accent for CTAs
- Subtle borders on cards
- Elevated surfaces

**Layout Density:**
- Reduced padding (8-12px instead of 16-24px)
- Smaller text for secondary info (xs/sm)
- Compact card heights (80-120px for KPIs)
- 2-column grid on desktop
- Single column on mobile

**Typography:**
- Large primary values (font-bold, lg)
- Small labels (text-xs, text-muted-foreground)
- Concise supporting text (1 line max)
- No paragraphs or long prose

**Grid System:**
- 12-column responsive grid
- Desktop: 2-3 column layouts
- Tablet: 2 column layouts
- Mobile: 1 column layout

---

## Success Metrics

✅ **Page length reduced by 50-65%** (target: <2000px vs current 4000+px)
✅ **Top 5 leaderboard visible without excessive scroll**
✅ **First viewport contains:**
   - Tournament identity
   - Status badge
   - Location + course info
   - KPI row (leader, score, cut, field strength, scoring avg)
   - Compact leaderboard (top 5)
✅ **All full content moved to proper tabs**
✅ **No duplicate information on Overview**
✅ **Empty/unavailable states compact (<120px)**
✅ **Works on desktop, tablet, mobile**
✅ **All existing data and functionality preserved**
✅ **Tests pass, build succeeds**
✅ **Before/after screenshots provided**

---

## Affected Components Summary

### Reuse (No Changes):
- TournamentHero (will make tighter via CSS)
- TournamentField
- TournamentCourseIntelligence
- TournamentWeatherIntelligence
- TournamentOddsIntelligence
- TournamentSkillLeaderboards
- FieldFitBoard
- TournamentDfsLeaderboards

### Create (New):
- TournamentOverviewDashboard
- CompactLeaderboard
- CourseFitSummary
- TournamentKpiRow
- KeyInsightsGrid
- WeatherSummaryCard
- FieldStrengthCard
- DfsSummaryCard
- CourseOverviewCard
- RecentResultsCard

### Modify (Restructure):
- TournamentCommandCenter (main layout restructure)
- TournamentDetailTabs (move content, add new tabs)

### Delete (Remove from Overview):
- Direct renders of DFS, Weather, Course Intelligence, Odds, Skills, Fit Board
- All will move to tabs instead
