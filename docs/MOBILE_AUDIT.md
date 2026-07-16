# Mobile-First Audit: CaddieIQ

## Executive Summary

CaddieIQ has a solid responsive foundation using Tailwind CSS breakpoints (sm, md, lg, xl), but requires targeted optimization for mobile-first patterns. Key areas needing attention: table horizontal scrolling elimination, bottom sheet patterns for modals, thumb-friendly controls, and sticky action patterns for iOS/Android.

---

## 1. Tables & Data Displays

### Current State
- **RankingsTable**: Good breakpoint strategy (hidden sm/md/lg columns), but potential horizontal scroll on very small phones
- **ComparisonTable**: Uses `overflow-x-auto` wrapper — causes horizontal scrolling on mobile; no responsive column hiding strategy
- **Base Table component**: Proper overflow container, but relies on feature implementations for responsiveness

### Issues Identified
- Comparison table forces horizontal scroll instead of card/collapsed view
- No mobile card view for tabular data (RankingsTable works because it hides columns; ComparisonTable doesn't)
- Dense padding (p-2) may feel cramped on small phones

### Recommendations
- **Phase 1**: Implement ComparisonTable card view for mobile (stack players vertically, metric rows collapse to accordion)
- **Phase 2**: Add mobile card renderer to Table component with configuration
- **Phase 3**: Reduce padding on mobile: `p-2 sm:p-3` instead of fixed `p-2`

---

## 2. Cards (Stat, Feature, Metric)

### Current State
- **StatCard**: Grid-based layout, responsive text sizing
- **FeatureCard**: Basic structure without explicit mobile optimization
- **Dashboard**: 4-column metric grid collapses to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — good pattern

### Issues Identified
- Stat cards may have cramped icon + value layout on phones
- No explicit touch target sizing (should be ≥44px for thumb-friendly access)
- Metric cards lack visual hierarchy on small screens

### Recommendations
- Increase touch targets: minimum 44px height for interactive card regions
- Add explicit sm: breakpoints to adjust gap and padding
- Consider stack-to-grid pattern: `flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4`

---

## 3. Charts

### Current State
- Recharts-based charts inherit container width
- No explicit mobile viewport configuration for charts

### Issues Identified
- Wide charts may overflow or compress on mobile
- Legend positioning not optimized for portrait orientation
- Tooltip positioning may appear off-screen on small viewports

### Recommendations
- Wrap charts in responsive container: `w-full h-[300px] sm:h-[400px]`
- Implement responsive legend: `bottom` on mobile, `right` on lg
- Use Recharts' `dot={false}` to declutter mobile view
- Add explicit `margin` to ensure legends stay within bounds

---

## 4. AI Chat (Caddie)

### Current State
- Fixed heights: `h-[420px]` (compact) / `h-[600px]` (full)
- Message bubbles use `max-w-[85%]` for width constraint
- Composer textarea without explicit mobile optimization

### Issues Identified
- Fixed heights don't adapt to soft keyboard on mobile
- Message bubbles may feel cramped or too wide on small phones
- Composer button (send) may be hard to tap with thumb on small phones
- No bottom-sheet or expandable drawer pattern for mobile

### Recommendations
- **Phase 1 (Critical)**:
  - Use viewport-relative heights: `max-h-[50vh]` instead of fixed px
  - Adjust message max-width: `max-w-[90%]` on mobile (more breathing room)
  - Make composer button larger on mobile: `h-8 sm:h-10`
  
- **Phase 2**:
  - Implement mobile bottom-sheet trigger (chevron up + text "Ask the Caddie")
  - Expand to full viewport on mobile, keeping compact on desktop
  - Add safe-area padding for notch/home indicator

- **Phase 3**:
  - Add swipe-to-dismiss gesture on bottom sheet
  - Persist message history in localStorage for mobile resumability

---

## 5. Dialogs & Modals

### Current State
- Uses Base UI Dialog component
- Sheet component available for bottom-sheet patterns
- No explicit mobile optimization for dialog positioning/sizing

### Issues Identified
- Desktop-style centered modals may not respect soft keyboard on mobile
- No bottom-sheet pattern for mobile context (less context switching)
- Dialog width may be too wide on phones

### Recommendations
- **Phase 1**: Implement responsive dialog sizing:
  ```tsx
  // Mobile: full width with safe-area padding
  // Desktop: centered with max-width
  className="w-full md:max-w-md md:rounded-lg md:shadow-lg"
  ```
  
- **Phase 2**: For forms/decisions, use bottom sheet on mobile:
  ```tsx
  import { Sheet } from '@/components/ui/sheet'
  // Use Sheet instead of Dialog for mobile-first forms
  ```

- **Phase 3**: Add keyboard handling to dialogs (close on Escape, manage focus)

---

## 6. Decision Workspace / Dashboard

### Current State
- Dashboard uses grid layout: `grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`
- Good breakpoint strategy overall
- Account summary positioned at top (fixed)

### Issues Identified
- Account summary may not be sticky on scroll
- No bottom navigation or sticky action bar on mobile
- Performance chart (2/3 width on lg) stacks 100% on mobile — good, but no indication of primary action

### Recommendations
- **Phase 1**: Sticky account summary or navigation:
  ```tsx
  className="sticky top-0 z-40 bg-background/95 backdrop-blur"
  ```

- **Phase 2**: Add mobile bottom action bar for primary CTA:
  ```tsx
  // "New model" button becomes sticky bottom bar on mobile
  className="fixed bottom-0 left-0 right-0 p-4 sm:static bg-background border-t sm:border-t-0"
  ```

- **Phase 3**: Reorganize dashboard priority on mobile (metrics → account → recent → performance)

---

## 7. Tournament Command Center

### Current State
- Collapsible widgets using command-center-widget shell
- Sticky header with tournament meta
- Widgets use full width

### Issues Identified
- Sticky header may not have safe-area padding for notch devices
- Widget titles take up space; consider collapsing to icons on mobile
- Follow-up chips may wrap awkwardly on small screens

### Recommendations
- **Phase 1**: Add safe-area padding to sticky header:
  ```tsx
  className="sticky top-0 z-30 pt-safe px-safe"
  ```

- **Phase 2**: Compress widget headers on mobile:
  - Show title only (hide subtitle) below sm
  - Use icons instead of full descriptions on very small screens
  
- **Phase 3**: Implement swipe gestures for widget collapse/expand

---

## 8. Comparison Interface

### Current State
- Comparison table uses `overflow-x-auto` (horizontal scroll)
- No explicit mobile card view

### Issues Identified
- Horizontal scrolling violates mobile-first principle
- Metrics and player columns hard to correlate on small screens

### Recommendations
- **Phase 1 (Critical)**: Implement mobile card view:
  ```tsx
  // On mobile, render as: Player A | Metric | Player B comparison cards
  // Stack vertically with metric separator
  ```
  
- **Phase 2**: Add toggle between table (lg+) and card (md-) views
- **Phase 3**: Swipe between players on mobile card view

---

## 9. Search Interface

### Current State
- Search input with dropdown results
- No explicit mobile optimization for dropdown positioning

### Issues Identified
- Dropdown may not respect keyboard on mobile
- Results list may be hard to navigate with touch
- Large touch targets not guaranteed

### Recommendations
- **Phase 1**: Ensure search results list is touchable:
  ```tsx
  // Each result: min-h-12 (≥44px touch target)
  className="min-h-12 px-3 py-2"
  ```

- **Phase 2**: Use sheet/drawer for search results on mobile instead of dropdown
- **Phase 3**: Add swipe-to-search gesture (swipe down to focus search)

---

## 10. Metric Cards / KPIs

### Current State
- Grid-based layout with responsive columns
- Good use of sm/md breakpoints

### Issues Identified
- Icon sizing (size-12) may be too large on small screens
- Value typography not scaled for small viewports
- Gap between cards may be too tight or too loose on mobile

### Recommendations
- **Phase 1**: Scale icon and text on mobile:
  ```tsx
  className="size-8 sm:size-12"  // Icon
  className="text-xl sm:text-2xl"  // Value
  ```

- **Phase 2**: Adjust gap based on breakpoint:
  ```tsx
  className="gap-2 sm:gap-3 lg:gap-4"
  ```

---

## 11. Mobile-First Patterns & Best Practices

### Sticky Actions (iOS/Android Safe Area)
```tsx
// Bottom sticky action bar for primary CTA
<div className="fixed bottom-0 left-0 right-0 pb-safe px-safe bg-background border-t">
  {/* Use pb-safe for home indicator, px-safe for notch */}
</div>
```

### Swipe Gestures
- Bottom sheet dismiss: swipe down
- Comparison cards: swipe left/right to switch players
- Command center: swipe left to collapse widget

### Bottom Sheets (vs Modals)
Use for:
- Filters, sorts, options menus
- Forms on mobile
- Comparison results
- Chat expansion

### Responsive Typography
```tsx
className="text-sm sm:text-base md:text-lg"  // Scale with viewport
className="text-balance"  // Better line breaks
```

### Thumb-Friendly Controls
- Minimum touch target: 44px × 44px
- Spacing between targets: ≥8px
- Place primary actions in bottom half of screen on phones

---

## 12. Implementation Roadmap

### Phase 1 (Critical — Week 1-2)
- [ ] Fix ComparisonTable horizontal scroll (implement card view)
- [ ] Add safe-area padding to sticky headers
- [ ] Ensure all touch targets ≥44px
- [ ] Bottom action bar for dashboard/primary CTAs
- [ ] Responsive typography scaling

### Phase 2 (High Priority — Week 3-4)
- [ ] Implement bottom sheet for modals on mobile
- [ ] Optimize AI Chat for viewport heights + soft keyboard
- [ ] Responsive chart legends and sizing
- [ ] Widget header compression on mobile
- [ ] Search results as sheet on mobile

### Phase 3 (Nice-to-Have — Week 5-6)
- [ ] Swipe gestures (bottom sheet dismiss, comparison cards)
- [ ] Widget collapse/expand gestures
- [ ] Persist chat history to localStorage
- [ ] Optimized metric card sizing
- [ ] Horizontal scrolling elimination audit for all data displays

---

## 13. Testing Checklist

- [ ] Test on iPhone SE (375px), iPhone 14 (390px), iPhone 14 Pro Max (430px)
- [ ] Test on Android: Pixel 7 (412px), Pixel 7 Pro (512px)
- [ ] Portrait and landscape orientation for each device
- [ ] Soft keyboard appearance (search, composer, forms)
- [ ] Safe-area padding on notch/home indicator devices
- [ ] Touch target spacing and 44px minimum verification
- [ ] No horizontal scrolling on any surface
- [ ] Sticky headers and footers position correctly over content
- [ ] Modals and sheets dismiss correctly on mobile
- [ ] Images scale and don't overflow viewport

---

## 14. CSS Utilities to Add (if needed)

```css
/* Safe area padding for notch devices */
@supports (padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  .px-safe {
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
  }
}

/* Responsive text balance */
.text-balance {
  text-wrap: balance;
}
```

---

## Summary

CaddieIQ's responsive foundation is solid, but mobile-first optimization requires:
1. **Eliminate horizontal scrolling** (tables, data displays)
2. **Optimize for touch** (44px targets, thumb-friendly placement)
3. **Respect mobile context** (safe-area padding, soft keyboard handling)
4. **Implement mobile patterns** (bottom sheets, sticky actions, swipe gestures)
5. **Scale typography and spacing** responsively

**Success Criteria:**
- ✓ Zero horizontal scrolling on any surface (all breakpoints)
- ✓ 100% of interactive elements ≥44px × 44px
- ✓ All modals use bottom sheets on mobile
- ✓ Sticky headers/footers include safe-area padding
- ✓ Soft keyboard doesn't occlude primary actions
- ✓ Passing WebAIM mobile accessibility audit

---

## Related Docs
- `docs/DESIGN_SYSTEM_AUDIT.md` — Component consistency
- `docs/LOADING_STATES_AUDIT.md` — Skeleton patterns
- `docs/EXPLAINABILITY_AUDIT.md` — Why explanations
