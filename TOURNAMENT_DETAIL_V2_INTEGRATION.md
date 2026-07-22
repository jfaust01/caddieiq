# Tournament Detail V2 — Integration Guide

## Quick Start

All new components are ready to use. They've been created with proper TypeScript interfaces, accept mock/real data, and integrate seamlessly with existing tournament pages.

---

## Component Overview & Props

### 1. Enhanced: Compact KPI Row
**Location:** `features/tournaments/components/compact-kpi-row.tsx`

**Props:**
```typescript
interface CompactKpiRowProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
}
```

**Usage:**
```typescript
import { CompactKpiRow } from '@/features/tournaments/components/compact-kpi-row'

<CompactKpiRow 
  tournament={tournament} 
  field={field} 
  fieldReport={fieldReport} 
/>
```

**Displays:**
- Field size, Purse, Winner share, Strength rating, Cut rule
- Par, Yardage, Designer, Tournament dates
- FedEx points, Tour

---

### 2. Enhanced: Field Ranking Leaders
**Location:** `features/tournaments/components/field-ranking-leaders.tsx`

**Props:**
```typescript
interface FieldRankingLeadersProps {
  leaders: FieldRankingLeaders
}
```

**Usage:**
```typescript
import { FieldRankingLeaders } from '@/features/tournaments/components/field-ranking-leaders'

<FieldRankingLeaders leaders={fieldLeaders} />
```

**Displays:**
- Top Ranked (by rating)
- Top Form (recent performance)
- Best Value (fantasy scoring)

All with OWGR, Rating, and Value columns in table format.

---

### 3. Enhanced: Weather Intelligence
**Location:** `features/tournaments/components/tournament-weather-intelligence.tsx`

**Existing Component** - just works better now with historical averages fallback.

**Displays:**
- Current forecast (if available)
- Historical averages (if forecast unavailable)
- Availability timeline

---

### 4. Enhanced: Odds Intelligence
**Location:** `features/tournaments/components/tournament-odds-intelligence.tsx`

**Existing Component** - enhanced with sportsbook timeline.

**Displays:**
- Available betting markets (if available)
- Sportsbook availability timeline (if not available)

---

### 5. New: Top Course Fits
**Location:** `features/tournaments/components/tournament-top-course-fits.tsx`

**Props:**
```typescript
interface CourseFitPlayer {
  rank: number
  playerName: string
  playerId: string
  fitScore: number
  drivingFit: number
  approachFit: number
  shortGameFit: number
  puttingFit: number
  courseHistory: number
}

interface TournamentTopCourseFitsProps {
  players: CourseFitPlayer[]
}
```

**Usage:**
```typescript
import { TournamentTopCourseFits } from '@/features/tournaments/components/tournament-top-course-fits'

<TournamentTopCourseFits players={courseFitPlayers} />
```

**Displays:**
- Top 10 players with best course fit
- Breakdown: Driving %, Approach %, Short Game %, Putting %, History %
- Visual progress bars and legend

---

### 6. New: DFS Value Plays
**Location:** `features/tournaments/components/tournament-dfs-value-plays.tsx`

**Props:**
```typescript
interface ValuePlay {
  playerId: string
  playerName: string
  salary: number
  valueRating: number
  projectedPoints: number
  ownership: number
  leverage: number
  boom: number
}

interface TournamentDfsValuePlaysProps {
  plays: ValuePlay[]
}
```

**Usage:**
```typescript
import { TournamentDfsValuePlays } from '@/features/tournaments/components/tournament-dfs-value-plays'

<TournamentDfsValuePlays plays={valuePlays} />
```

**Displays:**
- Top 12 value plays
- Salary, Value Rating, Projected Points
- Ownership %, Leverage, Boom %, PPK (points per $1K)

---

### 7. New: Key Stats
**Location:** `features/tournaments/components/tournament-key-stats.tsx`

**Props:**
```typescript
interface StatCategory {
  title: string
  stats: Array<{
    label: string
    value: string | number
    unit?: string
  }>
}

interface TournamentKeyStatsProps {
  categories: StatCategory[]
}
```

**Usage:**
```typescript
import { TournamentKeyStats } from '@/features/tournaments/components/tournament-key-stats'

<TournamentKeyStats categories={statCategories} />
```

**Example Data:**
```typescript
const categories = [
  {
    title: "Driving",
    stats: [
      { label: "Avg Distance", value: "295", unit: "yards" },
      { label: "Accuracy", value: "68.5", unit: "%" }
    ]
  },
  {
    title: "Approach",
    stats: [
      { label: "GIR", value: "71.2", unit: "%" },
      { label: "SG Approach", value: "0.24", unit: "" }
    ]
  }
]
```

---

### 8. New: Recent Winners
**Location:** `features/tournaments/components/tournament-recent-winners.tsx`

**Props:**
```typescript
interface Winner {
  year: number
  playerName: string
  playerId: string
  score: string
  margin: string
  playoff: boolean
  worldRanking: number
}

interface TournamentRecentWinnersProps {
  winners: Winner[]
}
```

**Usage:**
```typescript
import { TournamentRecentWinners } from '@/features/tournaments/components/tournament-recent-winners'

<TournamentRecentWinners winners={winners} />
```

**Displays:**
- Last 10 years of tournament winners
- Score, margin, world ranking at time, playoff flag
- Links to player profiles

---

### 9. New: Course Information
**Location:** `features/tournaments/components/tournament-course-information.tsx`

**Props:**
```typescript
interface CourseInfo {
  name: string
  location: string
  city: string
  state: string
  architect: string
  yearBuilt: number
  par: number
  yardage: number
  grassType: string
  fairwayGrass: string
  greenType: string
  elevation: number
}

interface TournamentCourseInformationProps {
  course: CourseInfo
}
```

**Usage:**
```typescript
import { TournamentCourseInformation } from '@/features/tournaments/components/tournament-course-information'

<TournamentCourseInformation course={courseInfo} />
```

**Displays:**
- Course details (location, architect, year)
- Par, Yardage
- Grass types (fairways, greens, rough)

---

### 10. New: Course Summary Holes
**Location:** `features/tournaments/components/tournament-course-summary-holes.tsx`

**Props:**
```typescript
interface HoleDifficulty {
  rank: number
  holeNumber: number
  par: number
  yardage: number
  avgScore: number
  difficulty: number
  birdiePercent: number
  bogeyPercent: number
}

interface CourseSummary {
  hasHoleData: boolean
  totalPar: number
  totalYardage: number
  frontNinePar: number
  backNinePar: number
  frontNineYardage: number
  backNineYardage: number
  parDistribution: Record<number, number>
  holesByLength: { short: number; medium: number; long: number }
  topHardestHoles: HoleDifficulty[]
  topEasiestHoles: HoleDifficulty[]
  avgScore: number
  avgBirdiePercent: number
  avgBogeyPercent: number
}

interface TournamentCourseSummaryHolesProps {
  summary: CourseSummary
}
```

**Usage:**
```typescript
import { TournamentCourseSummaryHoles } from '@/features/tournaments/components/tournament-course-summary-holes'

<TournamentCourseSummaryHoles summary={courseSummary} />
```

**Displays:**
- Front vs Back Nine comparison
- Par distribution
- Hole lengths
- Top 5 hardest holes
- Top 5 easiest holes
- Scoring statistics

---

### 11. New: Premium Intelligence
**Location:** `features/tournaments/components/tournament-premium-intelligence.tsx`

**Props:**
```typescript
interface InsightSection {
  title: string
  icon: LucideIcon
  content: string
  sources: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface TournamentPremiumIntelligenceProps {
  executive: InsightSection
  trendingUp: InsightSection
  trendingDown: InsightSection
  specialists: InsightSection
  risks: InsightSection
  dfsStrategy: InsightSection
  weatherStrategy: InsightSection
  ownership: InsightSection
  contests: InsightSection
}
```

**Usage:**
```typescript
import { TournamentPremiumIntelligence } from '@/features/tournaments/components/tournament-premium-intelligence'

<TournamentPremiumIntelligence
  executive={executiveInsight}
  trendingUp={trendingUp}
  trendingDown={trendingDown}
  specialists={specialists}
  risks={risks}
  dfsStrategy={dfsStrategy}
  weatherStrategy={weatherStrategy}
  ownership={ownership}
  contests={contests}
/>
```

**Displays:**
- 9 insight sections with titles, content, sources, confidence
- Key takeaways summary
- Data source attribution

---

## Integration Example

Here's a complete example of integrating all components:

```typescript
import { CompactKpiRow } from '@/features/tournaments/components/compact-kpi-row'
import { FieldRankingLeaders } from '@/features/tournaments/components/field-ranking-leaders'
import { TournamentTopCourseFits } from '@/features/tournaments/components/tournament-top-course-fits'
import { TournamentDfsValuePlays } from '@/features/tournaments/components/tournament-dfs-value-plays'
import { TournamentKeyStats } from '@/features/tournaments/components/tournament-key-stats'
import { TournamentRecentWinners } from '@/features/tournaments/components/tournament-recent-winners'
import { TournamentCourseInformation } from '@/features/tournaments/components/tournament-course-information'
import { TournamentCourseSummaryHoles } from '@/features/tournaments/components/tournament-course-summary-holes'
import { TournamentPremiumIntelligence } from '@/features/tournaments/components/tournament-premium-intelligence'

export async function TournamentDetailPage({ params }) {
  const tournament = await getTournament(params.id)
  const field = await getField(tournament.id)
  const courseFits = await getCourseFits(tournament.courseRef)
  const valuePlays = await getDfsValuePlays(tournament.id)
  const stats = await getKeyStats(tournament.courseRef)
  const winners = await getRecentWinners(tournament.id)
  const courseInfo = await getCourseInfo(tournament.courseRef)
  const courseSummary = await getCourseSummary(tournament.courseRef)
  const intelligence = await getTournamentIntelligence(tournament.id)

  return (
    <div className="space-y-8">
      {/* KPI Bar */}
      <CompactKpiRow tournament={tournament} field={field} />

      {/* Field Leaders */}
      <FieldRankingLeaders leaders={field.rankingLeaders} />

      {/* Course Fits */}
      <TournamentTopCourseFits players={courseFits} />

      {/* DFS */}
      <TournamentDfsValuePlays plays={valuePlays} />

      {/* Course Info */}
      <TournamentCourseInformation course={courseInfo} />

      {/* Course Analysis */}
      <TournamentCourseSummaryHoles summary={courseSummary} />

      {/* Stats */}
      <TournamentKeyStats categories={stats} />

      {/* Winners */}
      <TournamentRecentWinners winners={winners} />

      {/* Intelligence */}
      <TournamentPremiumIntelligence {...intelligence} />
    </div>
  )
}
```

---

## Data Fetching Patterns

Each component accepts well-typed props. Fetch data from your backend/API:

```typescript
// Example: Getting course fits
const courseFits = await db.query(`
  SELECT 
    player_id,
    player_name,
    fit_score,
    driving_fit,
    approach_fit,
    short_game_fit,
    putting_fit,
    course_history
  FROM player_course_fits
  WHERE course_id = ?
  ORDER BY fit_score DESC
  LIMIT 10
`)
```

---

## Styling & Theming

All components use:
- **Tailwind CSS v4** — Responsive utilities
- **shadcn/ui** — Consistent design system
- **Design tokens** — Color, spacing, typography
- **Dark mode** — Built-in support

No custom styling needed - they inherit from your theme.

---

## Performance Considerations

- All components are **client-rendered** (marked with `'use client'`)
- Can be wrapped in `Suspense` boundaries for streaming
- Grid layouts are lightweight
- No heavy third-party dependencies

---

## Testing

Each component is self-contained and can be tested independently:

```typescript
import { render, screen } from '@testing-library/react'
import { TournamentDfsValuePlays } from '@/features/tournaments/components/tournament-dfs-value-plays'

it('displays value plays', () => {
  const plays = [{
    playerId: '1',
    playerName: 'Test Player',
    salary: 8000,
    valueRating: 87,
    projectedPoints: 42,
    ownership: 12,
    leverage: 2.1,
    boom: 28
  }]
  
  render(<TournamentDfsValuePlays plays={plays} />)
  expect(screen.getByText('Test Player')).toBeInTheDocument()
})
```

---

## Troubleshooting

**Component not rendering?**
- Ensure all required props are provided
- Check that data types match interfaces
- Verify component is imported correctly

**Styling looks off?**
- Ensure Tailwind CSS is configured
- Check dark mode is enabled in layout
- Verify shadcn/ui components are installed

**Data not showing?**
- Check data structures match interfaces
- Verify arrays have at least 1 item for component to render
- Some components return null when empty (intentional)

---

## Next Steps

1. ✅ Copy components to your project
2. ✅ Update imports in tournament detail page
3. ✅ Fetch real data for each component
4. ✅ Test in browser
5. ✅ Deploy to production

All components are production-ready!
