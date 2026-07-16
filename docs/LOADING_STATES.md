# Loading States & Empty States Guide

This document standardizes how CaddieIQ handles loading states and empty states across all pages and features.

## Principles

Every loading state and empty state should communicate:
1. **What is loading** - Be specific about what data is being fetched
2. **Why it's empty** - Explain the business reason (not technical)
3. **When it will have data** - Set user expectations
4. **What to do next** - Suggest an action or explain what happens automatically

## Reusable Components

### Skeleton Loaders

These components create animated placeholder UI while data loads.

#### SkeletonCard
```tsx
import { SkeletonCard } from '@/components/loaders'

// In a loading state:
{isLoading ? (
  <SkeletonCard lines={4} withIcon withHeader />
) : (
  <YourCard />
)}
```

**Props:**
- `lines` - Number of content lines (default: 3)
- `withIcon` - Show icon placeholder (default: true)
- `withHeader` - Show header section (default: true)
- `className` - Additional CSS classes

#### SkeletonTable
```tsx
import { SkeletonTable } from '@/components/loaders'

{isLoading ? (
  <SkeletonTable rows={5} columns={4} withHeader />
) : (
  <DataTable />
)}
```

**Props:**
- `rows` - Number of rows (default: 5)
- `columns` - Number of columns (default: 4)
- `withHeader` - Show header row (default: true)
- `className` - Additional CSS classes

#### LoadingMetric
```tsx
import { LoadingMetric } from '@/components/loaders'

{isLoading ? (
  <LoadingMetric withLabel withTrend />
) : (
  <StatCard />
)}
```

**Props:**
- `withLabel` - Show label (default: true)
- `withTrend` - Show trend indicator (default: true)
- `className` - Additional CSS classes

#### LoadingChart
```tsx
import { LoadingChart } from '@/components/loaders'

{isLoading ? (
  <LoadingChart height="h-80" withTitle withLegend />
) : (
  <Chart />
)}
```

**Props:**
- `height` - Chart container height (default: 'h-80')
- `withTitle` - Show title (default: true)
- `withLegend` - Show legend (default: true)
- `className` - Additional CSS classes

### Empty State Components

These components explain why data is empty and what happens next.

#### Specific Contexts

```tsx
import {
  EmptyWeatherState,
  EmptyDfsState,
  EmptyFieldState,
  EmptyFormState,
  EmptyOddsState,
  EmptyCourseFitState,
  EmptyHistoryState,
  EmptyResultsState,
} from '@/components/empty-states/empty-state-contexts'

// In tournaments/weather section:
{!weather ? <EmptyWeatherState /> : <WeatherCard />}

// In DFS value board:
{!dfsData ? <EmptyDfsState /> : <DfsBoard />}
```

#### Custom Empty States

```tsx
import { ContextualEmptyState } from '@/components/empty-states/empty-state-contexts'
import { AlertCircle } from 'lucide-react'

<ContextualEmptyState
  icon={AlertCircle}
  title="No tournament selected"
  reason="Start by choosing a tournament from the list."
  nextStep="Select a tournament to see its data and analytics."
  action={{
    label: 'Browse tournaments',
    onClick: () => router.push('/tournaments'),
  }}
/>
```

## Common Patterns

### Tournament Pages

#### Weather Intelligence
- **Loading**: Use `LoadingChart`
- **Empty**: Use `EmptyWeatherState`
- **Reason**: "Weather becomes available 5 days before tournament start"

#### DFS Value Boards
- **Loading**: Use `SkeletonTable`
- **Empty**: Use `EmptyDfsState`
- **Reason**: "DraftKings has not released salaries yet"

#### Field/Entrants
- **Loading**: Use `SkeletonCard`
- **Empty**: Use `EmptyFieldState`
- **Reason**: "Players commit by 5 p.m. ET Friday before tournament"

#### Odds Intelligence
- **Loading**: Use `SkeletonCard`
- **Empty**: Use `EmptyOddsState`
- **Reason**: "Sportsbook odds appear 1-2 days before start"

### Player Pages

#### Career Summary
- **Loading**: Use `LoadingMetric`
- **Empty**: Use `EmptyHistoryState`
- **Reason**: "Historical data is ingested as tournaments complete"

#### Course History
- **Loading**: Use `SkeletonTable`
- **Empty**: Use `EmptyHistoryState`
- **Reason**: "Course history builds from historical tournament data"

#### Form Rankings
- **Loading**: Use `SkeletonCard`
- **Empty**: Use `EmptyFormState`
- **Reason**: "Form is calculated from recent performance after tournament starts"

### Analytics Pages

#### Metrics Grids
- **Loading**: Map components to render `LoadingMetric` for each metric
- **Empty**: Use `ContextualEmptyState` with specific reason

#### Data Tables
- **Loading**: Use `SkeletonTable` with matching column count
- **Empty**: Use `ContextualEmptyState` with specific reason

## Implementation Checklist

When adding loading/empty states to a page or component:

- [ ] **Loading State**: Replace spinners with appropriate skeleton loader
- [ ] **Empty State**: Use specific empty state component or create custom `ContextualEmptyState`
- [ ] **Message Quality**:
  - [ ] Explains WHY data is empty (business reason)
  - [ ] Explains WHEN data will be available
  - [ ] Suggests a NEXT ACTION (refresh, navigate, etc.)
- [ ] **No Generic Messages**: Never use just "No data" or "Loading..."
- [ ] **Skeleton Matches Layout**: Skeleton proportions match final component
- [ ] **Accessible**: Use semantic HTML and ARIA labels
- [ ] **Tested**: Verify both loading and empty states in browser

## Accessibility

All loading and empty states must be accessible:

```tsx
// For skeleton loaders
<div aria-busy="true" role="status" aria-label="Loading tournament data...">
  <SkeletonCard />
</div>

// For empty states (already semantic with EmptyState component)
<EmptyWeatherState />
```

## Examples

### Tournament Weather (Complete Pattern)

```tsx
import { LoadingChart } from '@/components/loaders'
import { EmptyWeatherState } from '@/components/empty-states/empty-state-contexts'

export function WeatherSection({ data, isLoading }) {
  if (isLoading) {
    return <LoadingChart withTitle withLegend />
  }

  if (!data) {
    return <EmptyWeatherState />
  }

  return <WeatherIntelligence weather={data} />
}
```

### Player History (Complete Pattern)

```tsx
import { SkeletonTable } from '@/components/loaders'
import { EmptyHistoryState } from '@/components/empty-states/empty-state-contexts'

export function CourseHistoryTable({ history, isLoading }) {
  if (isLoading) {
    return <SkeletonTable rows={8} columns={5} withHeader />
  }

  if (!history || history.length === 0) {
    return <EmptyHistoryState />
  }

  return <DataTable data={history} />
}
```

## Migration Guide

### Before
```tsx
// Generic loading spinner
{isLoading && <Spinner />}
// Generic empty message
{!data && <p>No data</p>}
```

### After
```tsx
// Specific skeleton loader
{isLoading && <SkeletonTable />}
// Contextual empty state
{!data && <EmptyWeatherState />}
```

## Questions?

If you encounter a loading/empty state pattern not covered here:
1. Check if a specific context component exists
2. Use `ContextualEmptyState` with clear messaging
3. Add the pattern to this documentation
