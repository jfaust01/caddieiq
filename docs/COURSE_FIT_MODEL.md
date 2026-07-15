# Course Fit Model — CaddieIQ

**Status:** Living document · **Owner:** Product / Chief Product Architect · **Last updated:** v0.1.0

---

## 0. Purpose of this document

The Course Fit Model answers one question: **how well does a player's game suit
a specific course?** It matches a player's skill profile against a course's
verified demand profile (from the [Course Intelligence
Engine](./COURSE_INTELLIGENCE.md)) and returns a single, explainable,
confidence-graded fit score plus a per-skill breakdown. This document defines
what the score means, what it is allowed to claim, and exactly how it is
computed. It is both a design document and the contract the UI and future
consumers (DFS Value, Betting) read against.

The model inherits the two governing principles from the [Model
Specification](./MODELS.md):

1. **Honesty over coverage.** A skill signal contributes **only** when *both*
   the course's demand for it and the player's skill in it are verified. Any gap
   is reported as `unavailable` with a machine-readable `reason`
   (`course-demand-missing`, `player-skill-missing`, or `both-missing`); the
   model never defaults, interpolates, or invents a value. When nothing can be
   scored the score is `null` and confidence is `none` — never `0/100`.
2. **Confidence follows coverage.** The score can never look more certain than
   the data supports. Confidence is graded purely from how many of the five
   signals were scored, so a one-signal fit is explicitly `low`, never `high`.

> **Today's honest state.** CaddieIQ ingests no per-skill player data yet (see
> the Analytics contract in [MODELS.md](./MODELS.md)), and course characteristic
> data is still being populated. So the model runs end-to-end but currently
> reports fits as `unavailable` with the correct reasons, and lights up
> automatically as data arrives — no code change required. This was verified in
> the browser: seeding a course's demand flips every reason from `both-missing`
> to `player-skill-missing`, and the model still refuses to fabricate a score.

---

## 1. Where it sits in the architecture

The model is a **pure scoring layer**. It reads two verified inputs and computes
a fit in memory; it owns no table and writes nothing — mirroring the Analytics
Layer rule in [ARCHITECTURE.md](./ARCHITECTURE.md).

```
CourseProfile (verified demand) ─┐
                                 ├─►  computeCourseFit()  ─►  CourseFitResult
PlayerSkillProfile (verified) ───┘        (pure, no I/O)      (score | null + reasons)
```

- **Engine:** `lib/analytics/course-fit/model.ts` — `computeCourseFit()` and
  `buildFieldFitBoard()` are pure, deterministic, total functions. Types live in
  `lib/analytics/course-fit/types.ts`.
- **Inputs:**
  - Course demand: the `CourseProfile` from the Course Intelligence Engine
    (`courseService.getCourseIntelligence(courseId)`).
  - Player skill: a `PlayerSkillProfile` (five 0–100 skills, `null` when
    unknown). Built by `features/players/services/player-course-fit.ts` from
    verified analytics only — the honest all-`null` default today.
- **Player Page:** `features/players/services/player-service.ts` resolves the
  player's next upcoming tournament course (fallback: most recent linked event)
  via `PlayerRepository.findNextCourseFitContextById()`, then attaches
  `courseFit`. Rendered by `features/players/components/course-fit-card.tsx` in
  the Analytics tab.
- **Tournament Page:** `tournamentService.getFieldFitBoard()` scores the whole
  field against the host course and ranks it into the hub lists. Rendered by
  `features/tournaments/components/field-fit-board.tsx`.

---

## 2. The five skill signals

Each signal maps a player skill to the course demand that rewards it. The demand
key is a verified `CourseProfile` characteristic (0–1 importance).

| Signal        | Player skill (0–100) | Course demand key (`CourseProfile`) |
| ------------- | -------------------- | ----------------------------------- |
| `driving`     | Off-the-tee          | `drivingImportance`                 |
| `approach`    | Approach play        | `approachImportance`                |
| `shortGame`   | Short game           | `shortGameImportance`               |
| `putting`     | Putting              | `puttingImportance`                 |
| `scrambling`  | Scrambling           | `aroundGreenDifficulty`             |

A signal is **scored** iff its demand is a verified rating *and* its player skill
is a finite 0–100 value. Otherwise it is **unavailable** with a `reason`.

---

## 3. How the score is computed

Fit is a **demand-weighted average of the player's skills** — a player is
rewarded for being strong exactly where the course asks the most.

1. **Read** each signal's demand `dᵢ` (0–1) and skill `sᵢ` (0–100); keep only
   scored signals `S`.
2. **Weight** each scored signal by its share of total demand:
   $$w_i = \frac{d_i}{\sum_{j \in S} d_j}$$
   If every scored demand is 0 (a verified-but-flat course), fall back to equal
   weights so the result is an honest average rather than `0/0`.
3. **Score** is the weighted sum, on the same 0–100 scale as the skills:
   $$\text{fit} = \sum_{i \in S} w_i \cdot s_i$$
   With no scored signals, `fit = null`.

### Bands

| Band            | Score range |
| --------------- | ----------- |
| `STRONG`        | ≥ 70        |
| `ABOVE_AVERAGE` | 57–69       |
| `AVERAGE`       | 43–56       |
| `BELOW_AVERAGE` | 30–42       |
| `WEAK`          | < 30        |

### Confidence

Graded from the count of scored signals, so it can never outrun coverage:

| Scored signals | Confidence |
| -------------- | ---------- |
| 5              | `high`     |
| 3–4            | `medium`   |
| 1–2            | `low`      |
| 0              | `none` (score `null`) |

---

## 4. Explainability

Every result is self-describing — no consumer has to reverse-engineer a number:

- **`signals[]`** — per skill: `status`, `demand`, `skill`, `weight`,
  `contribution`, and either a `reason` (when unavailable) or a plain-English
  `rationale`.
- **`drivers[]`** — scored signals ranked by weighted deviation from the neutral
  baseline (50), each tagged `positive`/`negative` with an `effect`. These are
  the "why" behind the score.
- **`summary`** — a one-line human read, including how many signals are still
  unavailable and that this caps confidence.
- **`coverage`** — `{ scored, total }`, the fit's answer to "how complete is
  this?"

---

## 5. The tournament field board

`buildFieldFitBoard()` ranks a scored field into four hub lists. Each is honest
about what it can and cannot show:

- **Top Fits / Fades** — players with a computable fit, best / worst first.
  Empty until skill *and* demand data exist — **never padded with guesses**.
- **Trending Up** — players ordered by verified ranking momentum. This is an
  honest form-trajectory read from the analytics engine, and is explicitly **not**
  a course-fit change; it is labelled as such in the UI so the two are never
  conflated.
- **Most Uncertain** — players whose fit is least certain (lowest confidence,
  then fewest scored signals) first, so data gaps are surfaced, not hidden.

The board also carries `scoredPlayers / totalPlayers`, shown as an `X / N scored`
counter so the field-level coverage is always visible.

---

## 6. Guarantees

- **Pure & total.** `computeCourseFit()` never throws and always returns a
  fully-shaped result; missing inputs become `null`/`"none"` + reasons.
- **No fabrication.** No signal contributes without both halves verified; scored
  lists stay empty rather than inventing entries.
- **Deterministic.** Same inputs ⇒ same output; no time, randomness, or I/O.
- **Additive rollout.** As course characteristics and player skill data are
  ingested, signals flip from `unavailable` to `scored` and the product fills in
  on its own — the contract in this document does not change.
