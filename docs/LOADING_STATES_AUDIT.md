# Loading States & Empty States Audit

This document audits all pages and features to identify where skeleton loaders and contextual empty states should be implemented.

## Tournaments Feature

### Tournament Detail Page (`/tournaments/[tournamentId]`)
**Current State**: Mixed patterns
- Weather: generic spinner + text explanations ✓
- DFS Value: no loading state, generic "no data" text
- Field: no loading state, generic "no entrants" text
- Odds: no loading state, generic messaging
- Course Fit: no loading state, generic "not available" text
- Skill Leaderboards: no loading state

**Updates Needed**:
- [ ] Replace spinners with `LoadingChart` for weather
- [ ] Replace spinners with `SkeletonTable` for DFS boards
- [ ] Replace spinners with `SkeletonCard` for field
- [ ] Add `EmptyWeatherState` for weather
- [ ] Add `EmptyDfsState` for DFS
- [ ] Add `EmptyFieldState` for field
- [ ] Add `EmptyOddsState` for odds
- [ ] Add `EmptyCourseFitState` for course fit

### Tournament List Page (`/tournaments`)
**Current State**: No loading states
- Tournament cards: loads without skeleton

**Updates Needed**:
- [ ] Add `SkeletonCard` grid while loading tournaments

## Players Feature

### Player Detail Page (`/players/[playerId]`)
**Current State**: Generic "not available" messages
- Career Summary: generic empty state
- Course History: generic "no data" message
- AI Summary: no loading state

**Updates Needed**:
- [ ] Add `LoadingMetric` for career metrics
- [ ] Add `SkeletonTable` for course history
- [ ] Add `EmptyHistoryState` for missing history
- [ ] Add `EmptyFormState` for form data

### Players List Page (`/players`)
**Current State**: No skeleton loaders

**Updates Needed**:
- [ ] Add `SkeletonTable` for player list while loading

## Rankings Feature

### Rankings Pages (`/rankings`, `/rankings/[type]`)
**Current State**: No loading states

**Updates Needed**:
- [ ] Add `SkeletonTable` for rankings while loading
- [ ] Add contextual empty state if no data

## Analytics Feature

### Analytics Page (`/analytics`)
**Current State**: Generic spinners

**Updates Needed**:
- [ ] Replace spinners with `LoadingMetric` for KPIs
- [ ] Replace spinners with `SkeletonTable` for data tables
- [ ] Replace spinners with `LoadingChart` for charts

## Model Lab Feature

### Model Lab Pages (`/model-lab`, `/model-lab/[modelId]`)
**Current State**: No loading states

**Updates Needed**:
- [ ] Add `SkeletonCard` for model cards while loading
- [ ] Add `LoadingMetric` for model metrics
- [ ] Add contextual empty state if no models

## Courses Feature

### Courses List Page (`/courses`)
**Current State**: No loading states

**Updates Needed**:
- [ ] Add `SkeletonCard` for course cards while loading

### Course Detail Page (`/courses/[courseId]`)
**Current State**: No loading states

**Updates Needed**:
- [ ] Add `LoadingChart` for course statistics
- [ ] Add `SkeletonTable` for course data

## Compare Feature

### Compare Page (`/compare`)
**Current State**: Generic loading messages

**Updates Needed**:
- [ ] Add skeleton loaders for player cards being compared
- [ ] Add `SkeletonTable` for comparison table

## AI Caddie Feature

### Caddie Page (`/caddie`)
**Current State**: No loading states

**Updates Needed**:
- [ ] Add skeleton loader for answer cards while processing
- [ ] Add contextual empty state for each engine (weather, DFS, etc.)

## Common Issues Found

1. **No loading states**: Many data-intensive pages have no visual feedback while loading
2. **Generic messages**: "No data", "Unavailable", "Not available" used repeatedly
3. **Inconsistent patterns**: Some components show spinners, some don't
4. **Missing context**: Empty states don't explain WHY data is missing

## Priority Implementation Order

### Phase 1 (Critical - User Facing)
1. Tournament Detail (high traffic, many empty states)
2. Players List/Detail (high traffic)
3. Rankings (high traffic)

### Phase 2 (Important)
1. Analytics
2. Model Lab
3. Compare

### Phase 3 (Nice-to-Have)
1. Courses
2. Admin pages
3. Help/Settings

## Success Criteria

Each updated page should have:
- [ ] Skeleton loaders for all loading states
- [ ] Contextual empty states (not generic "no data")
- [ ] Clear messaging about why data is empty
- [ ] Expected timeline for data availability
- [ ] Action button when appropriate (refresh, navigate, etc.)
- [ ] Accessible markup and ARIA labels
- [ ] Tested in browser for loading and empty states

## Component Usage Guide

| Pattern | Component | Use Case |
|---------|-----------|----------|
| Card loading | `SkeletonCard` | Individual data cards, metrics |
| Table loading | `SkeletonTable` | Data tables, leaderboards |
| Metric loading | `LoadingMetric` | KPIs, stats, values |
| Chart loading | `LoadingChart` | Visualizations, graphs |
| Weather empty | `EmptyWeatherState` | Tournament weather section |
| DFS empty | `EmptyDfsState` | DFS value boards |
| Field empty | `EmptyFieldState` | Tournament field/entrants |
| Form empty | `EmptyFormState` | Player form rankings |
| Odds empty | `EmptyOddsState` | Odds intelligence |
| History empty | `EmptyHistoryState` | Player history data |
| Results empty | `EmptyResultsState` | Tournament results |
| Custom empty | `ContextualEmptyState` | Any other scenario |

## Notes

- All skeleton loaders use the base `Skeleton` component for consistency
- Empty states use the standardized `EmptyState` component from UI
- Icons are from lucide-react for consistency
- Animations are handled by Tailwind's `animate-pulse` utility
