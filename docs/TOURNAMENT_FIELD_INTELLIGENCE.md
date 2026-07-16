# Tournament Field Intelligence

The **single authoritative answer** to one operational question:

> _"Has the official PGA Tour field been released for this event yet, and how
> confident are we that what we're showing is the final field?"_

This is a lifecycle layer on top of the [Tournament Context Engine](./TOURNAMENT_CONTEXT_ENGINE.md).
The Context Engine answers _which_ event is in play and _how complete_ its
context is; Field Intelligence answers _where that event sits in the official
field lifecycle_. Both the public Tournament Page banner and the admin
diagnostics panel read the **same pure rules**, so a fan and an operator can
never see contradictory field states.

It follows the platform's governing rule (see [MODELS.md](./MODELS.md)):
**never fabricate a field.** An event with no imported roster is honestly
`awaiting` — not an error, and never a guessed list of players.

---

## Why it exists

For PGA Tour events, players commit until **5:00 PM Eastern Time on the Friday
before tournament week**, and the Tour publishes the official field shortly
after. That means there is a legitimate, recurring window where an upcoming
event correctly has **no field yet**. Before this layer, every field-dependent
surface had to decide on its own whether an empty roster meant "not published
yet" or "we failed to import it" — and each could decide differently.

Field Intelligence centralizes that judgment into one pure module
(`lib/tournament-context/field-status.ts`) so:

1. **The Tournament Page** can tell a fan _"the field drops Friday at 5 PM ET"_
   instead of showing a blank or a fake roster.
2. **Downstream field-dependent models** (DFS Value, field boards) can read a
   single `fieldConfidence` to decide whether they may present a finalized
   ranking or must label it provisional.
3. **Admins** get one panel that flags a field that is genuinely _late_
   (deadline passed, still no roster) versus one that is simply _pending_.

---

## The lifecycle

`FieldStatus` places an event on the official-field timeline:

| Status      | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| `awaiting`  | Scheduled event whose official field has not been published yet.   |
| `confirmed` | The official field has been released and imported.                 |
| `live`      | The tournament is in progress; field messaging is retired.         |
| `complete`  | The tournament has finished; the field is archived.                |
| `cancelled` | The event was cancelled.                                           |
| `unknown`   | The lifecycle cannot be placed (e.g. no dates and no field).       |

`FieldConfidence` is the **ceiling** field-dependent models must respect — a
model can never present a field as more final than this:

| Confidence  | Meaning                                                       | Field-dependent models          |
| ----------- | ------------------------------------------------------------- | ------------------------------- |
| `official`  | The released, official field (confirmed / live / complete).   | May present finalized rankings  |
| `awaiting`  | Official field not published; anything shown is provisional.  | Must label output provisional   |
| `unknown`   | Insufficient information (cancelled, or no dates).            | Must not present a field        |

### `awaiting` vs the Context Engine's `timing`

These are orthogonal, and that is the point. A `timing: UPCOMING` event can be
either `awaiting` (no official field yet) or `confirmed` (field published and
imported). Timing places the event in _time_; field status places it in the
_publication lifecycle_.

---

## The commitment deadline

`computeFieldReleaseTime(startDate)` derives the PGA Tour commitment deadline:
**5:00 PM ET on the Friday before tournament week.** Tournament week is the
Monday–Sunday week containing the start date; the deadline is the Friday of the
_prior_ week.

The math is timezone-correct: 5:00 PM ET is resolved to the exact UTC instant
using the America/New_York offset **at that date**, so it is right in both EDT
(summer, UTC−4) and EST (winter, UTC−5). It is pure and deterministic — the same
start date always yields the same instant — and returns `null`, never a guess,
when the start date is unknown.

---

## Architecture

```
Tournament Context Engine (service.ts)
  └─ passes verified DB facts + now
       ↓
field-status.ts  ·  deriveFieldIntelligence()   ← the ONE pure rule set
       ↓                     ↓
TournamentContextAvailable   (also called directly by the admin service)
  .fieldStatus / .fieldConfidence / .fieldReleaseTime / .fieldPlayerCount
       ↓                                        ↓
tournamentService.getFieldReport()      dataCoverage buildFieldIntelligence()
       ↓                                        ↓
<TournamentFieldBanner>  (public)        <FieldIntelligencePanel>  (admin)
```

- **Pure core** — `lib/tournament-context/field-status.ts`. No I/O. Takes facts
  + injectable `now`, returns a fully-shaped `FieldIntelligence`. Total: never
  throws, always returns every field.
- **Context integration** — the normalizer attaches the lifecycle to every
  available context, so any consumer of the Context Engine gets it for free.
- **Public consumer** — `tournamentService.getFieldReport()` composes the
  lifecycle with roster-import timestamps (`getFieldSyncStats`) for the
  Tournament Page banner. An `unavailable` context yields an
  `unknown`/`unknown` report, never a fabricated one.
- **Admin consumer** — the Data Coverage service's `buildFieldIntelligence()`
  runs the _same_ pure rules over every upcoming/live event and flags `overdue`
  rows (deadline passed, no roster imported).

---

## Honesty guarantees

- An upcoming event with no roster is `awaiting`, never an error or a fake list.
- `fieldPlayerCount` stays `null` until a field is genuinely confirmed — a count
  present in the input is suppressed while `fieldConfirmed` is false.
- `fieldReleaseTime` is `null` when the start date is unknown — the deadline is
  never approximated.
- `expectedPlayers` in the admin panel is the **prior edition's** real field
  size, or `null` when there is no prior edition — never an invented target.
- `overdue` fires only when a real deadline has demonstrably passed with no
  import, so it is an actionable signal rather than noise.

---

## Consumers

| Surface                     | Reads                                             |
| --------------------------- | ------------------------------------------------- |
| Tournament Page banner      | `tournamentService.getFieldReport()`              |
| Admin Data Coverage panel   | `DataCoverageReport.fieldIntelligence`            |
| Field-dependent models      | `TournamentContextAvailable.fieldConfidence`      |

Shared presentation lives in `features/tournaments/components/field-lifecycle-badge.tsx`
and the label/tone/deadline formatters in `features/tournaments/utils/format.ts`,
so the public banner and the admin panel render identical chips.

---

## Testing

`lib/tournament-context/__tests__/field-status.test.ts` covers the deadline math
(EDT and EST correctness, always-a-Friday, determinism), the full lifecycle
matrix (awaiting / confirmed / live / complete / cancelled / unknown), and the
honesty guards (no count before confirmation, null release time without a start
date, and totality across an input matrix).
