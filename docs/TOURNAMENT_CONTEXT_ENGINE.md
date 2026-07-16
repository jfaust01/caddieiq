# Tournament Context Engine

The **single authoritative source** of the answer to one question:

> _"Which tournament is this player (or page) currently evaluating, and how
> complete is that context?"_

Every event-specific model — Course Fit today; Weather, DFS Value, Betting
Value, and AI Coach next — reads its tournament and host course **from this
engine and nowhere else**. There is exactly one place that selects a player's
active event and one place that normalizes a tournament into a context, so no
two surfaces can disagree about the context or duplicate the selection logic.

It follows the platform's governing rule (see [MODELS.md](./MODELS.md)):
**never fabricate context.** When a required input is missing, the engine
returns an explicit state with a machine-readable reason — never a guessed
tournament or course.

---

## Why it exists

Before this engine, each surface answered "what's the relevant tournament?" on
its own. The Player Page picked a course for Course Fit; the Tournament Page
resolved its own host course for the field board. Two problems followed:

1. **Divergence.** Independent selection logic can drift — one surface could
   fall back to a past event while another required an upcoming one.
2. **Duplication.** Every new model (Weather, DFS, Betting) would re-implement
   the same "find the event, find the course, decide if it's good enough" logic.

The Tournament Context Engine centralizes that into one resolver + one pure
normalizer, so adding a model is "read the context," not "re-derive it."

---

## The context object

```ts
type TournamentContext =
  | TournamentContextAvailable   // a real tournament resolved
  | TournamentContextUnavailable // nothing resolved — models must not run
```

An **available** context carries verified DB facts only: the tournament
(id/name/slug/status/dates), the linked `course` (or `null`), whether a field
was imported (`fieldConfirmed`), a `timing` (`UPCOMING` / `LIVE` / `COMPLETED`),
and an explicit list of `gaps`. An **unavailable** context carries a
machine-readable `reason` and a plain-English `detail` safe to render directly.

### Confidence is the ceiling

`confidence` is the most important field. It is the **maximum certainty any
downstream model may present** — a model can never be more confident than the
context it was built on.

| Confidence     | Meaning                                                            | Course-dependent models |
| -------------- | ------------------------------------------------------------------ | ----------------------- |
| `verified`     | Real tournament **+ linked host course + known start date**        | May run                 |
| `partial`      | Real tournament, but course and/or start date missing              | Must degrade, not guess |
| `unavailable`  | No tournament resolved                                             | Must not run            |

The rule lives in exactly one pure function
(`normalizeTournamentContext`): `verified` requires a linked course **and** a
start date; anything less is `partial`; a missing tournament is the only
`unavailable` case. A missing field (roster) is recorded as a gap but does not
by itself drop a course-complete context below `verified` — field-dependent
consumers additionally check `fieldConfirmed`.

---

## Architecture

```
Player Page ─┐                                    ┌─ findUpcomingContextById()  (player)
             ├─ tournamentContextService ─ repos ─┤
Tournament ──┘         │                          └─ findContextById()          (tournament)
Page                   │
                       ▼
        normalizeTournamentContext()  ← pure, unit-tested confidence rules
                       │
                       ▼
              TournamentContext  → Course Fit, (Weather, DFS, …)
```

- **`lib/tournament-context/context.ts`** — pure normalizer. No I/O. Owns the
  confidence rules and timing derivation. Fully unit-tested.
- **`lib/tournament-context/service.ts`** — `server-only`. Reads through
  repositories, maps rows into the normalizer's input, returns the context.
  Wrapped in React `cache` so a route resolving the same context twice per
  request (e.g. `generateMetadata` + page) hits the DB once.
- **`lib/tournament-context/types.ts`** — shared types + the `isContextAvailable`
  and `hasCourseContext` guards. Downstream code gates on the guards rather than
  re-deriving the rules.

### Resolution rules

- **Player source** (`getPlayerActiveContext`): the player's **next upcoming**
  event they are confirmed in (nearest first). Forward-looking by design — a
  past event is never selected. `unavailable` when the player is in no upcoming
  field.
- **Tournament source** (`getTournamentContext`): the context for a specific
  tournament id. Produces the _same_ normalized shape, so a model consumes an
  identical object regardless of entry point.

Both resolvers `LEFT JOIN` the host course, so an event with no linked venue
still resolves as a `partial` context (with a `course` gap) rather than being
hidden or fabricated.

---

## Consumers

### Course Fit — Player Page (`Upcoming Tournament` card)

`playerService.getPlayerById` calls `getPlayerActiveContext`, then
`buildUpcomingContext` attaches the event-specific Course Fit:

- **`unavailable`** → neutral placeholder; **no fit computed** and nothing drawn
  from past events.
- **`partial`** (event, no linked course) → the event is shown, but Course
  Intelligence and Course Fit are withheld, not guessed.
- **`verified`** → the full block renders: event header (links to the hub), a
  Course Intelligence coverage summary for the host course, and the Course Fit
  section. Course Fit itself stays honest — with no per-skill player data
  ingested today it reports real confidence and lists unscored signals.

### Course Fit — Tournament Page (field board)

`tournamentService.getFieldFitBoard` resolves the host course **from the shared
context** (`hasCourseContext(context) ? context.course.id : null`) instead of
resolving it independently, so the board always agrees with the rest of the hub.

---

## Adding a new event-specific model

1. Call `tournamentContextService.getTournamentContext(id)` (or
   `getPlayerActiveContext(playerId)`), do **not** resolve the event yourself.
2. Gate on the guards: `isContextAvailable` for any run; `hasCourseContext` for
   a course-dependent model.
3. Cap your model's confidence at `context.confidence`.
4. On `partial` / `unavailable`, degrade using the context's `gaps` / `detail` —
   never fabricate the missing input.

---

## Honesty guarantees

- The context is built from **verified database facts only**; the normalizer
  never invents a tournament, course, or date.
- `unavailable` is a first-class state with a machine-readable `reason`, not an
  empty object a caller might misread as "no fit."
- Confidence is derived by one pure, tested function — every surface applies the
  identical rule, so the whole page agrees on one event and one confidence.

The official-field lifecycle built on top of this engine (the `awaiting` /
`confirmed` messaging and the commitment deadline) is documented in
[TOURNAMENT_FIELD_INTELLIGENCE.md](./TOURNAMENT_FIELD_INTELLIGENCE.md).

See also: [COURSE_FIT_MODEL.md](./COURSE_FIT_MODEL.md),
[COURSE_INTELLIGENCE.md](./COURSE_INTELLIGENCE.md),
[TOURNAMENT_FIELD_INTELLIGENCE.md](./TOURNAMENT_FIELD_INTELLIGENCE.md),
[MODELS.md](./MODELS.md).
