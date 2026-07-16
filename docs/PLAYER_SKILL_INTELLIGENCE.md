# Player Skill Intelligence Engine

The **single authoritative source** of a player's golf ability:

> _"How good is this player at each part of the game, how confident are we, and
> how does the field compare?"_

It is the fifth **Signal Family**, sitting alongside Weather, Odds, Course
Intelligence, and Player Data. Every skill number anywhere in the product — the
Player Page skill card, the Tournament Page skill leaderboards, and the skill
inputs the **Course Fit** model consumes — is produced here and nowhere else, so
no two surfaces can disagree about how good a player is or how sure we are.

It follows the platform's governing rule (see [MODELS.md](./MODELS.md)):
**never fabricate ability.** With no imported round statistics — or with rounds
that carry no strokes-gained values (e.g. SG not entitled on the current
provider tier) — the engine returns an explicit `unavailable` profile with every
skill Unknown and a machine-readable reason. It never invents a rating.

---

## Why it exists

Skill ratings are the easiest signal to fake — a plausible "Elite Iron Play,
92nd percentile" reads as authoritative whether or not a single round backs it.
Before this engine, skill logic was scattered: Course Fit carried its own
placeholder `PlayerSkillProfile`, and no surface could rank the field. The engine
exists to make ability a **first-class, verifiable Signal Family** with the same
discipline as the others:

1. **One profile, one confidence.** The player card, the field leaderboards, and
   Course Fit all read the same normalized profile graded by a single pure
   function. They cannot drift apart.
2. **Honest degradation.** Every rating is nullable end to end — a skill with no
   source data reads "Unknown", not `0` or "Average". A thin, stale, or
   unrankable profile lowers confidence rather than masquerading as certainty.
3. **No duplicated skill logic.** Course Fit no longer re-derives skill; it reads
   this family through a single adapter. New consumers (DFS Value, matchup edges)
   do the same instead of touching raw statistics.

---

## The intelligence object

```ts
type PlayerSkillProfile = {
  playerId: string
  status: "available" | "unavailable"
  confidence: SkillConfidence            // none | low | medium | high
  season: number | null                  // season ratings were normalized against
  sampleSize: number                     // rounds analysed
  freshness: SkillFreshness              // last round + age in days
  coverage: SkillCoverage                // known / sourceable / total
  skills: SkillSignal[]                  // all 15 skills, display order (unknowns = null)
  strengths / weaknesses / eliteSkills / …: SkillKey[]
  trend: SkillTrendDirection             // improving | stable | declining | unknown
  explanations: SkillExplanation[]       // AI-ready, rated skills only
  gaps: SkillGap[]                       // machine-readable reasons
  detail: string                         // plain-English, safe to render
}
```

An **available** profile carries ratings derived from verified round statistics
only, each normalized to a field-relative 0–100 score, a seven-level band, and an
AI-ready label. An **unavailable** profile carries `gaps` and a `detail` string
that is safe to show directly.

### The fifteen skills

Twelve are **sourceable** today (strokes-gained off-the-tee / approach /
around-the-green / putting / tee-to-green, driving distance & accuracy, GIR,
scrambling, sand save, birdie %, bogey avoidance). Three — par-3/4/5 scoring —
are **non-sourceable**: no provider field carries a per-par breakdown, so they
are always emitted Unknown with a `no-provider-field` gap and are **excluded from
the confidence coverage denominator** (they can never be "missing data" because
they were never sourceable). This is why a fully-rated player reads 12/12, not
12/15.

### Confidence is the ceiling

`confidence` is the most important field: it is the **maximum certainty any
consumer may present**. It is derived by one pure function (`gradeProfileConfidence`)
from three axes — **coverage** (share of sourceable skills actually rated),
**sample volume** (rounds analysed), and **freshness** (recency of the last
round). A profile with no rated skills or no rounds is `none`; thin/stale
coverage is `low`; only full, deep, fresh coverage reaches `high`.

Per skill, `gradeSkillConfidence` is `none` with no samples and — critically —
`low` when the skill could not be ranked against a sufficient field population,
even if the player has many rounds. **A raw value without a real population to
rank against is never dressed up as a percentile.**

---

## Normalization

A raw aggregate becomes a rating only by ranking it against the **platform
population** — the sorted-ascending array of every player's raw aggregate for
that skill:

- **Direction-aware percentile** (`percentileOf`) — higher-is-better skills rank
  ascending; lower-is-better skills (par scoring) invert. Ties land on the
  midpoint, never the floor or ceiling.
- **Minimum population** (`MIN_POPULATION = 5`) — a skill with fewer than five
  ranked players in the population returns `null`: the raw value is shown, but no
  percentile, band, or rating is asserted.
- **Seven bands** (`scoreToBand`) — Elite / Excellent / Above average / Average /
  Below average / Poor / Very poor, driving both the color and the AI adjective
  ("Elite Iron Player", "Weak Driver Accuracy").

Raw aggregation itself (`aggregateRawSkills`) is faithful, not lazy: strokes-
gained categories are averaged; percentages that derive from made/possible
(driving accuracy, GIR) are **pooled** (Σ made ÷ Σ possible) rather than
averaging per-round percentages of differing hole counts; tee-to-green is summed
**per round** so it only counts rounds where all three components exist. A skill
is produced only when its inputs are present — never zero-filled.

---

## Architecture

```
Player Page ─ fetchPlayerSkillProfile(playerId)      Tournament Page ─ tournamentService.getSkillLeaderboards(id)
        │  (server action)                                    │  (React cache, per request)
        ▼                                                     ▼
 getPlayerSkillIntelligenceService()  server-only  ◄──────────┘
        │  loads the player's samples + the platform population
        ▼
 PlayerSkillRepository (Prisma)  ── round_statistics → player_rounds → tournament_fields / rounds
        │
        ▼
 buildPlayerSkillProfile()  ← PURE: aggregate → rank → band → trend → confidence.
        │                       No I/O. Deterministic (inject `now`). Unit-tested.
        ▼
 PlayerSkillProfile  ─┬─►  Player Page skill card
                      ├─►  buildSkillLeaderboards()  ─►  Tournament Page
                      └─►  toCourseFitSkillProfile()  ─►  Course Fit model
```

- **`lib/player-skill-intelligence/`** — the pure engine. `catalog.ts` (the
  fifteen skill definitions + raw aggregation — the single source of "what a
  skill is"), `normalize.ts` (percentile, bands, labels, trend, confidence),
  `profile.ts` (assembly, leaderboards, the Course Fit adapter), `types.ts`. No
  I/O; safe to import anywhere.
- **`lib/player-skill-intelligence/service.ts`** — `server-only`. Loads a
  player's (or a field's) samples and the platform population, feeds the pure
  core, returns profiles / leaderboards / Course-Fit-shaped profiles.
- **`lib/repositories/player-skill-repository.ts`** — the only skill DB access:
  reads round statistics up the `player_rounds → tournament_fields / rounds`
  chain, builds the population in one pass, and reports coverage counters.

### Data model

The engine is a **pure consumer of existing tables** — it adds none. It reads
`round_statistics` (per-round strokes-gained and counting stats) joined through
`player_rounds` to the player (via `tournament_fields`) and the season (via
`rounds`). Every statistic column is nullable, so a rating is produced only from
values the provider actually supplied. When `round_statistics` is empty — the
current state, since SG is not entitled on the trial tier — every profile is
honestly `unavailable`.

---

## Consumers

### Player Page — Skill Profile card

`fetchPlayerSkillProfile(playerId)` resolves the profile; `PlayerSkillCard`
renders it in the Analytics tab:

- **`unavailable`** → a labelled empty state explaining *why* ("No verified round
  statistics captured yet…") — no ratings drawn.
- **available, thin** → the rated skills render with their bands, raw values in
  native units, and rating meters; unrated skills are grouped under "Not yet
  measured"; the confidence badge and `N of M skills rated` meta stay honest.

### Tournament Page — Skill Intelligence leaderboards

`tournamentService.getSkillLeaderboards(id)` normalizes the field's entrants
against the platform population and ranks them into six boards — Best Iron
Players, Best Putters, Best Scramblers, Longest Drivers, Most Accurate Drivers,
and Highest Confidence. Boards stay **empty rather than padded** when no entrant
has data for a skill.

### Course Fit model

`toCourseFitSkillProfile()` projects the rich profile onto the five Course Fit
families (`driving`, `approach`, `shortGame`, `putting`, `scrambling`), each
backed by its single most representative sourced skill. Course Fit reads these
normalized 0–100 scores instead of deriving skill itself; Unknown skills map to
`null`, which Course Fit already treats as "no signal". The board lights up
automatically the moment strokes-gained data flows — no further change.

---

## Adding player skill to a new surface

1. Call `fetchPlayerSkillProfile(id)` (or the service's field/Course-Fit
   variants) — do **not** read `round_statistics` or re-aggregate yourself.
2. Gate on `status` / `confidence`; treat `confidence` as your ceiling.
3. On `unavailable` or unrated skills, degrade using `gaps` / `unknownSkills` —
   never fabricate the missing rating.

---

## Honesty guarantees

- Ratings are built from **verified round statistics only**; the pure engine
  never invents a skill value, and never ranks against a population below
  `MIN_POPULATION`.
- Every skill is nullable end to end — an unsourced or unrankable skill reads
  "Unknown", never a default `0` or "Average".
- Non-sourceable par-scoring skills are excluded from the coverage denominator,
  so confidence reflects only what *could* have been measured.
- `unavailable` is a first-class state with machine-readable `gaps`, not an empty
  object a caller might misread as "average across the board".
- Confidence is derived by one pure, tested function from coverage, volume, and
  freshness — so the player card, the leaderboards, and Course Fit all agree on
  one player, one profile, and one confidence.

See also: [MODELS.md](./MODELS.md), [COURSE_INTELLIGENCE.md](./COURSE_INTELLIGENCE.md),
[ODDS_INTELLIGENCE.md](./ODDS_INTELLIGENCE.md),
[WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md),
[DATA_CATALOG.md](./DATA_CATALOG.md).
