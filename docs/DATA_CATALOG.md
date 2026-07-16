# CaddieIQ Data Catalog — SportsDataIO Golf v3

> **Status:** Living document. Generated from live discovery probes against the
> configured SportsDataIO key on 2026-07-15. Re-run `scripts/discover-sportsdataio.mjs`
> after any tier/key change and update the tables below.

This catalog is the source of truth for **what external data is actually
available**, at what fidelity, where it lands in our schema, and which ranking
models each feed unblocks. It exists so we never wire a surface (or weight a
model) against data we cannot ground.

---

## 1. Tier reality check

The configured key is a **trial / evaluation tier**. This has a decisive
consequence: several premium feeds return **structurally valid but obfuscated
payloads** — SportsDataIO calls this "scrambling." The envelope, field names,
and types are exactly as documented, but the *values* are placeholders
(`"Scrambled"` strings in text fields, and nonsense decimals in numeric fields).

**We must never surface scrambled values as if they were real.** Every pipeline
that touches a scramble-prone feed detects the sentinel and treats the record as
*unavailable* rather than displaying a fabricated number. The pipelines are
built in full, so the moment a production key is installed the real values flow
through untouched — no code change required.

### Sentinel detection

| Signal | How scrambling presents | Detection rule |
|---|---|---|
| Text fields | Literal string `"Scrambled"` | `value === 'Scrambled'` |
| Betting odds | `BettingBetType` / `*Description` = `"Scrambled"` | any market descriptor equals `Scrambled` → drop event |
| DFS / fantasy points | Implausible small decimals (e.g. `Birdies: 37.3`, per-event points near 0) | treat tournament-level projection values as unavailable on trial tier |

---

## 2. Feed inventory

Legend for **Fidelity**: 🟢 real & usable now · 🟡 real but sparse/seasonal ·
🔴 scrambled on current tier (pipeline built, values hidden) · ⚪ absent/not entitled.

| Feed (endpoint) | Fidelity | Key real fields | Schema home | Notes |
|---|---|---|---|---|
| `Players` | 🟢 | `PlayerID`, `FirstName`, `LastName`, `Country`, **`PhotoUrl`**, DFS operator IDs | `players` (`headshotUrl`) | Photo URLs are real CDN links, load directly. |
| `PlayerSeasonStats/{season}` | 🟢⚠️ | **`WorldGolfRank`**, **`WorldGolfRankLastWeek`**, `Events` | `player_season_statistics` (`worldRanking`, `worldRankingLastWeek`, `events`) | `AveragePoints`/`TotalPoints` are **OWGR ranking points**, not DraftKings fantasy points (see §4). **⚠️ 2026-07-15 probe: `WorldGolfRank` failed a sanity check on the trial tier** (world #1 Scheffler returned `0`; McIlroy & Fleetwood both returned `1`) — the ranking field appears scrambled on live re-fetch. No superior alternative exists (`Players` feed carries no rank). See §7. |
| `News` / `NewsByDate/{date}` | 🟢 | `NewsID`, `Title`, `Content`, `Url`, `Source`, `Updated`, `PlayerID`, `TeamID` | *new* `news_articles` | Real editorial content. Player/tournament association via IDs. |
| `NewsByPlayerID/{id}` | 🟢 | same as News, filtered | *new* `news_articles` | Powers per-player news on the Player Page. |
| `Tournaments/{season}` / `Schedule` | 🟢 | `TournamentID`, `Name`, `StartDate`, `EndDate`, `Venue`, `Purse`, `OddsCoverage` | `tournaments` | `OddsCoverage` tells us whether betting is *entitled* for that event. |
| `DfsSlatesByTournament/{id}` | 🟢🟡 | `Salary`, `OperatorPlayerName`, `SlateID`, operator | *new* `dfs_salaries` | **Salaries confirmed REAL 2026-07-15** (DraftKings T692: Scheffler $13,300 → field floor ~$5,200, plausibly rank-ordered). Present only for slated (upcoming/recent) events. Additive data — replaces no existing field (see §7). |
| `PlayerTournamentProjectionStats/{id}` | ⚪🔴 | envelope real; `FantasyPoints*`, per-stat projections scrambled | *new* `fantasy_projections` | Pipeline built. **2026-07-15 probe: HTTP 404 at `/golf/v2/projections/json/…` on the trial tier — not entitled/usable now** (see §7). Even when live, projections are estimates, not a superior source for *actual* production (§4). |
| `BettingEvents…` / `v3/golf/odds` | ⚪🔴 | `BettingEventID`, structure real; `BettingMarkets[].BettingBetType`, outcomes scrambled | *new* `betting_events`, `betting_markets`, `betting_outcomes` | Pipeline built. **2026-07-15 probe: HTTP 404 at `/golf/v2/odds/json/BettingEventsByDate/{date}` on the trial tier — not entitled/usable now** (see §7). |
| `Leaderboard/{id}` | 🟡 | `Rank`, `TotalScore`, round scores | `player_rounds` / `tournament_fields` | Populated only for in-progress/completed events in-season. |
| **OpenWeather** `forecast` (external — *not* SportsDataIO) | 🟢 | `dt`, `main.temp/feels_like/humidity/pressure`, `wind.speed/gust/deg`, `pop`, `rain.3h`, `clouds.all`, `visibility`, `weather[].id/main`, `city.coord/timezone` | *new* `weather_snapshots`, `weather_periods` | Powers the **Weather Intelligence Engine** ([WEATHER_INTELLIGENCE.md](./WEATHER_INTELLIGENCE.md)). Fetched per tournament by its linked host-course coordinates; ~5-day / 3-hour horizon. Requires `OPENWEATHER_API_KEY` — absent key ⇒ surface reports `unavailable`, never stub data. Every period column is nullable; an absent field reads as "no signal", never `0`. Additive; replaces no SportsDataIO field. |
| **OpenStreetMap Nominatim** `search` (external — *not* SportsDataIO) | 🟢 | `lat`, `lon`, `category`/`class`/`addresstype`, `type`, `display_name` | `courses.latitude/longitude` + provenance (`coordinateConfidence`, `coordinateSource`, `coordinatesVerifiedAt`) | Powers the **Course Geolocation Engine** ([COURSE_GEOLOCATION.md](./COURSE_GEOLOCATION.md)). Zero-config (no key). A course is stored `VERIFIED` **only** when a result is an actual `leisure=golf_course` feature — clubhouse/restaurant POIs and locality centroids are rejected and left `UNKNOWN`. Swappable via the `GeocodingProvider` interface. Coordinate is never approximated. |
| DraftKings **fantasy points** (season aggregate) | ⚪ | — | — | Not in season-stats feed at any tier; only per-tournament, and scrambled on trial. |
| Strokes Gained (external) | ⚪ | — | — | Not entitled on this key. Blocks SG-based signals. |
| Multi-season history (pre-2025) | ⚪ | — | — | Only 2025 present. Blocks trend/momentum-over-seasons. |

---

## 3. Surface readiness

What each user-facing surface can show **today** vs. what is gated.

### Player Page
| Element | Status | Source |
|---|---|---|
| Headshot image | 🟢 ready | `Players.PhotoUrl` → `players.headshotUrl` |
| World ranking + weekly movement | 🟢 ready | `PlayerSeasonStats.WorldGolfRank(/LastWeek)` |
| Latest player news | 🟢 ready | `NewsByPlayerID` |
| Fantasy production (season) | 🔴 hidden | scrambled; show "unavailable" |
| Betting to-win odds | 🔴 hidden | scrambled |

### Tournament Hub
| Element | Status | Source |
|---|---|---|
| Tournament + player news | 🟢 ready | `News` (by TournamentID / PlayerID) |
| Field player images | 🟢 ready | `players.headshotUrl` |
| Betting favorites | 🔴 hidden | scrambled; gate on `OddsCoverage` + sentinel |
| DFS salaries | 🟡 partial | `DfsSlatesByTournament` when slated |
| Fantasy projections | 🔴 hidden | scrambled |

> **Graceful absence is mandatory:** every element above renders a neutral
> "not available" state when its feed is scrambled, sparse, or absent — never a
> zero, a dash implying a real zero, or a fabricated value.

---

## 4. Correction carried forward from the fantasy-stats audit

`player_season_statistics.averagePoints` / `.totalPoints` are **Official World
Golf Ranking points**, not DraftKings fantasy points. Evidence: `averagePoints`
is monotonic with `worldRanking` (#1≈3.7 → #5≈1.6), and `totalPoints ÷ averagePoints`
implies a ~60–83 divisor (the OWGR rolling-window), not the 24–41 events played.

**Implication for this integration:** true fantasy production requires the
per-tournament DraftKings feed (scrambled on trial). Until then, "Fantasy" model
inputs must be sourced from OWGR-derived production and clearly labeled — not
presented as DFS scoring.

---

## 5. Model-readiness matrix

Maps the models in `docs/MODELS.md` to the data that unblocks them.

| Model | Needs | Available now? | Blocked on |
|---|---|---|---|
| Overall Rating (external skill family) | OWGR rank + movement | 🟢 yes | — |
| Overall Rating (ball-striking family) | Strokes Gained | ⚪ no | SG entitlement |
| Recent Form | in-season results, rolling | 🟡 partial | richer round-level data |
| Momentum / Trend | multi-season history | ⚪ no | pre-2025 backfill |
| DFS Value | real fantasy points + salaries | 🔴 partial | production tier (salaries real, points scrambled) |
| Betting Value | real odds | 🔴 no | production tier |
| Course Fit | course characteristics + player shot profiles | 🟡 partial | player shot profiles (course model shipped) |
| Course Geolocation | venue name + geocoder | 🟢 **yes** (engine shipped) | — (zero-config OSM Nominatim) |
| Wind / Weather | verified venue coordinates + weather forecast | 🟢 **yes** (engine shipped) | `OPENWEATHER_API_KEY` (coordinates now supplied by Course Geolocation) |

**Bottom line:** OWGR-based signals and all content/media (images, news) are
production-ready today. **Course geolocation and Weather/Wind are now ingested** —
the Course Geolocation Engine verifies venue coordinates (zero-config) and the
Weather Intelligence Engine turns them into honest
`verified / partial / unavailable` conditions once `OPENWEATHER_API_KEY` is set.
Fantasy and betting are *fully plumbed but value-gated* behind a production key.
SG and multi-season history remain data-blocked.

---

## 6. Re-running discovery

```bash
node --env-file-if-exists=/vercel/share/.env.project scripts/discover-sportsdataio.mjs
```

The probe never prints the API key. It reports, per endpoint: HTTP status,
payload shape, top-level field names, and a scramble-sentinel check. Update §2
whenever fidelity changes (e.g. after a tier upgrade).

---

## 7. Source superiority evaluation & migration log

**Policy.** Whenever a feed is enabled or a tier/key changes, we evaluate every
newly available feed against the fields already imported. If a new feed exposes
**more accurate** data for an existing field, we migrate the platform to it and
preserve backward compatibility where practical (keep the column, re-point the
importer, keep reads stable). Every replacement — and every deliberate
non-replacement — is logged here with its evidence. We never migrate to a feed
that is unavailable, scrambled, or otherwise *less* accurate than what we have;
doing so would regress real data behind a sentinel and violate the no-fabrication
rule this catalog exists to enforce.

### Evaluation — 2026-07-15 (betting + fantasy/DFS pipelines enabled)

Live probes against the configured trial key (`api.sportsdata.io/golf/v2`),
comparing each newly enabled feed to the field it could plausibly supersede:

| Newly enabled feed | Live result | Could it replace an existing field? | Verdict |
|---|---|---|---|
| `PlayerTournamentProjectionStats/{id}` (fantasy projections) | **HTTP 404** — not entitled on trial | Candidate for "fantasy statistics". But it is (a) unavailable, and (b) *projected* points, not the *actual* season production already imported from `PlayerSeasonStats`. | **No migration.** Not more accurate — not even available. |
| `BettingEventsByDate/{date}` (odds) | **HTTP 404** — not entitled on trial | No existing odds field; would only *add* data. | **No migration.** Unavailable; additive when live. |
| `DfsSlatesByTournament/{id}` (DFS salaries) | **REAL** — DraftKings T692: Scheffler $13,300 → floor ~$5,200, rank-plausible | No existing salary field; purely additive. | **No migration** (nothing to replace). Retained as new `dfs_salaries` data. |

**Cross-check on the field the directive named ("fantasy statistics").**
`player_season_statistics.averagePoints/.totalPoints` remain the best available
source: `PlayerSeasonStats` returned real, plausible actuals on this probe
(Scheffler: 27 events, 10.4 avg, 438.4 total). The projections feed — the only
plausible "superior" fantasy source — is 404 on this tier and, by definition,
measures projected rather than actual output. Per §4 these values are OWGR
points and must stay labeled as such; no fantasy-stats migration is possible or
desirable today.

**Incidental accuracy finding (not a migration — logged for transparency).**
On this probe `PlayerSeasonStats.WorldGolfRank` failed a sanity check (world #1
Scheffler = `0`; McIlroy and Fleetwood both = `1`), i.e. the *ranking* field
reads scrambled on live re-fetch, even though the fantasy/`Events` fields in the
same payload are real. There is **no superior source to migrate to** — the
`Players` feed exposes no ranking column at all. Action: none taken (no better
source exists); ranking reads continue to serve the last good imported values,
and imports must keep applying the sentinel/sanity gate so a scrambled `0`/tie
never overwrites a real rank. Re-evaluate when a production key lands.

**Net result: 0 replacements.** No newly enabled feed is more accurate than a
currently-imported field. All pipelines remain built-and-gated per §1.

### Trigger conditions for a future migration

Re-run this evaluation (and migrate + log here) when any of these become true:

- A **production key** makes `PlayerTournamentProjectionStats` or the odds feeds
  return real values — then wire *projections* as new inputs (still not a
  replacement for actual production), and expose odds.
- A feed begins returning a **real per-tournament DraftKings fantasy-points**
  actual (not projection) — this *would* supersede the OWGR-points stand-in for
  the "Fantasy Production" model input; migrate `fantasy_projections`/a new
  actuals table in and re-point the analytics `SeasonStatSample.averagePoints`
  source, keeping the OWGR column for backward compatibility.
- `PlayerSeasonStats.WorldGolfRank` returns **consistently sane** rankings again
  (unique, #1 == 1), confirming the trial scramble has lifted.
