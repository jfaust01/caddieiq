# Tournament Command Center

The Tournament Command Center is the mission-control landing surface for a single
tournament. It reorganizes every existing CaddieIQ intelligence engine (weather,
odds, DFS value, course fit, player skill, field analytics, and the intelligence
timeline) into a single collapsible widget dashboard, and layers four new
**derived summaries** on top of them.

The Command Center **never fabricates data**. Every widget is a pure, null-safe
projection over verified engine output. When an engine has no data (e.g. a
`Scheduled` event with no field yet), the corresponding widget degrades to an
explicit "not available yet" state instead of inventing content.

## Architecture

```
lib/command-center/            Pure derivation logic (no React, fully unit-tested)
  types.ts                     Shared input/output interfaces
  brief.ts                     buildMorningBrief()   -> five things that matter today
  story.ts                     buildTournamentStory() -> auto-generated narrative
  trending.ts                  buildTrending()        -> trending players across engines
  ai-coach.ts                  buildCoachRecommendations() -> explainable plays
  index.ts                     Barrel exports
  __tests__/derivations.test.ts  Null-safety + happy-path coverage

features/tournaments/command-center/
  tournament-command-center.tsx  Server view: fetches data, composes widgets
  command-center-header.tsx      Sticky header (status, meta, action toolbar)
  command-center-widget.tsx      Client collapsible shell (persists collapse state)
  command-center-search.tsx      ⌘K global search (cmdk) over field + quick actions
  quick-actions.tsx              Compare / Rankings / Copy link actions
  personalization-widget.tsx     "Your Players" from localStorage favorites/tracking
  morning-brief.tsx              Morning Brief widget
  tournament-story.tsx           Tournament Story widget
  trending-players.tsx           Trending Players widget
  ai-coach-widget.tsx            AI Caddie widget
```

## Data flow

1. `app/(app)/tournaments/[tournamentId]/page.tsx` resolves the tournament and
   renders `TournamentCommandCenter`.
2. The server view fetches all engine data in parallel (mirrors the previous
   detail view's `Promise.all`).
3. Raw engine output is passed to the pure derivation functions in
   `lib/command-center/` to build the four summaries.
4. Existing intelligence components (DFS, odds, weather, skill, fit, timeline)
   are rendered server-side and passed as `children` into
   `CommandCenterWidget` collapsible shells.

## Widget collapse state

`CommandCenterWidget` is a client component. Each widget persists its
open/closed state to `localStorage` under a per-widget key so a user's layout
preferences survive reloads. Collapse state is keyed by widget id, not by
tournament, so preferences are consistent across events.

## Personalization

`personalization-widget.tsx` reads the same `localStorage` keys used by the
player Decision Workspace:

- `player-favorites` — array of favorited player ids
- `player-tracking` — array of tracked player ids

It cross-references those ids against the current tournament field and surfaces
only the players who are actually playing this week.

## Adding a new widget

1. If it needs derived data, add a pure function to `lib/command-center/` and
   export it from `index.ts`. Keep it null-safe and add a test.
2. Build a presentational component in `features/tournaments/command-center/`.
3. Wrap it in `CommandCenterWidget` inside `tournament-command-center.tsx` with a
   unique widget id.

## Guarantees

- **No fabrication** — widgets only project verified engine output.
- **Null-safe** — every derivation handles empty/unavailable engines and is
  covered by `__tests__/derivations.test.ts`.
- **Composition over duplication** — existing intelligence components are reused,
  not reimplemented.
