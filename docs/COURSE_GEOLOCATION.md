# Course Geolocation Engine

> Give every golf course a **verified** latitude/longitude — the spatial
> foundation that Weather Intelligence, maps, and travel/rest analysis build on.
> Honesty over coverage: a coordinate is stored only when a real golf-course
> feature is positively identified, never approximated.

Status: **shipped** (Sprint 3.9). Default provider: OpenStreetMap Nominatim
(zero-config, no API key).

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
three coordinate confidence levels on the `courses` table:

| `coordinateConfidence` | Meaning | Consumed downstream? |
| --- | --- | --- |
| `VERIFIED` | A real, mapped golf-course feature was positively identified. | **Yes.** |
| `ESTIMATED` | Reserved for a future heuristic path. **Never written automatically this sprint.** | No. |
| `UNKNOWN` | Not yet located (the default). | No. |

Only `VERIFIED` coordinates are ever read by Weather or any other spatial
feature. A course we could not confidently locate stays `UNKNOWN` and its
lat/lng remain `NULL` — the product then honestly shows "awaiting course
coordinates" instead of a guessed position.

**What "verified" means concretely (this sprint):** the geocoder must return an
actual golf-course feature — OpenStreetMap `leisure=golf_course` (or `golf`) —
for the course's name + locality. A clubhouse POI tagged `restaurant`, a town
centroid, or an unrelated result is **rejected**, not stored.

---

## 3. Architecture

```
courses (name, city, state, country)
        │
        ▼
CourseGeolocationService.locateCourse()        lib/imports/course-geolocation.ts
        │  builds a structured query
        ▼
GeocodingProvider.geocodeCourse(query)         lib/providers/geocoding/provider.ts  (interface)
        │  (default: OSM Nominatim)             lib/providers/geocoding/nominatim.ts
        │  → GeocodeMatch | null
        ▼
CourseRepository.setVerifiedCoordinates()      lib/repositories/course-repository.ts
        │  atomic, never overwrites VERIFIED
        ▼
courses.latitude / longitude / coordinateConfidence=VERIFIED
        │
        ▼
WeatherRepository.findWeatherVenueById()  ← surfaces coords ONLY when VERIFIED
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
- `GeocodeMatch` — `{ latitude, longitude, confidence: "verified", source, displayName, matchType }`, or `null` when nothing verifiable was found.

Selection is env-driven (`GEOCODING_PROVIDER`) and defaults to Nominatim. Adding
Google Places or Mapbox is a one-line `case` in the factory plus a class that
implements the interface — **no caller changes**.

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

### 3.3 The service + importer (`lib/imports/course-geolocation.ts`)

- `CourseGeolocationService.locateCourse(course)` — geocode one course and, on a
  verified match, persist it.
- `importCourseCoordinates({ limit })` / `runCourseGeolocation(limit)` — the
  batch runner. **Incremental and idempotent:** it processes only courses whose
  confidence is not already `VERIFIED`, so re-running works through the remaining
  backlog and never re-fetches or overwrites a verified course. `limit` bounds a
  single run (useful under the provider's rate policy). Returns a
  `GeolocationSummary` (`verified`, `skippedNotFound`, `failed`, `notes[]`).

### 3.4 The repository boundary (`course-repository.ts`)

- `findCoursesNeedingCoordinates(limit?)` — the work queue: live courses whose
  confidence is not `VERIFIED`.
- `setVerifiedCoordinates(courseId, coords)` — the guarded writer. It is a
  conditional `updateMany` filtered on `coordinateConfidence != VERIFIED`, so a
  previously verified coordinate is **never overwritten, even under a race**;
  returns `updated` when it wrote and `skipped` when it was a benign no-op.
- `toUpsertPlan()` (used by the course importer) deliberately writes **no**
  coordinate columns, so re-importing the SportsDataIO catalog can never clobber
  verified coordinates.

---

## 4. Where it runs in the pipeline

Run order (each step is idempotent):

1. `runCourseImport` — populate the course catalog.
2. **`runCourseGeolocation`** — verify coordinates for courses still `UNKNOWN`.
3. `runCourseLinking` — link tournaments to their host course.
4. `runWeatherImport` — fetch forecasts, **only** for tournaments whose host
   course is `VERIFIED`.

Because weather reads coordinates exclusively through
`WeatherRepository.findWeatherVenueById()` — which surfaces lat/lng only when
`coordinateConfidence = 'VERIFIED'` — an unverified course automatically yields
the Weather Intelligence `course-missing-coordinates` gap, and the Tournament
Page shows the friendly **"Awaiting course coordinates"** state.

---

## 5. Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `GEOCODING_PROVIDER` | `osm-nominatim` | Selects the provider. Unknown values fall back to the default (a typo never takes geolocation offline). |
| `NOMINATIM_BASE_URL` | public endpoint | Override to a self-hosted Nominatim. |
| `NOMINATIM_USER_AGENT` | CaddieIQ identifier | Required by Nominatim's policy. |
| `NOMINATIM_MIN_INTERVAL_MS` | `1000` | Request spacing to respect the usage policy. |

No API key is required for the default provider, so the engine works out of the
box in every environment.

---

## 6. Testing

`lib/imports/__tests__/course-geolocation.test.ts` covers, with **no network**:

- The pure honesty gate: `leisure=golf_course` verifies (via `category`,
  `class`, or `addresstype`); a `restaurant` clubhouse, a locality centroid, an
  out-of-range coordinate, and an empty result set all yield `null`.
- Query building and normalization (abbreviation expansion, parenthetical
  stripping, variant ordering + de-duplication).
- The service against a fake provider + fake repository: verified match →
  persisted; no match → left `UNKNOWN`; already-verified → skipped (never
  overwritten); provider error → counted as failed, not fatal.

---

## 7. Design decisions

- **Honesty over coverage.** A strict `leisure=golf_course` gate means fewer
  courses fill in, but every stored coordinate is genuinely the course. Coverage
  is improved only by better *queries* (normalization), never by relaxing the
  gate.
- **Provenance is first-class.** `coordinateConfidence` — not the mere presence
  of lat/lng — is the source of truth for trust. `coordinateSource` and
  `coordinatesVerifiedAt` record who verified and when.
- **Provider-swappable.** The vendor lives behind an interface + factory; the
  engine, service, and repository never name a concrete provider.
- **`ESTIMATED` is reserved, not used.** The enum leaves room for a future
  heuristic path, but nothing writes it automatically today — so "estimated"
  can never silently leak into a verified-only consumer.

---

## 8. Related docs

- [WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md) — the first consumer of verified coordinates.
- [DATA_CATALOG.md](./DATA_CATALOG.md) — feed inventory (why coordinates must be derived).
- [MODELS.md](./MODELS.md) §2.5 — the Wind/Weather model this unblocks.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — the layering these engines share.
