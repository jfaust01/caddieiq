# Model Explainability Engine — CaddieIQ

**Status:** Living document · **Owner:** Chief Product Architect · **Last updated:** v0.1.0

---

## 0. Purpose

Every CaddieIQ model already produces a score, a confidence grade, and a weighted
breakdown of the signals behind it. The **Explainability Engine** unifies those
per-model outputs behind a single, model-agnostic contract — the
`Explanation` — so that one "Why?" surface, one admin debug view, and one AI
narrator can describe *any* model with the same honest vocabulary.

The engine does not compute or re-weight anything. It is a **translation layer**:
pure adapters map each model's existing output into the canonical shape, and a
narrator turns that shape into prose. This keeps the models as the single source
of truth for the numbers, and the engine as the single source of truth for *how
those numbers are explained*.

## 1. Honesty guarantees

These are structural, not aspirational. They hold for every model:

1. **No fabricated scores.** A model that cannot produce a score sets
   `headline.value = null`. The UI shows "unavailable", never a placeholder 50.
2. **Missing data is explicit.** An absent input becomes a
   [`Limitation`](#3-the-explanation-contract), never a neutral midpoint folded
   silently into the composite.
3. **Confidence is passed through, never invented.** Each model's native
   confidence vocabulary is mapped conservatively onto one scale
   (`high | medium | low | none`) by `lib/explainability/confidence.ts`. The
   engine never upgrades a grade.
4. **One voice.** The prose is generated in exactly one place (the narrator), so
   no two surfaces can disagree about what a score means.
5. **Grounded narration.** The narrator may only restate facts already present in
   the `Explanation`. The deterministic narrator upholds this by construction; any
   future LLM narrator must be constrained to the same guarantee (see §5).

## 2. Architecture

```
model output ──(pure adapter)──▶ Explanation ──(narrator)──▶ Explanation + narrative
   (per model)                   (canonical)                  (prose)
                                     │
                        ┌────────────┼─────────────┐
                        ▼            ▼             ▼
                   Why? popover  AI cards   /admin/explainability
```

- **`lib/explainability/types.ts`** — the canonical `Explanation` contract.
- **`lib/explainability/registry.ts`** — the single source of truth for which
  models exist and how to describe them. Adding a model is a one-line change here.
- **`lib/explainability/confidence.ts`** — confidence vocabulary normalization.
- **`lib/explainability/adapters/*.ts`** — one pure `toXExplanation(data, subject)`
  per model. No I/O, no recompute.
- **`lib/explainability/narrator.ts`** — the `ExplanationNarrator` seam and the
  default deterministic implementation.
- **`features/explainability/components/`** — the shared `WhyButton` (responsive
  popover/sheet) and `ExplanationBreakdown` presentational component.
- **`features/admin/explainability/`** + **`app/(app)/admin/explainability/`** —
  the ADMIN-only debug view.

## 3. The Explanation contract

| Field          | Meaning                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| `model`        | Registry metadata (label, category, methodology).                                |
| `subject`      | The player / tournament / player-tournament the explanation is about.            |
| `headline`     | `value` (or `null`), `unit`, `band`, `confidence`, `confidenceLabel`.            |
| `contributors` | Every factor: name, description, raw & normalized value, `weightPct`, signed `contribution`, `direction`, own `confidence`, and `independent` (context-only). |
| `reasoning`    | Structured factual statements the adapter derived.                               |
| `assumptions`  | Assumptions the score rests on (true today, may change).                         |
| `limitations`  | Honest gaps: missing data, degraded confidence, unmodeled areas.                 |
| `provenance`   | Named sources and an `asOf` timestamp.                                           |
| `narrative`    | Generated prose (`summary` + `bullets`); empty until a narrator runs.            |

## 4. Model coverage

All eight models are covered. Four produce rich weighted breakdowns; the rest
**degrade honestly** — they return real `Explanation`s whose limitations state
plainly what is not (yet) modeled, rather than fabricating contributors.

| Model                | Coverage             | Notes                                                                 |
| -------------------- | -------------------- | --------------------------------------------------------------------- |
| Overall Rating       | Full breakdown       | Equal-weighted mean of available core analytics; independents flagged. |
| Player Skill         | Full breakdown       | Per-skill 0–100 signals; unsourced skills stay explicitly unknown.    |
| Course Fit           | Full breakdown       | Demand-weighted per-family signals; scored only where verified.       |
| DFS Value            | Full breakdown       | Signal families + salary, capped by Tournament Context confidence.    |
| Betting Value        | Honest degradation   | Surfaces market consensus only; states no edge model exists yet.      |
| Fantasy Projection   | Honest degradation   | Provider projections; flags scrambled values on non-production tiers. |
| Weather Intelligence | Honest degradation   | A signal family, not a 0–100 score; completed/unlocated events degrade. |
| Tournament Context   | Honest degradation   | Context/readiness, not a score; sets the confidence ceiling.          |

## 5. The narrator seam (LLM-ready)

The narrator is an interface — `ExplanationNarrator` — with one deterministic
implementation today (`deterministicNarrator`, id `deterministic-v1`). It reads
only the explanation's own headline, contributors, reasoning, and limitations, so
it is structurally incapable of inventing a factor, a number, or a confidence
level.

To swap in an LLM narrator later, implement the same interface and constrain the
model (grounded prompt + validation) to the identical guarantee: **restate only
what the `Explanation` already contains.** Adapters and UI do not change.

## 6. Admin debug view

`/admin/explainability` (ADMIN-only; non-admins get a 404 so the route is not
disclosed) lets an operator pick a model and an entity and inspect:

- the rendered `ExplanationBreakdown` (headline, contributors, weights, confidence,
  reasoning, assumptions, limitations),
- the deterministic narrative, and
- the raw `Explanation` JSON.

Models that cannot be resolved standalone report an honest "unavailable" state
with the reason, rather than erroring.

## 7. Tests

`lib/explainability/__tests__/explainability.test.ts` covers registry
completeness, conservative confidence mapping, adapter honesty (missing metrics
become limitations, empty entities yield `null` headlines), honest degradation
for market-only models, and narrator grounding (the prose never introduces a
number absent from the explanation).

## 8. Related documents

- [`MODELS.md`](./MODELS.md) — the model specifications and the confidence
  discipline this engine passes through.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — where the engine sits in the platform.
- [`SYSTEM_HEALTH.md`](./SYSTEM_HEALTH.md) — operational visibility.
