# DFS Value Model

The **flagship composite** of the platform — the one number that answers the
question a daily-fantasy player actually asks:

> _"For this player's real DraftKings salary, how much projected quality am I
> getting, and how sure are we?"_

DFS Value is not a sixth Signal Family. It is the **consumer that fuses all of
them.** It takes every Signal Family the platform already owns — Player Skill,
Course Fit, Form (Player Data), Betting Market, and Weather — blends them into a
single field-relative **projected quality** score, then prices that quality
against the player's **real, imported DraftKings salary** to produce a
salary-adjusted **value score**.

It follows the platform's governing rule (see [MODELS.md](./MODELS.md)):
**never fabricate value.** With no salary, or with no quality family that can be
graded, the model returns an explicit `unavailable` result with a
machine-readable reason. It never estimates a price and never invents quality.

---

## Why it exists

Value is the single most fakeable number in DFS: "$8,400 · 84 value · elite
play" reads as authoritative whether or not one signal or one salary backs it.
Every upstream engine on this platform was already built to be honest and
field-relative; DFS Value exists so their combination stays just as disciplined
instead of collapsing into a black box.

1. **One composite, one confidence.** The Player Page value card and the
   Tournament Page value leaderboards read the same result, graded by a single
   pure function. They cannot drift apart.
2. **Value = quality per dollar, never dollars alone.** A real salary with no
   gradable quality family yields `unavailable`, not a score. Salary is the
   denominator of value, never a substitute for it.
3. **Honest degradation everywhere.** Every family is nullable end to end. A
   missing family is dropped and the remaining weights renormalize; it is never
   scored as `0`. A thin field lowers confidence rather than faking certainty.
4. **No new signal logic.** The model reads each family through the same adapter
   every other surface uses — the DFS Course Fit signal is literally the Course
   Fit surface's score; the DFS skill signal is the Player Skill profile. There
   is no parallel scoring path to drift.

---

## The intelligence object

```ts
type DfsValueResult = {
  playerId: string
  displayName: string
  status: "available" | "unavailable"
  salary: number | null                 // real imported DraftKings salary
  salaryTier: "high" | "mid" | "value" | null
  strength: number | null               // 0–100 projected quality (field-relative)
  score: number | null                  // 0–100 salary-adjusted VALUE
  tier: DfsValueTier | null              // elite | strong | fair | thin | …
  confidence: DfsConfidence              // none | low | medium | high
  contributions: DfsSignalContribution[] // per-family score, weight, rating
  drivers: DfsDriver[]                   // top positive families (AI-ready labels)
  risks: DfsRisk[]                       // weakest families
  gaps: DfsGap[]                         // machine-readable reasons
  detail: string                         // plain-English, safe to render
}
```

An **available** result carries a `strength` (projected quality) and a `score`
(that quality priced against salary), each derived only from families that could
actually be graded. An **unavailable** result carries `gaps` and a `detail`
string safe to render directly — e.g. _"held a DraftKings salary but no quality
family was gradable, so value cannot be computed."_

---

## How value is computed

The model runs in two stages, both **field-relative** — a player's value is only
meaningful against the field they are actually in, so the whole event field is
the population.

### 1. Projected quality (`strength`)

Each Signal Family is mapped to a normalized `DfsSignalInput` — a `0–100` score,
a confidence, and an AI-ready rating label:

| Family        | Source                                   | Signal                                  |
| ------------- | ---------------------------------------- | --------------------------------------- |
| Player Skill  | `PlayerSkillProfile`                     | mean of the player's **rated** skills   |
| Course Fit    | `computeCourseFit` (canonical adapter)   | the fit score vs the host course        |
| Form          | `PlayerAnalytics`                        | recent-form rating                      |
| Betting Market| Odds Intelligence field view             | implied rank → 0–100                    |
| Weather       | Weather Intelligence (shared context)    | playability band → representative score |

Present families are blended by configured weights; **any missing family is
dropped and the remaining weights renormalize** so a player is never penalized
for a signal the platform doesn't hold. With zero gradable quality families,
`strength` is `null` and the result is `unavailable`.

### 2. Salary-adjusted value (`score`)

Value is the player's **quality percentile minus their salary percentile**
within the field, re-centered to `0–100`. An underpriced strong player scores
higher than an equally strong but expensive one; a cheap weak player does **not**
outrank a fairly-priced stud. Players with no salary are `unavailable` — there is
no denominator to price against.

### Confidence is capped by context

Confidence is bounded by a **context ceiling** derived from the Tournament
Context Engine: a resolved host course + field is full context (`verified`); a
tournament with no linked course is `partial` (ceiling capped at `medium`); an
unresolved event is `unavailable`. Weather never carries the strongest weight and
its confidence is capped, because it is a forecast.

---

## Architecture

```
lib/dfs-value/
  types.ts          # pure contracts (result, field, boards, signal inputs)
  model.ts          # buildDfsValueField — the pure, deterministic scorer
  leaderboards.ts   # buildDfsBoards — ranks results into DFS boards
  service.ts        # server-only: composes every engine + real salary, then scores
  index.ts          # barrel (pure exports only; service imported directly)
```

`model.ts` and `leaderboards.ts` are **pure and side-effect free** — no I/O, no
clock, fully deterministic (ties broken by a stable `playerId` order). They are
exhaustively unit-tested in `lib/dfs-value/__tests__/`. `service.ts` is the only
part that touches data: it resolves the field through the **Tournament Context
Engine**, fans out across every Signal Family service and the fantasy repository
in parallel, maps each output to a signal, and hands the pure model a plain
input. All salary reads go through `FantasyRepository`.

### Data model

Real DFS salaries live in `DfsSalary` (operator, salary, resolved `playerId` /
`tournamentId`, capture time). The model prefers **DraftKings** and the freshest
capture, collapsing to one canonical price per player. Salaries are read-only
here — importing them is the fantasy provider pipeline's job.

---

## Consumers

### Player Page — DFS Value card

`features/players/components/player-dfs-value-card.tsx`, fed by the
`fetchPlayerDfsValue` server action via `usePlayerDfsValue`. Shows the value
score, tier, salary, projected quality, the per-family contribution breakdown,
and drivers/risks — or an honest empty state for each degraded case (no active
field, no salary, no gradable quality family).

### Tournament Page — DFS Value leaderboards

`features/tournaments/components/tournament-dfs-leaderboards.tsx`, fed by
`tournamentService.getDfsValueField`. Ranks the whole field into DFS boards — top
values, high-end plays, mid-range, value plays, highest confidence, and risky GPP
targets — with a readiness strip (priced / rated / field grade).

### Admin — Data Coverage

`/admin/data-coverage` carries a **DFS Value Model** section framed as
_readiness_: priced players, slated tournaments, whether a quality family is live,
operators, and freshness. It reports `restricted` (a limitation, not a low score)
until both a salary slate and a gradable quality family exist.

---

## Adding DFS value to a new surface

1. Call `getDfsValueService().getPlayerValue(playerId)` for one player, or
   `getFieldValueForTournament(tournamentId)` for a whole field.
2. Render `status === "available"` results; for `unavailable`, show `detail`.
3. Never re-derive value — the service is the single authoritative source.

---

## Honesty guarantees

- **No salary → no value.** A player without a real imported salary is
  `unavailable`; salary is never estimated.
- **No quality → no value.** A salary with zero gradable quality families is
  `unavailable`; quality is never fabricated from price.
- **Missing families renormalize.** An absent signal is dropped, never scored as
  `0`, so partial data lowers confidence instead of distorting the score.
- **Confidence has a ceiling.** Thin fields and unresolved context cap confidence;
  the model never claims more certainty than the data supports.
- **Fully deterministic.** Identical inputs always produce identical output,
  including tie ordering — verified by the pure-model test suite.
