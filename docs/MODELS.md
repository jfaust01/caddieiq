# Model Specification — CaddieIQ

**Status:** Living document · **Owner:** Product / Chief Product Architect · **Last updated:** v0.1.0

---

## 0. Purpose of this document

This is the product specification for CaddieIQ's ranking and rating models. It
defines the **signature Overall Rating** and the roadmap of specialist models
that will surround it. It is a design and reasoning document, not an
implementation guide — no formulas are prescribed as final, and no code is
written from it directly. Its job is to give every future sprint a shared,
explainable definition of *what each model means, what it is allowed to claim,
and how confident it is allowed to sound.*

Two principles govern everything below:

1. **Honesty over coverage.** A model only emits a signal it can ground in data
   the platform actually holds. A missing input yields an explicit "no signal"
   (null / not-rated), never a fabricated number. Confidence is a first-class
   output, and it is capped by the weakest input a score depends on.
2. **Independence over volume.** A rating is only as good as the number of
   *independent* things it measures. Averaging several views of the same
   underlying fact does not make a rating stronger — it makes it overconfident.
   The Overall Rating is designed around independent signal *families*, not a
   long list of correlated metrics.

---

## 1. Overall Rating

### 1.1 Objective

The Overall Rating is CaddieIQ's signature player ranking. It answers one
question: **who is the strongest player right now, for the current season — and
eventually, for the current tournament?**

It is explicitly **not** a clone of the Official World Golf Ranking (OWGR) or
DataGolf. OWGR is a slow, points-decay ledger of accumulated results; DataGolf
is a strokes-gained predictive engine. CaddieIQ's differentiator is
**explainability**: every rating decomposes into named, independently sourced
signals, each with its own confidence, so a user can see *why* a player is rated
where they are — not just that a black box said so.

### 1.2 The problem with today's model

The current Overall Rating is the mean of the available season analytics:
Recent Form, Season Performance, Fantasy Production, Consistency, and Activity.
That is a reasonable v1, but it has a structural flaw the next generation must
fix: **the inputs are highly correlated because they are derived from only two
or three underlying sources.**

| Today's metric | Underlying source(s) |
| --- | --- |
| Recent Form | World ranking standing + week-over-week movement |
| Season Performance | Fantasy points total (60%) + world ranking (40%) |
| Fantasy Production | Fantasy points per event |
| Consistency | Fantasy points gained vs. lost |
| Activity | Events played |

Four of the five metrics are functions of just **world ranking** and **fantasy
points**. Averaging them means the model measures those two dimensions three or
four times each and calls the result five independent opinions. A player who is
high in the world ranking is mechanically lifted by both Recent Form *and*
Season Performance; a high fantasy scorer is lifted by Fantasy Production,
Consistency, *and* Season Performance. The mean is therefore **double-counting**,
and it produces artificially high agreement (and artificially high apparent
confidence) between metrics.

### 1.3 Design: independent signal families

The next-generation Overall Rating is organized around **independent signal
families** — groups of signals that draw on genuinely different sources of
truth. Weight is allocated *across families first*, and only then distributed
*within* a family. Two signals that share a source share a weight budget; they
never each get a full vote.

The complete signal set, grouped by family:

#### Family A — External skill assessment (long-term skill)
Independent, professionally-maintained estimates of a player's baseline ability.

- **Official World Golf Ranking (OWGR)** — accumulated, decayed results across a
  rolling two-year window.
- **DataGolf Rating** — a strokes-gained-based predictive skill estimate.

#### Family B — Ball-striking / shot quality (long-term skill, high signal)
How the player actually produces scores, decomposed from shot data.

- **Strokes Gained** (Off-the-Tee, Approach, Around-the-Green, Putting, Total).

#### Family C — Current-season production (mixed skill / performance)
What the player has actually done this season.

- **Season Performance** — total output and standing this season.
- **Fantasy Production** — scoring rate per start.
- **Consistency** — reliability of that production (gained vs. lost).

#### Family D — Trajectory (short-term performance)
Where the player is heading, independent of their absolute level.

- **Recent Form** — current standing blended with week-over-week movement.
- **Recent Trend** — multi-event slope of results (requires history).
- **Momentum** — streakiness / acceleration within recent starts.

#### Family E — Context adjustments (event-specific; tournament-mode only)
Modifiers that only apply once a specific event/course/field is known. These do
not belong in the *season* Overall Rating; they are activated for the
*tournament* Overall Rating.

- **Course Fit** — how the course's demands match the player's strengths.
- **Wind Fit** — performance under the forecast wind regime.
- **Strength of Field** — quality-adjustment of the player's recent results.

### 1.4 Signal explainability reference

For every signal: **why it belongs**, **how often it updates**, whether it
reflects **long-term skill or short-term performance**, and **how much
confidence** it can provide at the current data tier.

| Signal | Why it belongs | Update cadence | Skill vs. performance | Confidence (today) |
| --- | --- | --- | --- | --- |
| **OWGR** | Independent, universally trusted baseline of accumulated results | Weekly | Long-term skill | Medium — provider tier obfuscates exact rank precision |
| **DataGolf Rating** | Independent predictive skill estimate; strongest single external signal | Weekly (and pre-event) | Long-term skill | High *once ingested* — not available today |
| **Strokes Gained** | The closest thing to ground truth for *how* scores are made; low correlation with ranking | Per event | Long-term skill (with performance noise) | High *once ingested* — not available today |
| **Season Performance** | Direct measure of this season's body of work | Per event / weekly | Mixed | Medium — blends fantasy output (high) with ranking (medium) |
| **Fantasy Production** | Scoring rate per start; the core DFS-relevant productivity signal | Per event | Performance (skill-correlated) | High — grounded in ingested fantasy aggregates |
| **Consistency** | Distinguishes dependable producers from boom/bust; risk dimension | Per event | Performance | High — intrinsic ratio, not field-relative |
| **Recent Form** | Captures who is hot/cold now, which raw ranking lags | Weekly | Short-term performance | Medium — depends on ranking + reported movement |
| **Recent Trend** | Direction over several events; smooths single-week noise | Per event | Short-term performance | Not available — needs multi-event history |
| **Momentum** | Acceleration/streak detection for in-form runs | Per event | Short-term performance | Low even when built — inherently noisy |
| **Course Fit** | Same player ranks differently by venue; large event-level explanatory power | Per event (on schedule) | Context modifier | Not available — needs course + shot data |
| **Wind Fit** | Separates players who hold up in wind; high variance driver | Per event (forecast) | Context modifier | Low–medium even when built — forecast-dependent |
| **Strength of Field** | Prevents rewarding stat-padding in weak fields | Per event | Adjustment | Medium *once field quality is derivable* |
| **Activity** | Durability / sample-size signal; better as a confidence input than a rating input | Per event | Neither (meta) | High — but demoted (see 1.6) |

### 1.5 Availability: now vs. future sprints

**Available immediately** (grounded in currently ingested data — world ranking,
week-over-week movement, events played, and fantasy-point aggregates for the
current season):

- Season Performance
- Fantasy Production
- Consistency
- Recent Form (standing + week-over-week movement)
- Activity (as a confidence input, not a rating input)

**Requires future sprints** (blocked on data ingestion, not on modeling):

| Signal | Blocked on | Likely sprint |
| --- | --- | --- |
| DataGolf Rating | Provider integration + licensing | Data Platform |
| Strokes Gained | Normalized shot/round data (e.g. SportsDataIO) | Data Platform |
| Recent Trend | ≥2 seasons / multi-event history (only one season is ingested today) | Data Platform → Models |
| Course Fit | Course attribute model + player shot profiles | Models |
| Wind Fit | Historical performance-by-wind + forecast feed | Models |
| Strength of Field | Field-quality derivation from ratings | Models |
| Momentum | Multi-event history | Models |
| OWGR (as an explicit, weighted signal) | Already partially present via ranking; promote to a first-class, separately-weighted input | Public Application |

> **Reality check:** only the **current (2025) season** is ingested today.
> Every signal described as "trend", "trajectory over events", or "historical"
> is therefore a future capability regardless of modeling effort. The spec
> documents them now so the Overall Rating has a defined growth path, not so
> they can be faked in the interim.

### 1.6 Weighting philosophy

Exact percentages are deliberately **not** fixed here; they will be tuned and
backtested. What *is* fixed is the reasoning that must govern any weighting:

1. **Weight families, then members.** The weight budget is first split across
   independent families (A–E). A family's internal signals share that budget.
   This is the direct fix for today's double-counting: adding a second
   fantasy-derived metric divides the production family's weight, it does not
   add a new vote.

2. **Independence earns weight.** A signal's weight should scale with how much
   *new* information it adds, not with how intuitive it is. Strokes Gained and
   DataGolf, once available, deserve large shares precisely because they are
   least correlated with the season-production family that dominates today.

3. **Skill outweighs noise for the *season* rating.** The season Overall Rating
   should lean on long-term skill families (A, B) and current-season production
   (C), with trajectory (D) as a smaller nudge. Momentum and single-week
   movement are informative but noisy; they must not swing the headline number.

4. **Context is off by default, on for tournament mode.** Family E (Course Fit,
   Wind, Strength of Field) carries **zero weight** in the season rating and is
   only activated when a specific event is in scope. The season rating answers
   "how good is this player"; the tournament rating answers "how good is this
   player *here, this week*."

5. **Confidence is derived, never assumed.** The Overall Rating's confidence is
   the conservative blend of its contributing signals — it can never exceed the
   confidence of the inputs actually present. A rating built only from
   ranking-derived signals is capped at medium; adding Strokes Gained / DataGolf
   is what unlocks high confidence. Activity and sample size feed confidence, not
   the score itself.

6. **Degrade honestly.** When a signal is missing for a player, its family's
   weight is renormalized across the signals that *are* present, and confidence
   is lowered accordingly — rather than substituting a neutral 50 that would
   quietly distort the ranking.

### 1.7 Inputs / Outputs / Confidence (summary)

- **Inputs (today):** season world ranking + week-over-week movement, events
  played, fantasy points (average, total, gained, lost), normalized against the
  season population.
- **Inputs (future):** DataGolf rating, strokes-gained categories, multi-season
  history, course attributes, wind forecasts, field quality.
- **Outputs:** a 0–100 Overall Rating, a qualitative band
  (Developing → Average → Solid → Strong → Elite), a per-signal breakdown, and a
  confidence level. A letter grade is derived from the score for at-a-glance
  communication.
- **Confidence:** `none | low | medium | high`, derived as the conservative
  (lowest) confidence among contributing families, with ranking-only ratings
  capped at medium.

### 1.8 Future enhancements

- **Tournament Overall Rating** — the season rating with Family E context
  modifiers layered on for a specific event and field.
- **Backtested, per-archetype weights** — validated weight sets for DFS, betting,
  and content use-cases rather than one global blend.
- **Player-specific confidence** — surfacing *why* a rating is low-confidence
  (e.g. "no strokes-gained data for this player yet").

---

## 2. Future Models

Each specialist model below reuses the same discipline as the Overall Rating:
independently-sourced inputs, explicit confidence, and honest degradation. They
exist today as **scaffolds** (module shells that return clearly-labelled mock
output) so the architecture is proven; the specifications here define what each
becomes once real inputs land.

For each: **Purpose · Inputs · Outputs · Confidence · Future enhancements.**

### 2.1 Course Fit

- **Purpose:** Quantify how well a specific course's demands match a player's
  strengths, so the same player can be rated differently week to week. This is
  the single largest source of event-level explanatory power that the season
  rating deliberately excludes.
- **Inputs:** Course attribute profile (length, rough/penalty severity, green
  size and complexity, typical scoring conditions, shot-shape bias) × the
  player's strokes-gained and shot-profile tendencies; historical performance at
  the course and at comparable courses.
- **Outputs:** A 0–100 fit score with a breakdown of the attributes driving it
  (e.g. "rewards distance: strong; demands precise approach: weak"), feeding the
  tournament Overall Rating as a Family E modifier.
- **Confidence:** Low until both a course attribute model and player shot
  profiles exist; medium with a few comparable-course samples; high only with a
  robust course model plus multi-year shot data. Course history alone (small
  sample) is explicitly a low-confidence input.
- **Future enhancements:** Learned course archetypes (clustering courses by the
  skills they reward), weather-conditional fit, and hole-by-hole fit for live
  contexts.

### 2.2 DFS Value

> **Implemented.** The DFS Value Model ships as the flagship composite —
> field-relative projected quality fused from every Signal Family, priced against
> the player's real imported DraftKings salary. See
> [DFS_VALUE_MODEL.md](./DFS_VALUE_MODEL.md) for the engine, honesty guarantees,
> and consumers. The specification below records the full product intent.

- **Purpose:** Identify the best daily-fantasy *value* — projected fantasy
  production relative to salary/ownership — for slate construction. Value, not
  raw strength, wins DFS.
- **Inputs:** Projected fantasy production (from the production family and, later,
  strokes gained), site salary, projected ownership, and the tournament Overall
  Rating (including Course Fit) for the specific slate.
- **Outputs:** A projected points figure, a value score (points per salary
  unit), a leverage/ownership indicator, and a lineup-oriented tier.
- **Confidence:** Medium today (fantasy production is well-grounded, but salary
  and ownership are external and slate-specific); high once projections are
  strokes-gained-driven and course-adjusted.
- **Future enhancements:** Correlation-aware lineup optimization, ownership
  leverage modeling, and multi-entry portfolio construction.

### 2.3 Betting Value

- **Purpose:** Surface edges versus sportsbook prices across outrights,
  matchups, and props — the model's price vs. the market's price.
- **Inputs:** CaddieIQ win/finish probabilities (derived from the tournament
  Overall Rating and its confidence), live sportsbook odds, and market-implied
  probabilities (de-vigged).
- **Outputs:** Model probability, implied probability, edge (expected value),
  and a recommended-stake signal — each tagged with the confidence of the
  underlying rating.
- **Confidence:** Low–medium until win probabilities are validated by
  backtesting; a betting edge is only as trustworthy as the probability behind
  it, so this model must inherit and never inflate the rating's confidence.
- **Future enhancements:** Closing-line-value tracking, matchup and prop-specific
  models, and Kelly-based staking.

### 2.4 Recent Form

- **Purpose:** Measure a player's current trajectory — hot or cold — faster than
  slow-moving accumulated rankings can. Feeds the Overall Rating's trajectory
  family and stands alone as a browsable ranking.
- **Inputs (today):** Current world-ranking standing blended with week-over-week
  movement. **(Future):** results slope across recent events, strokes-gained
  trend, finish-position trend.
- **Outputs:** A 0–100 form score, band, and a direction indicator (improving /
  steady / declining).
- **Confidence:** Medium today — it depends on the ranking (medium, obfuscated
  precision) plus a single week of movement. High once multi-event history
  allows a real trend slope rather than a one-week delta.
- **Future enhancements:** Configurable look-back window, decay weighting of
  older events, and separation of form-by-discipline (e.g. putting form vs.
  ball-striking form).

### 2.5 Wind

> **Status:** The conditions half of this model is **shipped** as the
> **Weather Intelligence Engine** (`lib/weather-intelligence`, see
> [WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md)). It ingests a verified
> per-event forecast and derives current conditions, round-by-round outlook,
> wind/rain timelines, and morning/afternoon tee-time (wave) edge, each graded
> `verified / partial / unavailable`. What remains for the *player-level* Wind
> **Fit** modifier below is the per-player historical wind sample, which is still
> data-blocked (see §1.5 / DATA_CATALOG §5).

- **Purpose:** Identify players who hold up (or fall apart) in wind, a
  high-variance driver of scoring that the field is unevenly equipped for.
- **Inputs:** Historical performance bucketed by wind speed/regime, ball-flight
  and trajectory tendencies, and the event's wind forecast.
- **Outputs:** A wind-fit score and a wind-sensitivity indicator, feeding the
  tournament Overall Rating as a Family E modifier.
- **Confidence:** Low–medium even when built — it is doubly uncertain, depending
  on both a sufficient historical wind sample per player *and* a forecast that
  may change. Confidence must reflect forecast volatility, not just data volume.
- **Future enhancements:** Round- and tee-time-specific wind (morning vs.
  afternoon waves) **— shipped in the Weather Intelligence Engine**; gust vs.
  sustained-wind separation (gusts are now captured per period); and live
  in-round updating.

### 2.6 Momentum

- **Purpose:** Detect streaks and acceleration within a player's recent starts —
  a nuance on top of Recent Form that captures *rate of change*, not just level.
- **Inputs:** Sequence of recent finishes and round-level scoring, strokes-gained
  trajectory, and cut-streak / top-finish streak data.
- **Outputs:** A momentum score and a streak descriptor, contributing a small,
  capped nudge to the trajectory family.
- **Confidence:** Low by design — momentum is the noisiest signal in the system
  and is prone to false patterns in small samples. It is explicitly weighted so
  it can never swing the headline Overall Rating.
- **Future enhancements:** Statistical streak-significance testing (separating
  real runs from noise) and regression-to-mean dampening.

---

## 3. Cross-model principles

These apply to every model above and are the contract future development must
honor:

- **Single source of derived truth.** Specialist models consume the shared
  analytics/ratings rather than recomputing player strength from raw stats, so
  every surface agrees.
- **Single source of event context.** Every event-specific model (Course Fit
  and Weather Intelligence today; future DFS / Betting / AI Coach) resolves
  *which* tournament and host course it evaluates from the shared **Tournament
  Context Engine**
  (`lib/tournament-context`, see [TOURNAMENT_CONTEXT_ENGINE.md](./TOURNAMENT_CONTEXT_ENGINE.md)),
  never independently. The context's `verified / partial / unavailable`
  confidence is the ceiling for the model built on it.
- **Confidence propagates conservatively.** A model's confidence is bounded by
  the weakest input it relies on; downstream models (DFS Value, Betting Value)
  inherit and never inflate the confidence of the ratings beneath them.
- **Mock is always labelled.** Scaffolded modules mark their output as
  non-real so placeholder values can never be mistaken for analysis.
- **Every number is explainable.** If a signal cannot be decomposed and
  described to a user, it does not ship in a rating. The
  [Model Explainability Engine](./EXPLAINABILITY.md) operationalizes this
  principle: it maps every model's output into one canonical `Explanation`
  behind the "Why?" surfaces and the admin debug view, and enforces the honesty
  guarantees (no fabricated scores, explicit limitations, pass-through
  confidence) structurally.

---

## 4. Success criteria

This specification succeeds when it can guide all future model development
without further architectural debate: each signal has a defined source, cadence,
skill/performance character, and confidence ceiling; the Overall Rating has an
independence-first weighting philosophy that resolves the current correlation
problem; and every future model has a purpose, input/output contract, confidence
policy, and enhancement path. No code is written from this document directly —
it is the shared definition those implementations will be measured against.
