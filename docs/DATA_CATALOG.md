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
| `PlayerSeasonStats/{season}` | 🟢 | **`WorldGolfRank`**, **`WorldGolfRankLastWeek`**, `Events` | `player_season_statistics` (`worldRanking`, `worldRankingLastWeek`, `events`) | `AveragePoints`/`TotalPoints` are **OWGR ranking points**, not DraftKings fantasy points (see §4). |
| `News` / `NewsByDate/{date}` | 🟢 | `NewsID`, `Title`, `Content`, `Url`, `Source`, `Updated`, `PlayerID`, `TeamID` | *new* `news_articles` | Real editorial content. Player/tournament association via IDs. |
| `NewsByPlayerID/{id}` | 🟢 | same as News, filtered | *new* `news_articles` | Powers per-player news on the Player Page. |
| `Tournaments/{season}` / `Schedule` | 🟢 | `TournamentID`, `Name`, `StartDate`, `EndDate`, `Venue`, `Purse`, `OddsCoverage` | `tournaments` | `OddsCoverage` tells us whether betting is *entitled* for that event. |
| `DfsSlatesByTournament/{id}` | 🟡 | `Salary`, `OperatorPlayerName`, `SlateID`, operator | *new* `dfs_salaries` | Salaries are real; present only for slated (upcoming/recent) events. |
| `PlayerTournamentProjectionStats/{id}` | 🔴 | envelope real; `FantasyPoints*`, per-stat projections scrambled | *new* `fantasy_projections` | Pipeline built; values hidden until production tier. |
| `BettingEvents…` / `v3/golf/odds` | 🔴 | `BettingEventID`, structure real; `BettingMarkets[].BettingBetType`, outcomes scrambled | *new* `betting_events`, `betting_markets`, `betting_outcomes` | Pipeline built; markets hidden until production tier. |
| `Leaderboard/{id}` | 🟡 | `Rank`, `TotalScore`, round scores | `player_rounds` / `tournament_fields` | Populated only for in-progress/completed events in-season. |
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
| Course Fit / Wind | course + weather data | ⚪ no | course characteristics + weather ingestion |

**Bottom line:** OWGR-based signals and all content/media (images, news) are
production-ready today. Fantasy and betting are *fully plumbed but value-gated*
behind a production key. SG, multi-season, and course/weather remain data-blocked.

---

## 6. Re-running discovery

```bash
node --env-file-if-exists=/vercel/share/.env.project scripts/discover-sportsdataio.mjs
```

The probe never prints the API key. It reports, per endpoint: HTTP status,
payload shape, top-level field names, and a scramble-sentinel check. Update §2
whenever fidelity changes (e.g. after a tier upgrade).
