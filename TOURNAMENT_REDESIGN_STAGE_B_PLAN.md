# Tournament Overview Redesign - Stage B Implementation Plan

**Status**: Ready for Implementation  
**Estimated Scope**: 5-7 medium tasks  
**Dependencies**: Stage A (COMPLETE)

---

## Overview

Stage B will complete the redesign by:
1. Implementing URL-based tab routing (deep linking)
2. Moving full intelligence engine content to their proper tabs
3. Removing all duplication from the command center
4. Optimizing mobile tab UX
5. Testing all functionality end-to-end

---

## Architecture Goals for Stage B

### Current Architecture (Post Stage A)
```
TournamentCommandCenter
├── Command Center Widgets (Above tabs)
│   ├── Morning Brief
│   ├── AI Coach
│   ├── Trending
│   ├── Your Players
│   ├── Tournament Story
│   ├── Ask Caddie
│   └── Tournament Elevation Hub
└── TournamentDetailTabs
    ├── Overview (compact dashboard)
    ├── Field (full player list)
    ├── DFS (full table)
    ├── Weather (full timeline)
    ├── Course (full intelligence)
    ├── Betting (full odds)
    ├── Analytics (fit board + skill leaderboards)
    └── Sidebar (tournament research)
```

### Stage B Goals
- ✓ URL-based tab state (`/tournaments/[id]?tab=dfs`)
- ✓ Browser back/forward button support
- ✓ Deep link sharing (copy URL, send to friend)
- ✓ Tab state persistence across navigation
- ✓ Mobile-optimized tab scrolling
- ✓ Zero breaking changes to existing URLs

---

## Implementation Tasks

### Task 1: URL Query Param Tab Routing

**Objective**: Make tabs URL-addressable and deep-linkable

**Current State**:
```tsx
// tournament-detail-tabs.tsx (client component)
const [activeTab, setActiveTab] = useState('overview')
<Tabs value={activeTab} onValueChange={setActiveTab} />
```

**Desired State**:
```tsx
// Make TournamentDetailTabs a client component with useRouter hook
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
const activeTab = searchParams.get('tab') || 'overview'

const handleTabChange = (value) => {
  router.push(`?tab=${value}`, { scroll: false })
}
```

**Files to Modify**:
- `tournament-detail-tabs.tsx` → Make client component, add useRouter/useSearchParams
- `tournament-command-center.tsx` → Remove 'use client', pass through server data

**Complexity**: LOW  
**Breaking Changes**: NONE (backward compatible - default tab='overview')

---

### Task 2: Tab Content Consolidation & Deduplication

**Objective**: Move all full intelligence content into tabs, remove from command center

**Current Redundancy**:
- Command center has some widget references + command-center-widget wrappers
- Tabs have the same content
- Mix of two rendering patterns

**Changes Required**:

| Widget | Current Location | Move To Tab | Action |
|--------|------------------|-------------|--------|
| DFS Leaderboards | Command center widget | DFS tab | Extract to tab content |
| Skill Leaderboards | Command center widget | Analytics tab | Extract to tab content |
| Field Fit Board | Command center widget | Analytics tab | Extract to tab content |
| Course Intelligence | Command center widget | Course tab | Extract to tab content |
| Course Analytics | Command center widget | Course tab | Consolidate with Course tab |
| Weather Intelligence | Command center widget | Weather tab | Extract to tab content |
| Odds Intelligence | Command center widget | Betting tab | Extract to tab content |

**Files to Modify**:
- `tournament-command-center.tsx` → Remove widget wrappers for moved content
- `tournament-detail-tabs.tsx` → Update tab content references

**Complexity**: MEDIUM  
**Breaking Changes**: NONE (content just moves, not removed)

---

### Task 3: Tab Count Badges

**Objective**: Show dynamic counts on relevant tabs

**Implementation**:
```tsx
// In command center, pass counts to TournamentDetailTabs
additionalTabs={[
  {
    value: 'dfs',
    label: 'DFS',
    content: <DFS />,
    count: dfsField?.players?.length ?? 0,  // Already in additionalTabs
  },
  {
    value: 'analytics',
    label: 'Analytics',
    content: <Analytics />,
    count: (skillLeaderboards?.length ?? 0) + 1, // Fit board
  },
]}
```

**Files to Modify**:
- `tournament-detail-tabs.tsx` → Already supports count display (line 67-71)
- `tournament-command-center.tsx` → Pass counts to additionalTabs array

**Complexity**: LOW  
**Breaking Changes**: NONE

---

### Task 4: Mobile Tab Scrolling Optimization

**Objective**: Improve tab header UX on mobile

**Current Implementation**:
```tsx
<div className="overflow-x-auto">
  <TabsList>
    {/* Tabs here */}
  </TabsList>
</div>
```

**Enhancements**:
- Add scroll-snap-type for smooth snapping
- Implement tab indicators/dots for small screens
- Consider slide-out drawer for tabs on very small screens (< 400px)
- Test with actual devices

**Files to Modify**:
- `tournament-detail-tabs.tsx` → Add mobile-specific styling

**CSS Changes**:
```css
.overflow-x-auto {
  scroll-snap-type: x mandatory;
}
```

**Complexity**: LOW-MEDIUM  
**Breaking Changes**: NONE

---

### Task 5: Test All Functionality

**Objective**: Verify all existing functionality works in new structure

**Test Cases**:
- [ ] Navigate to tournament page, default tab is Overview
- [ ] Click "View all" in leaderboard → switches to Field tab
- [ ] Click "View all DFS" in compact DFS → switches to DFS tab
- [ ] Click "View course" in fit summary → opens Course tab or navigates away
- [ ] Click browser back button → goes back to previous tab
- [ ] Share URL with `?tab=dfs` → page loads with DFS tab active
- [ ] All player links navigate correctly
- [ ] Search & filter still work in Field tab
- [ ] DFS table sorting & filtering works
- [ ] Weather timeline loads
- [ ] Course intelligence data renders
- [ ] Odds table displays
- [ ] Sidebar still shows tournament research
- [ ] Mobile: tabs scroll horizontally
- [ ] Mobile: no horizontal overflow anywhere
- [ ] No console errors or warnings

**Files to Test**:
- All 7 new compact components
- tournament-detail-tabs.tsx
- tournament-command-center.tsx
- All referenced intelligence components

**Complexity**: MEDIUM  
**Breaking Changes**: NONE (should be regression-free)

---

### Task 6: Performance Monitoring

**Objective**: Verify no performance regressions

**Metrics to Check**:
- Page load time (LCP, FCP)
- Time to interactive (FID/INP)
- Cumulative layout shift (CLS)
- Bundle size (should decrease due to removed duplicates)
- Network requests (should be same - no new queries)

**Tools**:
- Web Vitals (Core Web Vitals)
- Lighthouse audit
- DevTools performance profiler

**Complexity**: LOW  
**Breaking Changes**: NONE

---

### Task 7: Documentation & Handoff

**Objective**: Document final implementation for future maintainers

**Deliverables**:
- [ ] Update README.md with new component architecture
- [ ] Document tab routing pattern
- [ ] Add component hierarchy diagram
- [ ] Document Stage B completion report
- [ ] Record video walkthrough of new UI
- [ ] Add comments in complex sections

**Complexity**: LOW  
**Breaking Changes**: NONE

---

## Implementation Sequence

**Recommended Order** (can be parallelized):
1. **Task 1** (URL routing) - Foundation, unblocks others
2. **Task 3** (Count badges) - Parallel with Task 1
3. **Task 2** (Content consolidation) - After Task 1
4. **Task 4** (Mobile optimization) - Parallel with Task 2
5. **Task 5** (Testing) - After Tasks 1-4
6. **Task 6** (Performance) - After Task 5
7. **Task 7** (Documentation) - Final

---

## Risk Assessment

### Low Risk
- URL routing (isolated, well-understood pattern)
- Count badges (already implemented)
- Mobile styling (CSS-only)
- Documentation (post-implementation)

### Medium Risk
- Tab content consolidation (requires careful refactoring to avoid breaking changes)
- Testing (scope creep if new bugs discovered)

### High Risk
- NONE identified at this time

---

## Success Criteria

All of the following must be true for Stage B PASS:

- ✓ Tournament page renders with new compact overview
- ✓ All tabs are URL-addressable (`?tab=dfs`, etc.)
- ✓ Deep links work (copy URL, send to friend, page loads with correct tab)
- ✓ Browser back/forward buttons work
- ✓ All existing actions still work (field search, DFS filtering, etc.)
- ✓ No duplicated content in DOM
- ✓ No duplicated database queries
- ✓ Page height remains ~2-3 viewport heights
- ✓ Mobile responsive (no horizontal overflow)
- ✓ Tab scrolling works on mobile
- ✓ No console errors
- ✓ All tests pass
- ✓ Performance unchanged (Core Web Vitals green)
- ✓ No regressions to Player Intelligence
- ✓ No regressions to Course Intelligence
- ✓ Build passes
- ✓ All 5 requirements from initial brief met

---

## Fallback Strategy

If Stage B encounters blockers:

1. **Partial Completion**: Keep URL routing + one tab migration complete, defer others
2. **Rollback**: Revert to Stage A (working state) and reassess
3. **Alternative Approach**: Implement route segment tabs instead of query params if issues

---

## Stage A → Stage B Handoff Checklist

- ✓ Stage A complete and tested
- ✓ All components compiling without errors
- ✓ Build passes
- ✓ No new regressions introduced
- ✓ Data flow verified (zero new queries)
- ✓ Ready for tab routing implementation
- ✓ Component hierarchy documented
- ✓ Tab configuration in place

**READY TO PROCEED TO STAGE B** ✓

---

## Questions for Future Implementation

1. Should "History" tab be implemented in Stage B or later?
2. Should Course Insights & Course Overview wrappers be consolidated with Course Intelligence?
3. Should Command Center widgets be collapsible to save space?
4. Should there be a "Saved" or "Favorites" tab for user-specific content?
5. Should tabs persist across sessions (localStorage) or just current session?

---

## Timeline Estimate

- **Task 1** (URL routing): 2-3 hours
- **Task 2** (Consolidation): 3-4 hours
- **Task 3** (Badges): 1 hour
- **Task 4** (Mobile): 1-2 hours
- **Task 5** (Testing): 2-3 hours
- **Task 6** (Performance): 1 hour
- **Task 7** (Documentation): 1-2 hours

**Total**: 11-16 hours (2-3 days with parallel work)

---

## Sign-Off

**Stage B Ready for Implementation** ✓

All Stage A objectives complete. Foundation solid. No blockers identified.

Proceed to Stage B with confidence.
