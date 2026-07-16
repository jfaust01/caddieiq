# Course Geolocation Engine

> Give every golf course the best latitude/longitude we can honestly stand
> behind — the spatial foundation that Weather Intelligence, maps, and
> travel/rest analysis build on. **Two tiers, never fabricated:** a
> course-precise `VERIFIED` match when a real golf-course feature is positively
> identified, else a clearly-labeled `APPROXIMATE` city-level fallback that
> unlocks regional weather, else nothing.

Status: **shipped** (Sprint 3.9; two-tier fallback added Sprint 3.9.1). Default
provider: a **composite** — OpenStreetMap Nominatim for course-precise matches,
with the OpenWeather Geocoding API as a city-level fallback.

---

## 1. Why this engine exists

The SportsDataIO course feed carries **no coordinates** (see
[DATA_CATALOG.md](./DATA_CATALOG.md)). Yet coordinates are the prerequisite for
an entire class of event context — most immediately the
[Weather Intelligence Engine](./WEATHER_INTELLIGENCE.md), which cannot locate a
forecast without them, and later maps and travel/rest models.

Rather than hard-code a lat/lng table (which rots and cannot be trusted), the
Course Geolocation Engine **derives** coordinates from a geocoding provider and
records their provenance, so every downstream consumer can tell a genuinely
located course from an un-located one.

---

## 2. The honesty contract

The engine follows the platform's core rule — **never fabricate** — expressed as
coordinate confidence levels on the `courses` table, in descending precision:

| `coordinateConfidence` | Meaning | Consumed by Weather? | Consumed by Maps? |
| --- | --- | --- | --- |
| `VERIFIED` | A real, mapped golf-course feature was positively identified (course-precise). | **Yes** | **Yes** |
| `APPROXIMATE` | A city/locality centroid used as a fallback. Accurate to the town, **not** the course. | **Yes** | No |
| `ESTIMATED` | Reserved for a future heuristic path. **Never written automatically.** | No | No |
| `UNKNOWN` | Not yet located (the default). | No | No |

**Why two consuming tiers.** A weather forecast is inherently regional — a
city-centroid is materially as good as the course pin for a wind/rain outlook —
so Weather accepts `APPROXIMATE`. Course-precise features (maps, on-course
spatial analysis) accept **only** `VERIFIED`. Crucially, an `APPROXIMATE`
coordinate is always surfaced to the user as "city-level", never dressed up as a
verified course pin.

A course we could not honestly place at either tier stays `UNKNOWN` with `NULL`
lat/lng, and the product shows "awaiting course coordinates" rather than a guess.

**What "verified" means concretely:** the primary geocoder must return an actual
golf-course feature — OpenStreetMap `leisure=golf_course` (or `golf`) — for the
course's name + locality. A clubhouse POI tagged `restaurant`, a town centroid,
or an unrelated result is **rejected** by the primary (it may still qualify as an
`APPROXIMATE` city match via the fallback, but never as `VERIFIED`).

**What "approximate" means concretely:** only when the primary finds no
course-precise match, the OpenWeather fallback resolves the course's **city** to
a locality centroid — and only when there is a disambiguating anchor (a
resolvable country **or** a US state code). A bare, unanchored city is refused,
because OpenWeather will otherwise silently resolve e.g. "Ayrshire" (Scotland) to
a same-named US place. We would rather leave a course `UNKNOWN` than store a
confident-looking coordinate on the wrong continent.

---

## 3. Architecture

```
courses (name, city, state, country)
        │
        ▼
CourseGeolocationService.locateCourse()        lib/imports/course-geolocation.ts
        │  builds a structured query
        ▼
CompositeGeocodingProvider.geocodeCourse()     lib/providers/geocoding/composite.ts
        │   1. primary  → Nominatim   (verified golf-course feature)
        │   2. fallback → OpenWeather (estimated city centroid)
        │   → GeocodeMatch{confidence} | null
        ├────────────── confidence = "verified" ──────────────┐
        │                                                      ▼
        │                          CourseRepository.setVerifiedCoordinates()
        │                          atomic; never overwrites VERIFIED
        └────────────── confidence = "estimated" ─────────────┐
                                                               ▼
                                   CourseRepository.setApproximateCoordinates()
                                   atomic; NOT IN (VERIFIED, APPROXIMATE) guard
        ▼
courses.latitude / longitude / coordinateConfidence ∈ {VERIFIED, APPROXIMATE}
        │
        ▼
WeatherRepository.findWeatherVenueById()  ← surfaces coords when VERIFIED or
                                             APPROXIMATE (VERIFIED preferred)
```

The layering mirrors the other engines: a **swappable provider** behind an
interface, a **pure match-selection rule** for the honesty gate, a
**server-only service**, and a **transactional repository** boundary.

### 3.1 The provider abstraction (`lib/providers/geocoding`)

Consumers depend on the `GeocodingProvider` **interface** and the
`createGeocodingProvider()` factory — never a concrete class:

```ts
interface GeocodingProvider {
  readonly name: string
  geocodeCourse(query: GeocodeQuery): Promise<GeocodeMatch | null>
}
```

- `GeocodeQuery` — structured `{ courseName, city, stateProvince, country }`.
- `GeocodeMatch` — `{ latitude, longitude, confidence: "verified" | "estimated", source, displayName, matchType }`, or `null` when nothing was found.

Selection is env-driven (`GEOCODING_PROVIDER`) and defaults to the **composite**.
Adding Google Places or Mapbox is a one-line `case` in the factory plus a class
that implements the interface — **no caller changes**.

### 3.1a The composite provider (`composite.ts`)

`CompositeGeocodingProvider` is the default. It composes a course-precise
**primary** (Nominatim) with a city-level **fallback** (OpenWeather):

1. Ask the primary. A `verified` course match always wins and short-circuits.
2. Only if the primary returns nothing, ask the fallback for a city centroid
   (`estimated`).
3. If neither locates the course, return `null` (a clean "not found").

**Resilience without dishonesty.** A primary *infrastructure* failure (network,
rate limit) does not abort the attempt — the fallback is still tried so weather
stays unblocked. But a primary failure is never silently downgraded to "not
found": if the fallback also yields nothing, the original primary error is
surfaced, so the course is reported `failed` and retried later rather than being
mislabeled as genuinely unmatched. The fallback is optional; when
`OPENWEATHER_API_KEY` is unset the composite degrades to primary-only.

### 3.2 The Nominatim provider (`nominatim.ts`)

- Honors Nominatim's usage policy: an identifying `User-Agent` and a minimum
  request interval (~1 req/s), both configurable.
- Timeout-guarded, retrying (exponential backoff), and rate-limit aware, reusing
  the shared provider error taxonomy (`lib/providers/shared/errors`).
- **The honesty gate is a pure function**, `selectVerifiedGolfMatch()` /
  `isGolfCourseFeature()`, so it is fully unit-tested without any network. It
  reads the feature category from `category` (jsonv2), `class` (legacy json), or
  `addresstype`, and accepts only `leisure=golf_course` / `golf`.
- **Query normalization** (`normalizeCourseName`, `buildNominatimQueryVariants`)
  improves coverage *without* weakening the gate: it strips a trailing
  parenthetical sub-course qualifier (`"Torrey Pines (North)"` → `"Torrey
  Pines"`) and expands abbreviations (`"GC"` → `"Golf Course"`, `"CC"` →
  `"Country Club"`). The raw name is tried first, then the normalized fallback;
  only the *search string* changes, never the verified-match rule.

### 3.2a The OpenWeather fallback (`openweather.ts`)

- Calls OpenWeather's Geocoding API (`/geo/1.0/direct`), a **city** geocoder —
  it has no golf-course POIs, so it is used strictly as the city-level fallback,
  never as the course-precise tier.
- **The query builder is a pure, tested guard** (`buildOpenWeatherQuery`): it
  emits `city[,US-state][,ISO2]` and returns `null` unless there is a city **and**
  a disambiguating anchor (a country resolvable to ISO-2, or a valid US state
  code — which implies the US even when the country field is blank). This is what
  prevents wrong-country matches on ambiguous city names.
- **Country-code translation** (`country-codes.ts`): the SportsDataIO feed stores
  IOC/sports-style codes (`USA`, `ENG`, `SCO`, `GER`, `RSA`, `MAS`…), which
  OpenWeather does not understand. `toIso2CountryCode()` maps them to ISO-2
  (`US`, `GB`, `DE`, `ZA`, `MY`…) and returns `null` for anything it cannot map
  with confidence — never a guess. The UK home nations all fold to `GB`.
- **The selection rule is pure** (`selectCityMatch`): first in-range result
  becomes an `estimated` city match; out-of-range/non-finite coordinates and an
  empty result set yield `null`. Timeout-guarded, retrying, and rate-limit aware
  via the shared provider error taxonomy.

### 3.3 The service + importer (`lib/imports/course-geolocation.ts`)

- `CourseGeolocationService.locateCourse(course)` — geocode one course and route
  the match by confidence: `verified` → `setVerifiedCoordinates`, `estimated` →
  `setApproximateCoordinates`. It honours whatever tier the provider reports and
  never promotes an estimated match to verified.
- `importCourseCoordinates({ limit, includeApproximate })` /
  `runCourseGeolocation(limit, { includeApproximate })` — the batch runner.
  **Incremental and idempotent:** by default it processes only courses with no
  usable coordinate yet (`UNKNOWN`/`ESTIMATED`), so re-running works the backlog
  and never re-fetches a resolved course. Pass `includeApproximate: true` to also
  re-attempt `APPROXIMATE` courses and try to **upgrade** them to a course-precise
  `VERIFIED` match. Returns a `GeolocationSummary` (`verified`, `approximate`,
  `skippedNotFound`, `failed`, `notes[]`).

### 3.4 The repository boundary (`course-repository.ts`)

- `findCoursesNeedingCoordinates(limit?, { includeApproximate })` — the work
  queue. Default excludes both `VERIFIED` and `APPROXIMATE` (only truly
  un-located courses); upgrade mode excludes only `VERIFIED` so city-level rows
  can be retried for a course-precise match.
- `setVerifiedCoordinates(courseId, coords)` — the course-precise writer. A
  conditional `updateMany` filtered on `coordinateConfidence != VERIFIED`, so it
  can **upgrade** an `APPROXIMATE` row to `VERIFIED` but never overwrites an
  existing `VERIFIED` one, even under a race.
- `setApproximateCoordinates(courseId, coords)` — the city-level writer. Filtered
  on `coordinateConfidence NOT IN (VERIFIED, APPROXIMATE)`, encoding two
  guarantees at once: **never downgrade** a verified coordinate to a centroid, and
  **idempotent** (an already-approximate row is left untouched). Returns `updated`
  when it wrote, `skipped` on a benign no-op.
- `toUpsertPlan()` (used by the course importer) deliberately writes **no**
  coordinate columns, so re-importing the SportsDataIO catalog can never clobber
  located coordinates.

---

## 4. Where it runs in the pipeline

Run order (each step is idempotent):

1. `runCourseImport` — populate the course catalog.
2. **`runCourseGeolocation`** — verify coordinates for courses still `UNKNOWN`.
3. `runCourseLinking` — link tournaments to their host course.
4. `runWeatherImport` — fetch forecasts for tournaments whose host course has a
   usable coordinate (`VERIFIED` **or** `APPROXIMATE`).

Weather reads coordinates through `WeatherRepository.findWeatherVenueById()`,
which surfaces lat/lng when `coordinateConfidence IN ('VERIFIED','APPROXIMATE')`
and reports which tier it used (VERIFIED preferred in its ordering). A course at
neither tier automatically yields the Weather Intelligence
`course-missing-coordinates` gap, and the Tournament Page shows the friendly
**"Awaiting course coordinates"** state.

---

## 5. Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `GEOCODING_PROVIDER` | `composite` | Selects the provider: `composite` (default), `nominatim` (course-precise only), or `openweather` (city-level only). Unknown values fall back to the default (a typo never takes geolocation offline). |
| `NOMINATIM_BASE_URL` | public endpoint | Override to a self-hosted Nominatim. |
| `NOMINATIM_USER_AGENT` | CaddieIQ identifier | Required by Nominatim's policy. |
| `NOMINATIM_MIN_INTERVAL_MS` | `1000` | Request spacing to respect the usage policy. |
| `OPENWEATHER_API_KEY` | — | Enables the city-level fallback. **Optional:** when unset, the composite degrades to Nominatim-only (courses still get `VERIFIED` matches, just no `APPROXIMATE` fallback). Shared with the Weather engine. |

No key is required for the course-precise tier, so the engine works out of the
box; providing `OPENWEATHER_API_KEY` additionally unlocks the city-level
fallback.

---

## 6. Testing

All with **no network**:

- `lib/imports/__tests__/course-geolocation.test.ts` — the Nominatim honesty
  gate (`leisure=golf_course` verifies; a `restaurant` clubhouse, a locality
  centroid, an out-of-range coordinate, and an empty set yield `null`), query
  normalization, and the service against fakes.
- `lib/providers/geocoding/__tests__/country-codes.test.ts` — IOC/sports →
  ISO-2 mapping, UK home nations → `GB`, and `null` for unmappable input.
- `lib/providers/geocoding/__tests__/openweather.test.ts` — the anchor guard
  (bare/unanchored city → `null`; US-state-implies-US), and the city selection
  rule (skips out-of-range; `confidence` is always `estimated`, never
  `verified`).
- `lib/providers/geocoding/__tests__/composite.test.ts` — routing: verified wins
  and skips the fallback; fallback used only on a primary miss; both empty →
  `null`; primary throws but fallback succeeds → returned; primary throws and
  fallback empty → the primary error is surfaced (not a false "not found").

---

## 7. Design decisions

- **Two honest tiers beat one dishonest number.** Rather than relax the
  `leisure=golf_course` gate to raise coverage (which would let town centroids
  masquerade as course pins), we keep the strict gate for `VERIFIED` and add a
  **separately-labeled** `APPROXIMATE` tier. Weather — which only needs regional
  accuracy — consumes both; maps consume only `VERIFIED`. The user always sees
  which they got.
- **Refuse rather than guess.** The OpenWeather fallback demands a
  disambiguating anchor (country or US state). An unanchored city is left
  `UNKNOWN`, because a confident coordinate on the wrong continent is worse than
  an honest blank.
- **No downgrades, ever.** `setVerifiedCoordinates` may upgrade an `APPROXIMATE`
  row; `setApproximateCoordinates` will never overwrite a `VERIFIED` one. Both
  guards live in the SQL predicate, so they hold even under concurrent runs.
- **Provenance is first-class.** `coordinateConfidence` — not the mere presence
  of lat/lng — is the source of truth for trust. `coordinateSource`
  (`osm-nominatim` vs `openweather-geocoding`) and `coordinatesVerifiedAt` record
  who located it and when.
- **Provider-swappable.** Every vendor lives behind the `GeocodingProvider`
  interface + factory; the composite itself is just another implementation, so
  the engine, service, and repository never name a concrete provider.

---

## 8. Related docs

- [WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md) — the first consumer of verified coordinates.
- [DATA_CATALOG.md](./DATA_CATALOG.md) — feed inventory (why coordinates must be derived).
- [MODELS.md](./MODELS.md) §2.5 — the Wind/Weather model this unblocks.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — the layering these engines share.
