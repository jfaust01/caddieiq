# Tournament Intelligence Modules - Implementation Plan

## Mission
Transform Tournament Detail page into a professional PGA analyst weekly report that answers:
**"How should I attack this tournament?"**

## The 10 Modules

### 1. AI Tournament Brief
**Purpose**: One professionally written summary generated from all connected data

**Content**:
- Course overview (history, characteristics, typical winning strategy)
- Weather summary (conditions, impact on scoring)
- Expected scoring (typical winning score, cut line trend)
- Type of golfer that succeeds (player archetype profile)
- Biggest storylines (injury returns, venue history, rule changes)
- DFS implications (salary compression, contrarian plays)

**Data Sources**:
- Course Intelligence (difficulty, style tags, metrics)
- Historical Results (past winners, winning scores, cut lines)
- Weather Intelligence (forecast, wind patterns)
- Tournament Context (defending champion, venue history)
- Field Analysis (top players, depth)

**Output**: 3-5 paragraph AI-generated summary (premium analyst tone)

---

### 2. Key Numbers
**Purpose**: Surface the metrics that actually matter for decision-making

**Display Format** (dashboard):
```
WINNING SCORE (5yr avg)  -13.5
CUT LINE (5yr avg)       -1.2
AVG BIRDIES (per round)  8.4
AVG DRIVING DIST         290 yds
AVG GIR %                65%
AVG PUTTING RANK         12.3
DIFFICULTY RANK          87/100
WIND IMPACT              Moderate
```

**Data Sources**:
- Historical tournament outcomes
- Course Intelligence metrics
- Weather patterns (5-year average)
- Field analytics

---

### 3. Course Fit
**Purpose**: Rank the traits that matter most for winning at this venue

**Display Format**:
```
APPROACH SHOT      ★★★★★  Essential for success
AROUND GREEN       ★★★★☆  Important
PUTTING            ★★★☆☆  Moderate
DISTANCE           ★★☆☆☆  Less critical
ACCURACY           ★★★★★  Extremely important
```

**Explanation**: Short narrative explaining why each trait matters

**Data Sources**:
- Course Intelligence (metrics for each skill)
- Hole-by-hole analysis
- Historical performance correlation

---

### 4. Player Archetypes
**Purpose**: Answer "Who wins here?"

**Examples**:
- Elite Iron Players (consistently hit greens)
- Short Game Specialists (high scrambling rates)
- Accurate Drivers (straight hitters thriving in narrow fairways)
- Aggressive Birdie Makers (risk-takers who capitalize)
- Wind Specialists (excel in exposed conditions)
- Veterans (course management advantage)
- Young Bombers (distance + accuracy combo)

**For Each Archetype**:
- Title + description
- Why this player fits
- Recent winners matching this archetype
- Current field examples

---

### 5. Tournament Storylines
**Purpose**: Generate 5-10 AI storylines for narrative context

**Examples**:
- "Scottie returns after winning last week (consecutive tournament bids rare)"
- "Rory has never finished outside Top 10 here (12 consecutive top-10s)"
- "Winds expected Thursday afternoon (potential scoring collapse)"
- "Rough increased to 2.5 inches (favors accurate drivers)"
- "Recent rain softened course (scoring should be elevated)"
- "First time as defending champion (interesting pressure narrative)"
- "Young up-and-comer makes first appearance (breakthrough potential)"

**Data Sources**:
- Historical results (player venue records)
- Recent tournament results
- Weather forecast
- Course setup changes
- Player rankings and momentum

---

### 6. DFS Strategy
**Purpose**: Real strategy section for daily fantasy players

**Sections**:

**Cash Games**
- Ownership targets
- High-floor plays
- Safety picks
- Advice: "In cash, fade the public contrarians. Look for consistent top-20 finishers..."

**Small Field GPP**
- Stack advice
- Contrarian plays
- Tournament structure tips

**Large Field GPP**
- High-variance targets
- Ceiling plays
- Tournament chalks to avoid/embrace

**Single Entry**
- Optimal lineup construction
- Upside/downside balance

**MME (Multiple Match Entry)**
- How to construct different lineup types
- Edge opportunities

---

### 7. Weather Intelligence
**Purpose**: Explain impact beyond raw values

**Content**:
- **Morning Advantage**: Which conditions favor early/late groups
- **Afternoon Draw**: Expected wind shifts, temperature changes
- **Wind Shifts**: When they occur, which holes impacted
- **Rain Delays**: Suspension risk %, timeline
- **Dew Impact**: Morning moisture on fairways/greens
- **Temperature Trend**: How it affects ball carry and green speed
- **DFS Impact**: Which positions gain/lose with this weather

**Format**: Narrative explanation + visual forecast

---

### 8. Vegas Intelligence
**Purpose**: Explain market dynamics, not just odds

**Content**:
- **Biggest Movers**: Who's moved most since open (and why)
- **Undervalued Golfers**: Market sleeping on them
- **Overvalued**: Public fading them for good reason
- **Market Confidence**: Sharp vs recreational split
- **Interesting Betting Value**: Where smart money sees value
- **Odds vs Projection**: Is Scottie +500 justified?

**Format**: Educational narrative about betting market

---

### 9. AI Top Plays
**Purpose**: Explain why each golfer appears, not just projections

**For Each Player**:
- Name + odds + salary
- **Why**: Specific reasons tied to player strengths ↔ course fit
- **Context**: Recent form, course history
- **Risk**: Downside scenarios
- **Best Path**: How do they score well here?

**Example**:
```
SCOTTIE SCHEFFLER (+500)
Why: Ranked #1 in approach shots. Course emphasizes precision long 
irons. Scottie's short-game edge is exactly what this course demands.
Context: Won last week; playing well. Won here 2 years ago (-20).
Risk: Can struggle off rough when accuracy fails. Wind-exposed course 
might elevate volatility.
Best Path: Control 65%+ fairways, hit 70%+ greens. One bad round 
eliminates him.
```

---

### 10. Tournament Summary
**Purpose**: If someone only reads for 2 minutes, they know everything

**Elevator Pitch** (2-3 sentences):
"Mid-length parkland course that tests approach play and short game. 
Soft course plays easier than rating suggests. Favors consistent iron 
players who stay patient—boom-and-bust bombers will suffer in rough."

**2-Minute Version** (6-8 bullets):
- Course plays like X (comp to familiar venue)
- Top trait: approach/accuracy/short game
- Best player archetype: (description)
- Biggest advantage: (edge you can have)
- Biggest risk: (what kills your score)
- Weather impact: (expected conditions effect)
- Ownership likely: (who will be chalky)
- Leverage: (how to differentiate)

---

## Implementation Architecture

### Data Aggregation Layer
**File**: `lib/tournament-intelligence/aggregator.ts`

Pulls together:
- Historical results
- Field analytics
- Weather forecasts
- Course metrics
- Player stats

### AI Generation Layer
**Files**: 
- `lib/tournament-intelligence/ai-brief-generator.ts`
- `lib/tournament-intelligence/storyline-generator.ts`
- `lib/tournament-intelligence/strategy-generator.ts`

Uses AI SDK to generate natural language summaries

### Calculation Layer
**File**: `lib/tournament-intelligence/calculations.ts`

Computes:
- Key numbers (averages, trends)
- Course fit rankings
- Player archetype matching
- Market analysis

### Component Layer
**Files**: `features/tournaments/components/tournament-intelligence-*.tsx`

Renders:
- Brief section
- Key numbers dashboard
- Course fit visualization
- Storylines list
- DFS strategy tabs
- Weather narrative
- Vegas analysis
- Top plays carousel
- Summary card

### Integration Point
**File**: `features/tournaments/command-center/tournament-command-center.tsx`

Embeds all modules into main layout

---

## Data Requirements Met

✅ **Course Intelligence**: 20+ metrics available
✅ **Historical Results**: Tournament outcomes table
✅ **Field Analytics**: Player ratings, rankings
✅ **Weather Intelligence**: Forecasts with status codes
✅ **Odds**: Odds quotes with movement tracking
✅ **Player Stats**: Professional statistics

---

## Phase Timeline

- **Phase 25.1**: Data aggregation + key numbers calculation
- **Phase 25.2**: Brief generation (AI) + Storylines
- **Phase 25.3**: Course fit + Player archetypes
- **Phase 25.4**: DFS strategy + Weather narrative
- **Phase 25.5**: Vegas analysis + Top plays
- **Phase 25.6**: Summary card + UI polish

---

## Success Metrics

✅ Page reads like premium PGA analyst report
✅ Every section helps with "How should I attack this?" decision
✅ AI-generated content is professional and accurate
✅ All data from real database (no placeholders)
✅ Updates reflect live data changes (weather, odds, news)
✅ Mobile-responsive and scannable
✅ Load time < 2s (cached calculations)
