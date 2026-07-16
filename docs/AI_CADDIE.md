# AI Caddie

The AI Caddie is CaddieIQ's conversational interface. It answers natural-language questions ("best cash plays?", "who fits the course?", "who benefits from the wind?") by routing them to the platform's existing **verified intelligence engines** and composing structured, **cited** answers.

## Design principle: deterministic and grounded

The Caddie is **not** a generative LLM. It never invents facts. Every answer is:

- **Routed** by a pure keyword/synonym intent classifier (`lib/caddie/intent-router.ts`).
- **Answered** by a pure per-intent function that queries a verified engine's output.
- **Cited** — every answer names its source engine and carries a confidence level.
- **Honest** — when an engine has no data for the active tournament, the Caddie says so ("DFS value hasn't been imported for this event yet") instead of guessing.

This mirrors the deterministic narrator seam in the Explainability Engine: the brain is deterministic and fully unit-testable, with no external AI dependency.

## Architecture

```
User question
   │
   ▼
routeCaddieQuestion()            lib/caddie/intent-router.ts   → CaddieIntent
   │
   ▼
askCaddie(intent, bundle)        lib/caddie/engine.ts
   │                              dispatches to a pure answerer:
   ├─ dfs.ts          → DFS Value Engine        (cash / GPP / underpriced)
   ├─ course-fit.ts   → Course Fit Board        (fits / fades)
   ├─ form.ts         → Skill Leaderboards      (in-form players)
   ├─ odds.ts         → Odds Intelligence       (favorites / value)
   ├─ weather.ts      → Weather Intelligence    (wind beneficiaries)
   ├─ players.ts      → Comparison + Explainability (compare / explain rating)
   └─ capabilities.ts → static help
   │
   ▼
CaddieAnswer  { headline, summary, bullets, entities, citations, confidence, followUps, isEmpty }
```

### Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Engine (pure) | `lib/caddie/` | Intent routing + grounded answerers. No I/O. |
| Service | `features/caddie/services/caddie-service.ts` | Resolves the active tournament, loads the data bundle via `Promise.all`, resolves player names → analytics for compare/explain. |
| API | `app/api/caddie/route.ts` | Public `POST` endpoint; validates the request and runs the engine. |
| UI | `features/caddie/` | `CaddieChat` (composer + message list), `CaddieAnswerCard` (grounded answer), `caddie-view` (tournament switcher). |

## Tournament scope

Most questions operate over a single tournament's field. The service resolves an **active tournament** (in-progress → next scheduled) and the `/caddie` page exposes a **switcher** to change events. Every answer states which tournament it references.

## Surfaces

- **Global page** — `/caddie`, linked from primary navigation under Golf Intelligence.
- **Command Center widget** — a collapsible "Ask the Caddie" widget embedded in the Tournament Command Center, scoped to that tournament (`compact` mode).

## Supported intents

| Intent | Example question | Source engine |
| --- | --- | --- |
| `dfs_cash` | "Best cash plays?" | DFS Value Engine |
| `dfs_gpp` | "Best GPP / tournament plays?" | DFS Value Engine |
| `dfs_underpriced` | "Who's underpriced?" | DFS Value Engine |
| `course_fit` | "Who fits the course?" | Course Fit Board |
| `course_fades` | "Who should I fade?" | Course Fit Board |
| `form` | "Who's in form?" | Skill Leaderboards |
| `odds_favorites` | "Who are the favorites?" | Odds Intelligence |
| `odds_value` | "Where's the betting value?" | Odds Intelligence |
| `weather` | "Who benefits from the wind?" | Weather Intelligence |
| `compare_players` | "Compare X and Y" | Comparison + Verdict |
| `explain_rating` | "Why is X rated that way?" | Explainability Engine |
| `capabilities` | "What can you do?" | (static) |

Unrecognized questions fall back to a helpful capabilities answer.

## Guarantees

- **No fabrication** — answers only ever project verified engine output.
- **Graceful degradation** — missing data returns an honest, `isEmpty` answer with the citation preserved.
- **Deterministic** — same input, same output; no network AI calls.
- **Testable** — `lib/caddie/__tests__/` covers intent routing, grounding, and empty-state degradation.

## Tests

```
npx vitest run lib/caddie
```

- `intent-router.test.ts` — question → intent classification, including synonyms and fallback.
- `engine.test.ts` — grounded answers over a populated bundle and honest degradation over an empty bundle.
