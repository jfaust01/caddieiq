# ADR-013: Tailwind CSS for Styling

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Design & Frontend Team  

---

## Context

CaddieIQ requires a styling solution that:
- Integrates with Next.js 16
- Maintains design consistency
- Scales with team growth
- Supports dark mode
- Performs well in production

---

## Decision

**Use Tailwind CSS v4 for all styling.**

- Utility-first CSS framework
- Config-driven design tokens
- Built-in dark mode support
- Minimal custom CSS needed

---

## Implementation

### Theme Configuration
```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-brand: #1a73e8;
  --color-brand-light: #d2e3fc;
  --color-brand-dark: #0d47a1;
  
  --color-success: #34a853;
  --color-warning: #fbbc04;
  --color-error: #ea4335;
  
  --color-background: white;
  --color-surface: #f8f9fa;
  --color-text: #202124;
  --color-text-secondary: #5f6368;
  
  @media (prefers-color-scheme: dark) {
    --color-background: #202124;
    --color-surface: #292a2d;
    --color-text: #e8eaed;
    --color-text-secondary: #9aa0a6;
  }
}
```

### Component Patterns
```typescript
// ✓ Use semantic utilities, not inline styles
export function TournamentCard({ tournament }) {
  return (
    <div className="bg-surface rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-text">{tournament.name}</h3>
      <p className="mt-2 text-sm text-text-secondary">{tournament.description}</p>
      <div className="mt-4 flex gap-2">
        <button className="bg-brand text-white px-4 py-2 rounded font-medium hover:bg-brand-dark">
          View
        </button>
      </div>
    </div>
  )
}
```

### Responsive Design
```typescript
// Mobile-first by default
export function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Single column on mobile, 2 on tablet, 3 on desktop */}
    </div>
  )
}
```

---

## Consequences

### ✓ Positive

- Fast development (utilities preconfigured)
- Consistent design tokens (theme config)
- Small CSS bundle (unused styles purged)
- Dark mode built-in
- No naming conflicts
- Works great with components

### ✗ Negative

- Initial learning curve
- Class names can be verbose
- Requires discipline for consistency
- Not suitable for document-style content (blog)

---

## Related ADRs

- ADR-011: Next.js App Router (styling in layout)
- ADR-001: Feature-based architecture (components co-located)

