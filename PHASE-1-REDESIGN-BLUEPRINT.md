# PHASE 1 REDESIGN - CRITICAL 5 PAGES
## Premium Application Implementation

---

## DASHBOARD - "Control Center"
**Primary Question:** What matters this week?

### Current Problems:
- Empty states dominate
- Multiple disconnected pieces
- No clear entry points
- Doesn't feel like command center

### New Design:
```
[Header: Dashboard + Description]

[Quick Status Strip - Always Visible]
- This Week's Tournament: League / Field Size / Status
- Your Model Performance: Win Rate / ROI / Confidence  
- Best Opportunity: Recommended Play + Reason
- Action: [Enter Slate Analysis] [Build Lineup]

[Main Content - 3-Column Layout]
LEFT: Tournament Context (30%)
- Tournament name, dates, location, field size
- Course info, wind, weather alert
- TV schedule

CENTER: Recommended Plays (40%)
- Top 3-5 players with scores
- Why each player (AI insight)
- Risk/reward badges
- Quick add to lineup button

RIGHT: Model Status (30%)
- Latest run: timestamp, confidence
- Performance this season
- Next run scheduled
- Comparative ranking

[Below: Expandable Sections]
- This Week's Trends
- Historical Comparable Events
- Your Recent Decisions
```

### Design Pattern:
- Metric strip at top always visible
- 3-column balanced layout (desktop)
- Single column (mobile) - still visible immediately
- No scrolling needed for critical info
- AI insights embedded, not in modal
- Everything scannable in 5 seconds

---

## SLATE ANALYSIS - "What Do I Need to Know?"
**Primary Question:** How should I build a lineup?

### Current Problems:
- 5 tabs, info scattered
- Requires clicking through
- Table dominance, hard to scan
- Not suitable for quick decisions

### New Design:
```
[Header: Tournament + Slate + Weather Alert]

[Sticky Metric Bar]
- Average DK Score: 234.2
- Max Exposure: 25%
- Salary Cap: $50,000 / Remaining: $2,200
- Locked Players: 3 / Available: 147

[3-Section Single View - No Tabs]

SECTION 1: PLAYER POOL OVERVIEW (Immediately visible)
- Interactive chart: Salary vs Projected Points
- Size of bubble = ownership
- Color = position
- Hover: player name, AI reason
- Click: add to lineup

SECTION 2: INSIGHTS & TRENDS
- "Ownership Alert": 3 contrarian plays vs consensus
- "Value Zone": 5 players 20%+ projected upside
- "Correlation Play": 2-player combos that work together
- "Weather Impact": Which positions affected most

SECTION 3: DETAILED PLAYER TABLE
- Sortable: Salary, Projected, Upside, Ownership, Position
- Quick actions: Preview lineup impact, Add/Remove
- Responsive: Cards on mobile, table on desktop

[Sticky Footer - Always Visible]
- Lineup Preview: Current roster with total salary/projected
- Build Button: Goes to Lineup Builder
- Save as Draft: One click
```

### Design Pattern:
- Single scrollable page, no tabs
- Charts first (visual scanning), tables second
- AI insights visible, not hidden
- Mobile: swipeable chart, cards below
- Every action has visible impact

---

## PLAYER PROFILE - "Should I Roster This?"
**Primary Question:** Yes or No - with confidence

### Current Problems:
- 8 tabs, too much info at once
- Requires clicking through
- Decision unclear
- Overwhelming detail

### New Design:
```
[Compact Header]
- Player photo + name + position
- This week's opponent, matchup win %
- Vegas line, injury status

[DECISION PANEL - Right Side (Desktop) / Expandable (Mobile)]
AI Golf Analyst Verdict:
- 📈 STRONG PLAY / GOOD VALUE / AVOID / ???
- Confidence: 78%
- Why: "Short hitting drives, favorable wind pattern, low ownership"
- Compared to: "Other power hitters in field"

[Main Content Area - Single Page]

SECTION 1: THIS WEEK
- Matchup strength (radar/chart)
- Expected course conditions vs player strength  
- Projected score + range
- Comparable weeks (2-3 similar situations)

SECTION 2: FORM & TRENDS
- Last 10 results (mini chart)
- Season stats vs field average
- Strengths/weaknesses radar
- Injury/fatigue flags

SECTION 3: HISTORICAL PATTERNS
- Performance vs similar conditions (reusable component)
- Best/worst courses
- Betting line correlation

[Mobile Bottom Sheet]
- Swipeable between Form / Trends / History
- Always accessible decision panel
```

### Design Pattern:
- Decision verdict visible immediately
- Primary question answered in 3 seconds
- Supporting context readily available
- No more than 2-3 scrolls to see everything
- Desktop: side panel with verdict
- Mobile: decision always in view before scroll

---

## AI GOLF ANALYST - "Why?"
**Primary Question:** Why should I make this decision?

### Current Problems:
- Chat trapped in full-screen modal
- Not integrated with other views
- Feels like separate product
- Requires deliberate navigation

### New Design:
```
DESKTOP LAYOUT - Split View:

LEFT (60%): Analyst Chat
- History of conversation
- Recommended plays with reasoning
- Comparative analysis
- "Explain this player", "Compare these", "What if..."
- Input field at bottom

RIGHT (40%): Visual Context Drawer
- Player comparison charts update live
- Stat tables update based on chat
- Correlation matrices
- Scenario analysis

[Header]
- "AI Golf Analyst" 
- Current analysis focus (player / slate / lineup)
- Export conversation button

MOBILE LAYOUT:
- Primary: Chat interface with full width
- Secondary: Tap to see comparison/context drawer (bottom sheet)
- Sticky footer: Quick comparison button
```

### Design Pattern:
- Chat as primary interface (conversational)
- Visual context supports conversation
- Single "Why?" drives analysis
- Recommendations flow naturally
- Can be accessed from any page (not just /analyst)
- Insight panels on other pages link to analyst with context

---

## LINEUP BUILDER - "Optimize & Submit"
**Primary Question:** Is this lineup optimal and ready?

### Current Problems:
- Probably requires too many steps
- Constraint visualization unclear
- Cannot quickly see impact of changes
- Submit action not obvious

### New Design:
```
[Header]
- Tournament + Slate
- Lineup Status: "Ready" / "Conflicts" / "Optimization Opportunity"
- Save / Validate / Clear All buttons

[LEFT: Player Pool (50%)]
- Grouped by position
- Salary budget remaining highlighted
- Owned players marked
- Filter: By position, by salary, by matchup
- Drag to add to lineup

[RIGHT: Active Lineup (50%)]
- Stack indicator (connected rows)
- Salary spent vs remaining
- Projected total with confidence
- Position rules validator (visual checkmarks)
- Exposure tracking
- Drag to reorder / remove

[BOTTOM: Sticky Bar]
- Total Salary: $50,000 ($0 remaining) ✓
- Projected Score: 234.2 (78% confidence)
- Comparison to field average (chart)
- [Export] [Save as Draft] [SUBMIT] (prominent)

[Mobile: Tabs]
- Tab 1: Available Players (searchable, filterable)
- Tab 2: Active Lineup (reorderable)
- Swipe to switch
- Always see salary/projected at top
```

### Design Pattern:
- Drag and drop for desktop
- Tap to add/remove for mobile
- Constraints always visible
- Projected score updates live
- Submit button obvious and large
- One-click submit when ready
- No hidden form fields

---

## DESIGN SYSTEM UPDATES

### Color Palette (Premium, Golf-Inspired):
- Primary: Deep Pine Green (#1B4D3E)
- Accent: Fairway Gold (#D4AF37)
- Success: Sage Green (#6B8C5F)
- Alert: Course Red (#C41E3A)
- Background: Deep Charcoal (#0F1419)
- Cards: Slightly lighter (#161D26)

### Typography:
- Headlines: Relative-400 (golf-inspired but modern)
- Body: Inter (clean, readable, professional)
- Monospace: JetBrains Mono (for stats/numbers)

### Spacing & Depth:
- Use premium shadows (3-5 depth levels)
- Generous spacing (golf course aesthetic)
- Clear depth hierarchy

### Interactions:
- 150ms hover transitions
- Drag animations
- Loading states for all async
- Success/error toasts

---

## EXECUTION ORDER
1. Update globals.css with new theme
2. Redesign Dashboard (most visible impact)
3. Redesign Slate Analysis (core workflow)
4. Redesign Player Profile (decision support)
5. Redesign AI Analyst (integrated insights)
6. Redesign Lineup Builder (primary CTA)
7. Move to Phase 2

## SUCCESS CRITERIA
- Every page answers primary question in 5 seconds
- No unnecessary clicks (direct actions visible)
- Mobile responsive (tested at 360, 768, 1024, 1440px)
- Dark mode works throughout
- WCAG AA accessibility verified
- Micro-interactions feel polished
- Build passes with zero errors

---

**Phase 1: Transform critical user workflows from functional to premium.**
