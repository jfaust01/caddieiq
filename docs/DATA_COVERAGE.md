# Data Coverage Dashboard

An internal, admin-only diagnostics page that answers a single question:
**what data does the platform actually have, and how much of it is verified?**

It lives at `/admin/data-coverage`, is intentionally **absent from navigation**,
and is gated to `ADMIN` users (non-admins get a `404`, not a `403`, so the
route's existence is never disclosed).

The dashboard's guiding principle is the same as the rest of CaddieIQ:
[honesty over coverage](./PRODUCT.md). Provider-restricted feeds (the trial-tier
betting and fantasy data) are labelled **Provider Restricted** and scored `N/A`
rather than being counted as coverage. A coverage percentage is never inflated
by data we cannot actually trust.

---

## What it shows

The page is composed of three bands:

1. **Summary grid** — one `StatCard` per domain with a headline coverage
   percentage (or `N/A` for restricted feeds) and a verified/total sub-count.
2. **Coverage by domain** — a card per domain breaking the population into
   **verified / pending / missing**, a coverage bar, a rating badge, and the
   domain-specific caveats (e.g. "clubhouse POIs are rejected",
   "world rankings are scramble-prone on the trial tier").
3. **Provider & import health** — external dependency connection state
   (SportsDataIO, OpenWeather, the odds provider, OpenAI, the database) and the
   last successful import timestamp per domain.

All counts are read **live from the database on every request**
(`export const dynamic = 'force-dynamic'`); nothing is cached or precomputed.

---

## Domains

| Domain | Verified means | Notes |
| --- | --- | --- |
| **Course Geolocation** | `coordinateConfidence = VERIFIED` | Mirrors the [Course Geolocation Engine](./COURSE_GEOLOCATION.md). Clubhouse POIs and locality centroids are rejected, never counted. |
| **Course Intelligence** | course profile with a healthy share of the 21 analytic attributes populated | Depth of the course-fit profile. |
| **Weather** | tournaments with a snapshot fetched against a VERIFIED venue coordinate | Depends on Course Geolocation; see [Weather Intelligence](./WEATHER_INTELLIGENCE.md). |
| **Player Data** | players imported | Surfaces the world-ranking scramble caveat (trial tier). |
| **Rankings** | players carrying a world ranking | Scramble-prone on the trial tier — treated as indicative, not authoritative. |
| **Tournaments** | tournaments imported | |
| **News** | articles resolving to a player via the provider's numeric id | Unlinked/general articles are reported separately. |
| **Images** | player headshots present | |
| **Fantasy** | DFS salaries for slated events (real) | Projection points are scrambled on the trial tier → **Provider Restricted**. |
| **Betting** | — | Odds markets are scrambled/404 on the trial tier → **Provider Restricted**. Awaiting a production provider. |

---

## Architecture

```
app/(app)/admin/data-coverage/page.tsx   ADMIN-gated route (force-dynamic)
  └─ features/admin/data-coverage/
       data-coverage-view.tsx            server component, composes the page
       summary-grid.tsx                  StatCard summary band
       coverage-section-card.tsx         per-domain breakdown card
       health-panel.tsx                  provider health + last-import band
       indicators.tsx                    coverage bar, rating badge, health dot
       copy-report-button.tsx            'use client' — copy report as JSON
  └─ lib/data-coverage/
       service.ts    import "server-only" — aggregates all counts (parallel)
       ratings.ts    pure rating logic (rating from %, labels, N/A handling)
       types.ts      DataCoverageReport / section / summary / health shapes
       index.ts      client-safe barrel (types + ratings only, NOT service)
```

### Service (`lib/data-coverage/service.ts`)

- Marked `import "server-only"` so it can never leak into a client bundle.
- Runs every count/aggregate **in parallel** (`Promise.all`) and reads directly
  from the shared `prisma` client — no per-request client construction.
- Encodes the honesty rules in one place: which feeds are real vs. restricted,
  and which carry caveats. The UI is purely presentational.

### Ratings (`lib/data-coverage/ratings.ts`)

Pure, fully unit-tested (`__tests__/ratings.test.ts`). Maps a coverage ratio to
a rating (`excellent | good | needs-attention | restricted`) and label, and
treats `Provider Restricted` domains as `N/A` rather than `0%` so a blocked feed
is never confused with an empty one.

---

## Access control

Two layers of defence:

1. **Edge (`proxy.ts`)** — `/admin/*` is added to the protected prefixes and the
   middleware matcher, so an unauthenticated request is redirected to `/login`
   before the route runs.
2. **Route** — the page re-checks the session and loads the user's `role`;
   anyone who is not `ADMIN` gets `notFound()`.

The route is deliberately **not** added to `constants/navigation.ts`, so it does
not appear in the sidebar for anyone.

---

## Extending it

To add a domain:

1. Add its counts to `getDataCoverageReport` in `service.ts` (respecting the
   honesty rules — if a feed is trial-restricted, mark it restricted, do not
   score it).
2. Add a `DataCoverageSection` (and optionally a `DataCoverageSummary` entry)
   to the returned report — the view renders them generically.
3. If it introduces a new caveat, put the copy in the section's `notes` so it
   renders inside the domain card.

No UI changes are required for a new domain; the view maps over the report.
