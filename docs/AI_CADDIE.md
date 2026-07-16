# AI Caddie — Conversational Intelligence Interface

## Goal
A conversational interface where users ask natural-language questions ("best cash plays this week?", "who's underpriced?", "wind beneficiaries?", "compare Rahm and Fleetwood", "why is X rated 82?") and get **grounded, cited answers** composed from CaddieIQ's existing verified engines. No fabrication — every answer is derived from engine output and names its source, or honestly says the data isn't available.

## Design Principle: Deterministic & Grounded

The Caddie is **not** a generative LLM. It never invents facts. Every answer is:

- **Routed** by a pure keyword/synonym intent classifier (`lib/caddie/intent-router.ts`) — deterministic, 100% testable
- **Answered** by a pure per-intent function that queries verified engine output only
- **Cited** — every answer names its source engine and carries a confidence level
- **Honest** — when an engine has no data, the Caddie says so ("Data not available for {tournament}") instead of guessing

This mirrors the deterministic narrator in the Explainability Engine: no external AI dependency, no fabrication.

## Architecture

### Four-Layer Design

```
User question
   │
   ▼
routeCaddieQuestion()            lib/caddie/intent-router.ts
   │                              (pure intent classification)
   ▼
askCaddie(intent, bundle)        lib/caddie/engine.ts
   │                              (dispatches to pure answerer)
   ├─ dfs.ts          → DFS Value Engine
   ├─ course-fit.ts   → Course Fit Board  
   ├─ form.ts         → Skill Leaderboards
   ├─ odds.ts         → Odds Intelligence
   ├─ weather.ts      → Weather Intelligence
   ├─ players.ts      → Comparison + Explainability
   └─ capabilities.ts → static help
   │
   ▼
CaddieAnswer
{ headline, summary, bullets, entities, citations, confidence, followUps, isEmpty }
```

| Layer | Path | Responsibility |
|-------|------|-----------------|
| **Engine (Pure)** | `lib/caddie/` | Intent routing + grounded answerers. Zero I/O. Unit-testable. |
| **Service** | `features/caddie/services/caddie-service.ts` | Resolves active tournament, loads CaddieDataBundle via `Promise.all`, resolves player-name fragments to field analytics. |
| **API** | `app/api/caddie/route.ts` | Public POST endpoint; validates tournamentId + message, orchestrates service + engine. |
| **UI** | `features/caddie/components/` | `CaddieChat` (message list + input), `CaddieAnswerCard` (structured answer renderer), `CaddieView` (tournament switcher). |

## Tournament scope

Most questions operate over a single tournament's field. The service resolves an **active tournament** (in-progress → next scheduled) and the `/caddie` page exposes a **switcher** to change events. Every answer states which tournament it references.

## Surfaces

- **Global page** — `/caddie`, linked from primary navigation under Golf Intelligence.
- **Command Center widget** — a collapsible "Ask the Caddie" widget embedded in the Tournament Command Center, scoped to that tournament (`compact` mode).

## Supported Intents

Each intent is classified via keyword/phrase matching and answered by a pure, grounded answerer:

| Intent | Example Questions | Source Engine |
|--------|-------------------|----------------|
| `best_cash_plays` | "Best cash plays?" "Safe plays?" | DFS Value (floor/ceiling) |
| `best_gpp_plays` | "GPP plays?" "Tournament plays?" | DFS Value (ceiling/upside) |
| `underpriced` | "Who's underpriced?" "Bargains?" | DFS Value (leverage board) |
| `course_fit` | "Who fits the course?" "Best fit?" | Course Fit Board |
| `fades` | "Who to fade?" "Avoid?" | Course Fit Board |
| `top_form` | "Who's hot?" "Best iron players?" | Skill Leaderboards |
| `odds_favorites` | "Favorites?" "Odds?" "To win?" | Odds Intelligence |
| `weather` | "Wind impact?" "How does weather affect...?" | Weather Intelligence |
| `compare_players` | "Rahm vs. Fleetwood?" "Compare X and Y" | Player analytics |
| `explain_rating` | "Why is X rated 82?" "Justify the rating" | Explainability Engine |
| `capabilities` | "What can you do?" "Help" "Examples?" | Static help |
| `unknown` | Anything else | Honest fallback |

Unrecognized questions return `intent: "unknown"` and offer a helpful capabilities message.

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
