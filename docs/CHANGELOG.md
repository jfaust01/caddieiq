# Changelog

All notable changes to CaddieIQ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

**Weather Intelligence Engine**

- New signal family (`lib/weather-intelligence`) that turns a verified,
  imported forecast into an event's playing conditions — current conditions,
  round-by-round outlook, wind/rain timelines, and morning/afternoon tee-time
  (wave) edge — realizing the **Wind** model in `MODELS.md` §2.5. A pure core
  (`intelligence.ts` + `signals.ts` / `characteristics.ts` / `waves.ts`) grades
  every profile `verified` / `partial` / `unavailable` from forecast **age** and
  **round coverage**, capped by the Tournament Context Engine, and a `server-only`
  service resolves it per tournament. Every field is nullable end to end, so an
  absent signal reads as "no signal", never a fabricated `0`.
- New `weather_snapshots` / `weather_periods` tables (one snapshot per
  tournament, nullable per-signal periods) and a transactional
  `WeatherRepository` that atomically replaces a tournament's snapshot.
- New OpenWeather provider client (`lib/providers/weather`, timeout-guarded,
  retrying, rate-limited) and importer (`runWeatherImport`) that fetches only
  for tournaments with a linked host course + coordinates inside the forecast
  horizon — events without a venue are skipped, never fetched for a fabricated
  location. Requires `OPENWEATHER_API_KEY`; until it is set the surface reports
  `unavailable` rather than stub data.
- **Tournament Page** gains a Weather Intelligence section (conditions,
  round-by-round table, wind/rain timelines, wave edge, confidence badge) and the
  hero weather chip now reads from the same profile, so header and section agree.
- `docs/WEATHER_INTELLIGENCE.md` specifying the engine, its confidence rules,
  data model, importer, and consumer contract.

**Tournament Context Engine**

- New shared engine (`lib/tournament-context`) that is the single authoritative
  source of "which tournament is this player/page evaluating, and how complete
  is that context?" A pure normalizer (`context.ts`) grades every context as
  `verified` / `partial` / `unavailable` from verified DB facts only — never a
  fabricated event or course — and a `server-only` service (`service.ts`)
  resolves it for both a player (their next **upcoming** in-field event) and a
  tournament id, returning an identical normalized shape.
- `docs/TOURNAMENT_CONTEXT_ENGINE.md` specifying the engine, its confidence
  ceiling, resolution rules, and the contract for adding future models.

### Changed

- **Course Fit now consumes the shared context** on both surfaces instead of
  selecting an event independently. The Player Page's Course Fit card is
  replaced by an **Upcoming Tournament** card that surfaces the shared context
  (event header linking to the hub + Course Intelligence coverage summary) and
  attaches Course Fit only when the context is `verified`. The Tournament Page
  field board takes its host course from the same engine, so the whole page
  agrees on one event and one confidence.

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

**Course Fit Model**

- Pure scoring engine (`lib/analytics/course-fit/model.ts`) that matches a
  player's skill profile against a course's verified demand profile into an
  explainable, confidence-graded fit. A skill signal contributes only when both
  the course demand and player skill are verified; gaps are reported with a
  reason and the score stays `null` rather than defaulting to `0/100`.
- Player Page Course Fit card (fit vs. the player's next verified upcoming
  event's course; a neutral placeholder is shown when there is no such context —
  it is never computed from past events) and a tournament-hub field board (Top
  Fits, Fades, Trending Up, Most Uncertain) with an `X / N scored` coverage
  counter.
- `docs/COURSE_FIT_MODEL.md` specifying the signals, weighting, banding,
  confidence, and explainability contract.

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
