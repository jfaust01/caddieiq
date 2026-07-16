# Decision Trace Engine — CaddieIQ

**Status:** Living document · **Owner:** Chief Product Architect · **Last updated:** v0.1.0

---

## 0. Purpose

The [Explainability Engine](./EXPLAINABILITY.md) answers *"what factors went into
this score, and how confident are we?"* The **Decision Trace Engine** answers the
next question a user actually asks: *"walk me through **how** the model decided,
step by step."*

A Decision Trace is an **ordered, pipeline-shaped view of a canonical
`Explanation`**. It reorders and re-presents the same contributors as a sequence
of stages — Player Skill → Recent Form → Course Fit → Field Strength → Weather →
Market → Salary → Context → **Final Score** — so the reasoning reads like a
transparent pipeline rather than a flat list.

Crucially, the engine **derives** the trace; it never recomputes a model and
never adds a fact. If it is not already in the `Explanation`, it cannot appear in
the trace.

## 1. Why derive instead of storing a `decisionTrace` per model

Every model already emits an `Explanation` with ordered, weighted,
direction-tagged, confidence-graded contributors and explicit limitations. That
is exactly the raw material a trace needs. Deriving the trace from it (rather than
having each model emit its own `decisionTrace`) means:

- **No duplicated logic** — ordering/weighting lives once, in the adapters.
- **No drift** — the trace and the "Why?" breakdown can never disagree, because
  they read the same source object.
- **Free coverage** — every current and future model gets a trace automatically.

## 2. Honesty guarantees (inherited + added)

The trace inherits all five [Explainability honesty guarantees](./EXPLAINABILITY.md#1-honesty-guarantees)
and adds two of its own:

6. **No stage without a source.** Every non-final stage maps 1:1 to exactly one
   `Explanation` contributor. The only synthetic stage is the terminal
   **Final Score**, which restates the headline verbatim.
7. **Context is not causation.** Contributors flagged `independent` (context-only)
   become stages with `influencesOutcome = false` and **no weight stars**, so a
   trend/context signal can never masquerade as a driver of the score.

## 3. Architecture

```
Explanation ──(toDecisionTrace)──▶ DecisionTrace ──(narrateFromTrace)──▶ TraceNarrative
 (canonical)      pure builder        (ordered)         pure narrator      (AI Coach prose)
                       │
          ┌────────────┼────────────────────┐
          ▼            ▼                     ▼
   DecisionTraceTimeline   AI Player Insight    /admin/explainability
   (upgraded "Why?")        (AI Coach card)      (Developer Trace)
```

- **`lib/explainability/decision-trace-types.ts`** — the `DecisionTrace`,
  `DecisionTraceStage`, `TraceNarrative`, and category types.
- **`lib/explainability/decision-trace.ts`** — the pure builder
  (`toDecisionTrace`), the category classifier (`classifyContributor`), the
  weight→stars mapping (`weightToStars`), and the trace narrator
  (`narrateFromTrace`, `toNarratedTrace`).
- **`features/explainability/components/decision-trace-timeline.tsx`** — the
  vertical timeline UI shared by every "Why?" surface.
- **`features/players/components/ai-summary-card.tsx`** — the AI Coach card,
  narrated from the trace.
- **`features/admin/explainability/developer-trace.tsx`** — the engineering view.

## 4. The pipeline classifier

Each contributor is placed into one pipeline category by `classifyContributor`,
resolved in this order:

1. **Exact known key** (e.g. `seasonPerformance → player-skill`,
   `courseFit → course-fit`, `salary → salary`). Grounded in the real contributor
   keys emitted by the eight adapters.
2. **Whole-model override** — disambiguates keys that collide across models. For
   example `approach`/`putting` mean *player-skill* in the Player Skill model but
   *course-fit* in the Course Fit model, so those whole models pin a category.
3. **Keyword fallback** — word-boundary-aware patterns for keys not enumerated
   above. (Word boundaries matter: `"form"` must not match inside
   `"perFORMance"`.)
4. **`context`** — anything still unmatched, shown but never treated as a driver.

Stages are then sorted by `TRACE_PIPELINE_ORDER`; within a category, the source
contributor order (strongest-weight first) is preserved. A `final` stage is
always appended.

### Presentation mappings (display-only)

| Trace field    | Source                          | Notes                                              |
| -------------- | ------------------------------- | -------------------------------------------------- |
| `weightStars`  | `contributor.weightPct`         | Banded 0–5; `null` for context-only signals.       |
| `impact`       | `contributor.direction`         | Copied verbatim (`positive`/`negative`/`neutral`). |
| `confidence`   | `contributor.confidence`        | Pass-through.                                      |
| `evidence`     | raw / normalized / contribution / weight | Copied verbatim; never derived.           |
| `influencesOutcome` | `!contributor.independent` | Context-only signals are excluded from drivers.    |

## 5. User surfaces

- **The "Why?" reveal is the timeline.** `WhyButton` (responsive
  popover/sheet) now renders `DecisionTraceTimeline`, so all six score
  surfaces — Overall Rating, Player Skill, Course Fit, DFS Value, Betting Value,
  and the field-fit board — inherit the step-by-step view with no per-card
  wiring. Limitations are always shown in their own panel.
- **AI Coach.** The AI Player Insight card narrates the trace with
  `narrateFromTrace`: a summary line, a numbered walkthrough of the influencing
  stages (category, impact, weight), and the first limitation as an honest
  caveat. Like the deterministic explanation narrator, it restates only what the
  trace already contains.

## 6. Developer Trace (admin)

`/admin/explainability` (ADMIN-only) adds a **Developer Trace** section: a dense,
monospace engineering audit that pairs each trace stage with its underlying
contributor and shows raw → normalized → weight% → signed contribution alongside
the derived category, impact, confidence, and `influencesOutcome`, plus the final
score and the full missing-inputs/limitations list. It exists so an operator can
verify the trace is a faithful, lossless view of the `Explanation` — nothing
recomputed, nothing hidden.

## 7. The narrator seam (LLM-ready)

`narrateFromTrace` is a pure function returning `{ summary, steps, caveat }`. As
with the explanation narrator, an LLM narrator can later replace it, provided it
is constrained to the same guarantee: **restate only stages present in the
trace.** No UI or builder changes are required.

## 8. Tests

`lib/explainability/__tests__/decision-trace.test.ts` covers:

- **Classifier precision** — the `perFORMance` word-boundary trap, exact-key
  mapping, and model-aware disambiguation of colliding keys.
- **Weight→stars** — banded mapping and monotonicity.
- **Ordering** — non-final stages are non-decreasing in pipeline order; a final
  stage always closes the trace.
- **Pass-through** — headline, confidence, and every limitation carry through
  unchanged; one stage per contributor plus the final stage.
- **Context-only handling** — `influencesOutcome = !independent`, no stars for
  independents.
- **Narration honesty** — no number appears that is not in the trace; only
  influencing stages are narrated; unavailability is reported, not fabricated.

## 9. Related documents

- [`EXPLAINABILITY.md`](./EXPLAINABILITY.md) — the canonical `Explanation` this
  engine derives from, and the shared honesty guarantees.
- [`MODELS.md`](./MODELS.md) — the model specifications and the pipeline signals
  the trace orders.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — where the engine sits in the platform.
