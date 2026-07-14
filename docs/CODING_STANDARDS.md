# Coding Standards — CaddieIQ

These standards keep the codebase consistent, safe, and easy to extend. They
reflect patterns already established in the repository. When in doubt, mirror an
existing feature (e.g. `features/settings`).

---

## TypeScript

- **Strict mode is on.** No implicit `any`; fix types rather than suppressing.
- Prefer `interface` for object shapes and `type` for unions/aliases.
- Derive types from source: use `z.infer<typeof schema>` for form/validation
  types (see `validators/settings.ts`) and `typeof` for config objects (see
  `constants/site.ts`).
- Share cross-cutting types via `types/index.ts`; keep feature-local types in the
  feature.
- Avoid `as` casts; use type guards and proper generics instead.
- Type function inputs and outputs explicitly at module boundaries.

## Naming Conventions

| Entity | Convention | Example |
| --- | --- | --- |
| Files & folders | `kebab-case` | `stat-card.tsx`, `model-builder/` |
| React components | `PascalCase` | `DashboardView`, `StatCard` |
| Variables & functions | `camelCase` | `primaryNavigation`, `handleSubmit` |
| Types & interfaces | `PascalCase` | `StatMetric`, `NavItem` |
| Constants (config) | `camelCase` object / `UPPER_SNAKE` array of literals | `siteConfig`, `OVERVIEW_METRICS` |
| Zod schemas | `camelCaseSchema` | `workspaceSchema` |
| Boolean props | `is/has/can` prefix | `isActive`, `hasError` |

## Folder Organization

- `app/` — routes only; keep pages thin.
- `features/<domain>/` — domain views and logic (one folder per module).
- `components/ui/` — shadcn/ui primitives (generated; avoid manual edits).
- `components/shared/` — reusable cross-feature UI.
- `components/<group>/` — grouped UI (`layout/`, `navigation/`, `cards/`, `charts/`, `feedback/`).
- `constants/`, `hooks/`, `lib/`, `providers/`, `types/`, `validators/` — supporting modules.
- Use the `@/` path alias for imports; never deep relative chains (`../../../`).

## Component Organization

- One primary component per file; name the file after it in `kebab-case`.
- Keep components focused. Extract sub-components when a file grows large or a
  piece is reused — never build one giant view file.
- Compose from `components/shared` and `components/ui` (e.g. `PageShell`,
  `PageHeader`, `SectionHeader`, `EmptyState`) rather than duplicating layout.
- Props: define an explicit `Props` interface; destructure in the signature.
- Keep imports ordered: external packages, then `@/` internal modules.

## Server Components

- **Default to Server Components.** Route pages and static presentation should
  render on the server with no `'use client'` directive.
- Do data fetching on the server (via services/actions) and pass data down as
  props.
- Keep server components free of browser-only APIs and client state.

## Client Components

- Add `'use client'` only when you need interactivity, browser APIs, or client
  libraries (TanStack Query, React Hook Form, ECharts, next-themes).
- Push the client boundary as far down the tree as possible — wrap the smallest
  interactive piece, not the whole page.
- Never fetch inside `useEffect`; use TanStack Query or data passed from a server
  component.
- Client providers live in `providers/` and are composed in `providers/index.tsx`.

## Accessibility

- Use semantic HTML (`main`, `header`, `nav`, `section`) with correct ARIA roles
  and labels; label regions with `aria-label` as done in `DashboardView`.
- All interactive elements must be keyboard accessible and focus-visible.
- Provide `alt` text for meaningful images; mark decorative images appropriately.
- Use `sr-only` for screen-reader-only text.
- Maintain sufficient color contrast; if you change a background, change its
  foreground token too.

## Performance

- Favor server rendering to reduce client JS.
- Code-split heavy client-only libraries (charts) and load them where used.
- Memoize expensive client computations; keep re-renders shallow.
- Use TanStack Query caching for server state instead of ad-hoc fetching.
- Prefer the Tailwind spacing scale and utility classes over arbitrary values.

## Reusability

- Before writing new UI, check `components/shared` and `components/ui` for an
  existing solution.
- Extract shared logic into `hooks/` and shared helpers into `lib/`.
- Drive repeated structures from config (e.g. navigation from
  `constants/navigation.ts`) rather than hardcoding.

## Styling

- Use Tailwind v4 with the project's **design tokens** (`bg-background`,
  `text-foreground`, `text-muted-foreground`, etc.). Never use raw colors like
  `bg-white` or `text-black`.
- Apply fonts via `font-sans` / `font-mono` (configured in `app/layout.tsx`).
- Use `flex` and `gap-*` for layout; avoid mixing margin/padding with gap on the
  same element and avoid `space-*` utilities.
- Merge conditional classes with `cn()` from `lib/utils.ts`.

## Documentation

- Update the relevant `docs/` file whenever behavior, schema, or structure
  changes, and add a [CHANGELOG.md](./CHANGELOG.md) entry.
- Write comments for **why**, not **what**; let clear code explain the what.
- Keep JSDoc on non-obvious utilities, services, and shared types.
- Escape JSX literal characters and apostrophes correctly (`&apos;`, string
  expressions) to satisfy the linter.
