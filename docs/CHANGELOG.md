# Changelog

All notable changes to CaddieIQ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

**Course Intelligence Engine**

- Pure derivation layer (`lib/domain/course/profile.ts`) that turns verified
  `Course` + `CourseCharacteristic` data into a normalized, model-ready
  `CourseProfile`. Every attribute is `verified` or `unknown` — never estimated —
  and every rating normalizes onto a Low / Medium / High band from documented
  thresholds.
- `CourseIntelligencePanel`, surfaced on the Course Page and reused for the host
  venue on the Tournament Page, with an honest `verified / total` coverage badge.
- `docs/COURSE_INTELLIGENCE.md` specifying the engine, attribute catalog, and
  normalization contract.

---

## [0.1.0] — Foundation

The initial application foundation: a fully navigable, designed shell with the
complete component system and project documentation. No data, authentication, or
model computation is implemented yet.

### Added

**Foundation**

- Next.js 16 App Router project with strict TypeScript.
- `(app)` route group with all primary routes: Dashboard, Analytics, Rankings,
  Players, Tournaments, Courses, Models, Settings, and Help.
- Thin route pages that render views from `features/`.
- Application shell: sidebar, top navigation, footer, breadcrumbs, and command
  palette.
- Data-driven navigation from `constants/navigation.ts`.
- Route-level `loading` and `error` boundaries, plus `not-found` and
  `global-error` pages.
- Client providers: TanStack Query, theming (next-themes), tooltips, and toaster.
- Settings workspace form with React Hook Form + Zod validation.

**Design System**

- Tailwind CSS v4 with CSS-first `@theme` design tokens.
- Light and dark themes (default dark) via next-themes.
- shadcn/ui component library built on Base UI.
- Geist Sans and Geist Mono fonts.
- Shared building blocks: `PageShell`, `PageHeader`, `SectionHeader`,
  `EmptyState`, stat/feature cards, loaders, and error states.
- ECharts chart wrapper with theme awareness.

**Documentation**

- Added the `docs/` documentation system: `README`, `PRD`, `ARCHITECTURE`,
  `ROADMAP`, `DATABASE`, `FEATURES`, `CONTRIBUTING`, `CODING_STANDARDS`, and this
  `CHANGELOG`.

### Notes

- Views currently render placeholder metrics and empty states pending the data
  layer (Phase 2). See [ROADMAP.md](./ROADMAP.md).

[0.1.0]: https://caddieiq.app
