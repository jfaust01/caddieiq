# Course Intelligence Engine — CaddieIQ

**Status:** Living document · **Owner:** Product / Chief Product Architect · **Last updated:** v0.1.0

---

## 0. Purpose of this document

The Course Intelligence Engine turns the raw, verified facts CaddieIQ stores
about a golf course into a single, consistently-shaped **Course Profile** that
the product surfaces today and that downstream models (Course Fit, DFS Value,
Betting, Wind, AI Coach) will consume tomorrow. This document defines what the
profile means, what it is allowed to claim, and exactly how each attribute is
derived. It is both a design document and the normalization contract the data
importer must satisfy.

The engine inherits the two governing principles from the [Model
Specification](./MODELS.md):

1. **Honesty over coverage.** Every attribute is either `verified` — derived
   solely from real source data — or `unknown`. A missing, null, or non-finite
   source value yields an explicit `unknown`; the engine never defaults,
   interpolates, or fabricates a value to fill a gap. The UI shows "Not yet
   available", and a coverage counter (`verified / total`) states exactly how
   complete the profile is.
2. **One consistent representation.** Every rated attribute is normalized onto
   the same qualitative band — **Low / Medium / High** — from explicit,
   documented thresholds, so a course, a tournament's host venue, and a future
   model all read the same profile the same way.

---

## 1. Where it sits in the architecture

The engine is a **pure derivation layer**. It reads verified source data and
computes a profile in memory; it owns no table and writes nothing. This mirrors
the Analytics Layer rule in [ARCHITECTURE.md](./ARCHITECTURE.md): derived
metrics are computed downstream and never overwrite source data.

```
Course (core columns)  ─┐
                        ├─►  buildCourseProfile()  ─►  CourseProfile
CourseCharacteristic  ──┘        (pure, no I/O)         (verified | unknown)
```

- **Source of truth:** the `Course` core record (par, yardage, altitude) plus
  the optional `CourseCharacteristic` analytics record. See
  [DATABASE.md](./DATABASE.md) for the columns.
- **Engine:** `lib/domain/course/profile.ts` — `buildCourseProfile()` is a pure,
  deterministic function. Types live in `lib/domain/course/profile-types.ts`.
- **Persistence bridge:** `features/courses/services/course-intelligence.ts`
  maps the database records into the engine's persistence-agnostic input.
- **Reads:** `CourseRepository.findProfileInputsById()` loads the verified
  inputs; `courseService.getCourseById()` (Course Page) and
  `courseService.getCourseIntelligence()` (Tournament hub) expose the profile.
- **UI:** `features/courses/components/course-intelligence-panel.tsx` renders the
  profile. The same panel is reused verbatim on the Course Page and, via
  `TournamentCourseIntelligence`, on the Tournament Page — so the two views can
  never disagree.

Because the engine imports nothing from Prisma or a provider, it is trivially
unit-testable (`lib/domain/course/__tests__/profile.test.ts`) and safe to send
from a Server Component to the client.

---

## 2. The Course Profile

A profile is `{ courseId, characteristics[], coverage }`. Every modeled
characteristic is always present in `characteristics` (in display order);
unresolved ones are `unknown` rather than omitted, so the shape is stable no
matter how much data exists. `coverage` is `{ verified, total }`.

Each characteristic pairs static **metadata** (label, group, kind,
interpretation, description) with a **signal**. A signal is one of:

| Kind       | Verified shape                              | Example display |
| ---------- | ------------------------------------------- | --------------- |
| `category` | canonical token + human label               | "Parkland"      |
| `measure`  | raw magnitude + formatted string with unit  | "7,435 yds"     |
| `rating`   | normalized `low / medium / high` band + raw | "High"          |
| —          | `{ status: "unknown" }`                     | "Not yet available" |

Characteristics are organized into five groups for scanning: **Identity**,
**Surfaces**, **Setup & conditions**, **Skill demands**, and **Scoring
profile**.

---

## 3. Attribute catalog & derivation

`measure` and `category` attributes are copied directly from the verified
source (formatted, never altered). `rating` attributes are normalized onto the
Low / Medium / High band using the thresholds in §4.

| Group | Attribute | Kind | Source | Notes |
| ----- | --------- | ---- | ------ | ----- |
| Identity | Course type | category | `CourseCharacteristic.style` | Links / Parkland / Desert / Heathland / Mountain / Other |
| Identity | Par | measure | `Course.par` | "Par N" |
| Identity | Course length | measure | `Course.yardage` | Championship-tee yardage |
| Identity | Elevation | measure | `Course.altitudeFt` | Altitude (affects carry); distinct from elevation *change* |
| Surfaces | Fairway grass | category | `CourseCharacteristic.fairwayGrass` | Bent / Bermuda / Poa / Rye / Zoysia / Fescue / Other |
| Surfaces | Rough grass | category | `CourseCharacteristic.roughGrass` | — |
| Surfaces | Green surface | category | `CourseCharacteristic.greenGrass` | — |
| Setup | Green speed | rating | `greenSpeed` (Stimpmeter ft) | Higher = faster |
| Setup | Fairway width | rating | `fairwayWidth` (yards) | Higher = wider / more forgiving |
| Setup | Rough severity | rating | `roughLength` (inches) | Higher = more penal |
| Setup | Tree coverage | rating | `treeLined` (boolean) | false → Low, true → High (see §4.1) |
| Setup | Water difficulty | rating | `waterHazards` (count) | Higher = more water in play |
| Setup | Wind exposure | rating | `windExposure` (0–1) | Higher = more exposed |
| Setup | Elevation change | rating | `elevationChange` (ft) | Higher = hillier routing |
| Demands | Driving importance | rating | `drivingImportance` (0–1) | Higher = driving matters more |
| Demands | Approach importance | rating | `approachImportance` (0–1) | Higher = approach matters more |
| Demands | Around-the-green importance | rating | `shortGameImportance` (0–1) | Higher = short game matters more |
| Demands | Putting importance | rating | `puttingImportance` (0–1) | Higher = putting matters more |
| Demands | Scrambling difficulty | rating | `scramblingDifficulty` (0–1) | Higher = harder to get up and down |
| Scoring | Scoring environment | category | `birdieRate` + `bogeyRate` | Derived (see §4.2) |
| Scoring | Scoring variance | rating | `varianceRating` (0–1) | Higher = more volatile scoring |

---

## 4. Normalization contract

Ratings are classified into tertiles: a value below `lowMax` bands **Low**, a
value at or above `highMin` bands **High**, and everything between bands
**Medium**. These thresholds are the contract the importer must populate the
source columns against; they live in `RATING_SCALES` in `profile.ts`. Changing a
threshold is a deliberate, documented calibration.

| Attribute | Source scale | `lowMax` | `highMin` |
| --------- | ------------ | -------- | --------- |
| Green speed | Stimpmeter feet (tour greens ~10–13) | 10 | 12 |
| Fairway width | Yards | 28 | 38 |
| Rough severity | Inches | 2.5 | 4 |
| Water difficulty | Discrete hazard count | 3 | 6 |
| Wind exposure | Normalized 0–1 | 0.34 | 0.67 |
| Elevation change | Feet of total vertical | 30 | 80 |
| Driving / Approach / Short-game / Putting importance | Normalized 0–1 | 0.34 | 0.67 |
| Scrambling difficulty | Normalized 0–1 | 0.34 | 0.67 |
| Scoring variance | Normalized 0–1 | 0.34 | 0.67 |

### 4.1 Tree coverage (boolean → band)

`treeLined` is a boolean, so it maps to a coarse but faithful band: `false` →
**Low**, `true` → **High**. `Medium` is unreachable from a boolean by design;
`raw` mirrors the flag (0/1). When richer tree-density data arrives, this can be
upgraded to a numeric scale without changing the profile shape.

### 4.2 Scoring environment (derived category)

Derived from the verified birdie/bogey rates (0–1 fractions). Requires at least
one of the two; returns `unknown` otherwise.

- **Major championship** — `bogeyRate ≥ 0.22` (penal, major-style setup).
- **Birdie fest** — `birdieRate ≥ 0.20` with a contained bogey rate
  (`bogeyRate ≤ 0.16` or absent).
- **Neutral** — anything else with data.

---

## 5. Coverage & honesty guarantees

- `coverage.verified` counts characteristics with a verified signal;
  `coverage.total` is the number the engine models (currently 21). The Course
  Page and Tournament hub both surface this as a `verified / total` badge.
- When `coverage.verified === 0` the panel shows an explicit note that the
  engine is live but no characteristics have been imported — every attribute
  reads "Not yet available", and each fills in automatically as data arrives.
- Nothing is ever estimated. A course with a null `par` shows par as pending
  even when its `CourseCharacteristic` record is otherwise complete.

---

## 6. Consuming the profile downstream

Future models should read the `CourseProfile` rather than the raw columns, so
they inherit the same honesty and normalization for free. Helpers in
`profile.ts`:

- `getCharacteristic(profile, key)` — one characteristic by key.
- `pickCharacteristics(profile, keys)` — an ordered subset.
- `hasVerifiedIntelligence(profile)` — whether anything is verified.

A model must treat an `unknown` signal as "no signal" and let its own confidence
reflect the gap — never substitute a default. This is how the engine keeps the
platform's course claims grounded in data it actually holds.

---

## 7. Extending the engine

1. Add the source column to `CourseCharacteristic` (see [DATABASE.md](./DATABASE.md)).
2. Add the field to `CourseCharacteristicInput` in `profile-types.ts` and the
   key to `CourseCharacteristicKey`.
3. Add a `CourseCharacteristicMeta` entry to `COURSE_CHARACTERISTICS` (label,
   group, kind, interpretation, description) in the desired display position.
4. Handle the new key in `signalFor()` — the `switch` is exhaustive, so a
   missing case is a compile error.
5. For a rating, add its scale to `RATING_SCALES` and document it in §4.
6. Add coverage to `profile.test.ts`. The UI needs no change — it renders
   whatever the engine emits, grouped by metadata.
