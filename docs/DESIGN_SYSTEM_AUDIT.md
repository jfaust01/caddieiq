# CaddieIQ Design System Audit

## Executive Summary

This audit evaluates visual consistency across the CaddieIQ application across spacing, typography, card design, badges, buttons, and specialized components. The application has a solid foundation with Tailwind CSS and a comprehensive design token system, but several inconsistencies exist that reduce visual cohesion.

**Status**: Generally well-designed, but requires standardization in 5 key areas.

---

## 1. Color & Design Tokens ✅

### Current State
- **Foundation**: OKLch color system with light/dark modes
- **Structure**: Well-organized semantic tokens (primary, secondary, success, warning, destructive)
- **Implementation**: CSS custom properties in `globals.css`
- **Consistency**: ✅ Excellent

### Recommendations
No immediate changes required. The token system is robust and properly scoped.

---

## 2. Typography ⚠️

### Current State
- **Fonts**: Geist Sans (body) + Geist Mono (code)
- **Scale**: Mostly consistent (sm, base, lg, xl)
- **Line Heights**: Consistent use of `leading-relaxed` (1.625)

### Issues Found
1. **Inconsistent heading sizes**: Some cards use `text-base`, others use `text-lg` for titles
2. **Inconsistent text sizing**: `text-[0.625rem]` (badge labels) vs `text-xs` (typical small text) — custom values should be replaced with scale
3. **Missing semantic classes**: Some components hardcode sizes instead of using `text-sm`, `text-base`

### Recommendations
- [ ] Standardize card titles to `text-base font-semibold`
- [ ] Use only `text-xs` (not `text-[0.625rem]`) for badge labels
- [ ] Replace all `text-[...]` custom sizes with Tailwind scale
- [ ] Document heading hierarchy in component library

---

## 3. Spacing & Layout

### Current State
- **Base unit**: 4px (0.25rem), 8px (0.5rem), 12px (0.75rem), 16px (1rem)
- **Card spacing**: Uses CSS variable `--card-spacing` (16px default, 12px small)
- **Component gaps**: Generally consistent

### Issues Found
1. **Inconsistent card padding**: StatCard uses `gap-3` while AiSummaryCard uses `gap-2.5` and `gap-1.5`
2. **Button/Icon spacing**: Icon+text spacing uses both `gap-1` and `gap-1.5` inconsistently
3. **Badge spacing**: `has-data-[icon=inline-end]:pr-1.5` mixed with `pr-2`

### Recommendations
- [ ] Standardize metric card padding to `p-4` with `gap-3` (3 baseline units)
- [ ] Standardize icon+text spacing to `gap-1.5` across all components
- [ ] Create reusable `CardMetric`, `CardInsight`, `CardDash` component variants
- [ ] Document spacing scale: `gap-1` for tight, `gap-2` for normal, `gap-3` for spacious

---

## 4. Shadows & Elevation

### Current State
- **Card shadow**: `ring-1 ring-foreground/10` (border ring, no drop shadow)
- **Button hover**: `hover:shadow-md` on StatCard only
- **Elevation**: Minimal, mostly reliant on rings and backgrounds

### Issues Found
1. **Inconsistent hover effects**: Only StatCard has shadow, others use `hover:bg-muted`
2. **FeatureCard uses `hover:border-primary/40`** instead of shadow
3. **No focus elevation** — all use rings, no consistent shadow pattern

### Recommendations
- [ ] Standardize to `ring-1 ring-foreground/10` for all cards (no drop shadows)
- [ ] Standardize hover to `hover:shadow-sm` or keep ring-only for consistency
- [ ] Ensure all interactive elements use `focus-visible:ring-3 focus-visible:ring-ring/50`

---

## 5. Badges & Chips

### Issues Found

#### **Confidence Badges** — HIGHLY INCONSISTENT
- `player-dfs-value-card.tsx`: Custom CONFIDENCE mapping with `'default' | 'secondary' | 'outline'`
- `player-odds-card.tsx`: Separate CONFIDENCE mapping, different labels
- `player-skill-card.tsx`: Another CONFIDENCE mapping
- `explanation-breakdown.tsx`: Uses `CONFIDENCE_CHIP` with custom classes like `"border text-[0.625rem]"`

**Problem**: Same concept (confidence level) has 4 different implementations.

#### **Status Badges** — INCONSISTENT
- `TournamentStatusBadge`: Uses `TONE_STYLES` mapping with color variants
- `PlayerStatusBadge`: Likely different structure (need to verify)
- `FieldStatusBadge`: Unknown implementation

**Problem**: Status badges don't use a shared contract.

#### **Styling Issues**
- Badge text sizes: `text-xs` vs `text-[0.625rem]` vs hardcoded sizes
- Badge variants: mix of `'default'`, `'secondary'`, `'outline'` for confidence
- Badge icons: `size-1.5`, `size-3`, `size-4` — inconsistent icon sizing

### Recommendations
- [ ] **Create reusable `ConfidenceBadge` component** with variants `high`, `medium`, `low`
- [ ] **Create reusable `StatusBadge` component** with variants `scheduled`, `active`, `completed`, `cancelled`
- [ ] Standardize badge text to `text-xs` (remove custom `text-[0.625rem]`)
- [ ] Standardize badge icon to `size-3` (12px)
- [ ] Standardize dot indicator to `size-1.5` with `opacity-80`

---

## 6. Buttons

### Current State
- **Variants**: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
- **Sizes**: `default` (h-8), `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- **Focus**: Consistent `focus-visible:ring-3`

### Issues Found
1. **Some buttons use `nativeButton={false}` with render prop** (Base UI pattern) — breaks standard Button usage
2. **Icon button sizing**: `icon-xs` (6px height) vs `size-6` vs `size-8` — inconsistent
3. **Button text sizes**: Mixed `text-xs`, `text-sm`, `text-[0.8rem]` in size definitions

### Recommendations
- [ ] Audit for non-standard Button usage (Base UI render prop pattern) — ensure consistency
- [ ] Verify all icon buttons use proper `icon-*` sizes
- [ ] Replace custom `text-[0.8rem]` with `text-xs`

---

## 7. Cards

### Current Implementations

#### **Metric Cards** (StatCard)
- Structure: Icon → Label, Value + Delta, Hint
- Padding: `gap-3` (consistent)
- Hover: `hover:shadow-md`
- Icon background: `bg-muted` with rounded-lg

#### **Feature Cards** (FeatureCard)
- Structure: Icon → Title, Description, (Arrow)
- Padding: Uses Card defaults
- Hover: `hover:border-primary/40 hover:shadow-md`
- Icon background: `bg-accent`

#### **AI Cards** (AiSummaryCard, AiInsightCard)
- AiSummaryCard: `ring-primary/20` (different ring color!)
- Structure: Icon → Title, Prose, Steps, Caveat
- Icon background: `bg-primary/10`
- Padding: Inconsistent (`gap-3`, `gap-2.5`, `gap-1.5`)

### Issues Found
1. **Icon background colors vary**: `bg-muted`, `bg-accent`, `bg-primary/10`, `bg-primary/20`
2. **Icon sizing inconsistent**: `size-8` vs `size-5` vs `size-4`
3. **Ring color inconsistent**: `ring-foreground/10` (default) vs `ring-primary/20` (AiSummaryCard only)
4. **No standardized "InsightCard" or "DecisionCard" component**

### Recommendations
- [ ] **Create `MetricCard` component** with consistent icon styling (`bg-muted`, `size-8`, icon `size-4`)
- [ ] **Create `InsightCard` component** for AI content with `ring-primary/10` and standardized spacing
- [ ] **Create `StatusCard` component** for event/state information
- [ ] Standardize all cards to `ring-1 ring-foreground/10` (except InsightCard which uses `ring-primary/10`)
- [ ] Document padding scales: `p-4 gap-3` (spacious), `p-3 gap-2` (normal)

---

## 8. Empty States

### Current State
- `EmptyState` component exists in `components/shared/`
- Used inconsistently across features

### Recommendations
- [ ] Audit all empty states for consistent icon styling and messaging
- [ ] Ensure all use the shared component

---

## 9. Tables & Lists

### Current State
- Table component exists with standard structure
- Pagina exists

### Recommendations
- [ ] Ensure consistent row height (h-8, h-9, h-10)
- [ ] Standardize cell padding (`px-4 py-2`)
- [ ] Verify header styling is consistent

---

## 10. Tooltips & Info UI

### Current State
- Tooltip component exists
- Info tooltips mixed implementations

### Recommendations
- [ ] Audit for consistent tooltip trigger styling
- [ ] Ensure all use consistent `className="rounded-lg"` and shadow

---

## 11. Dialogs & Drawers

### Current State
- Dialog and Sheet components available

### Recommendations
- [ ] Verify consistent backdrop blur and overlay opacity
- [ ] Ensure consistent header/footer styling
- [ ] Check button alignment in footers

---

## 12. Forms & Inputs

### Current State
- Input, Field, InputGroup, Checkbox, Switch available
- Base UI pattern used

### Recommendations
- [ ] Audit for consistent label styling
- [ ] Verify error state styling
- [ ] Ensure focus states are uniform

---

## 13. Loading & Skeleton States

### Current State
- Skeleton and Spinner components exist

### Recommendations
- [ ] Verify skeleton animation is consistent
- [ ] Ensure spinner sizing is standardized
- [ ] Check loading indicator background (if any)

---

## Priority Fixes

### Phase 1: Critical (Week 1)
1. **Extract ConfidenceBadge** — standardize across all confidence indicators
2. **Extract StatusBadge** — standardize tournament/player status displays
3. **Standardize badge text size** — replace `text-[0.625rem]` with `text-xs`
4. **Fix ring colors** — ensure all cards use `ring-foreground/10` except InsightCard

### Phase 2: Important (Week 2)
1. **Create MetricCard component** — standardize all metric/stat displays
2. **Create InsightCard component** — standardize AI/explanation content
3. **Audit and fix button icon sizing**
4. **Standardize card padding and gaps**

### Phase 3: Nice-to-Have (Week 3)
1. Document component library in Storybook or similar
2. Create design tokens documentation
3. Add accessibility audit

---

## Implementation Checklist

### Components to Extract/Create
- [ ] `ConfidenceBadge` (`components/badges/confidence-badge.tsx`)
- [ ] `StatusBadge` (`components/badges/status-badge.tsx`)
- [ ] `MetricCard` (`components/cards/metric-card.tsx`)
- [ ] `InsightCard` (`components/cards/insight-card.tsx`)
- [ ] `DecisionCard` (`components/cards/decision-card.tsx`)

### Files to Refactor
- [ ] `features/players/components/player-dfs-value-card.tsx` — use ConfidenceBadge
- [ ] `features/players/components/player-odds-card.tsx` — use ConfidenceBadge
- [ ] `features/players/components/player-skill-card.tsx` — use ConfidenceBadge
- [ ] `features/explainability/components/explanation-breakdown.tsx` — use ConfidenceBadge
- [ ] `features/tournaments/components/tournament-status-badge.tsx` — verify/refactor
- [ ] `components/cards/stat-card.tsx` — verify MetricCard usage
- [ ] `features/model-lab/components/ai-insight-card.tsx` — use InsightCard
- [ ] `features/players/components/ai-summary-card.tsx` — use InsightCard

### Design Tokens to Add
- [ ] Standardize icon background colors: `bg-metric` (muted), `bg-insight` (primary/10)
- [ ] Document card padding scales in Tailwind config

---

## Success Criteria

✅ The application should feel like it was designed by one team in one design system rather than built over many sprints.

- [ ] All confidence badges are identical in styling and behavior
- [ ] All status badges are identical in styling and behavior
- [ ] All metric cards have consistent padding, spacing, icon sizing
- [ ] All AI/insight cards have consistent typography and spacing
- [ ] No custom Tailwind sizes (e.g., `text-[0.625rem]`) are used
- [ ] All components use the shared design token system
- [ ] All focus/hover states are consistent across interactive elements
- [ ] All cards use consistent ring/shadow patterns

---

## Related Documentation
- See `PRODUCT.md` for product architecture
- See `TOURNAMENT_COMMAND_CENTER.md` for Command Center design
- See `AI_CADDIE.md` for AI Caddie design
- See `globals.css` for design tokens
