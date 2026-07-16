# CaddieIQ Data Integrity Audit

> **Status:** Living document. Findings recorded from live end-to-end pipeline
> runs against the configured providers on 2026-07-16. Re-run the importers and
> re-read the admin **Data Coverage** dashboard (which now reads real run
> history) after any tier/key change and update the tables below.

This is the companion to the [Data Catalog](./DATA_CATALOG.md). The catalog
records *what data is available*; this document records *what actually happened
when we ran every pipeline*, the honesty guarantees each one makes, and the
audit-trail infrastructure that keeps the diagnostics dashboard truthful.

The governing rule, inherited from the catalog: **we never surface a fabricated
value as if it were real.** A feed that is empty, unavailable, or scrambled is
reported as such — never padded with an estimate, a zero dressed up as a
success, or a stale `updatedAt` masquerading as a fresh import.

---

## 1. Import-run history — the honest audit trail

### The problem it replaces

The Data Coverage dashboard used to infer "last import" from each table's
`max(updatedAt)`. That proxy cannot tell:

- a **successful** run from one that fetched **zero rows**,
- a run that **failed** from one that simply hasn't happened,
- how many rows were inserted / updated / skipped / failed, or
- **why** a feed is degraded.

### The fix

A durable, append-only [`import_runs`](../prisma/schema.prisma) table records
**one immutable row per pipeline execution** — including runs that throw.

- **Schema:** `ImportRun` model + `ImportRunStatus` enum (`SUCCESS` / `PARTIAL`
  / `FAILURE`), migration `20260715190000_import_run_history`.
- **Write seam:** every top-level `runXImport()` in
  [`lib/imports/index.ts`](../lib/imports/index.ts) wraps its work in
  `recordImportRun()` ([`lib/imports/run-recorder.ts`](../lib/imports/run-recorder.ts)),
  passing a small `normalize()` that projects its bespoke summary onto common
  counters. The recorder times the run, classifies status, and persists exactly
  one row — writing a `FAILURE` row and re-throwing if the work throws.
- **Read seam:** [`ImportRunRepository`](../lib/repositories/import-run-repository.ts)
  exposes `latestPerEntity()` (one current row per pipeline via `DISTINCT ON`).
- **Surface:** the dashboard's **Import Run History** card
  ([`features/admin/data-coverage/health-panel.tsx`](../features/admin/data-coverage/health-panel.tsx))
  renders each pipeline's real outcome, timestamp, duration, and error/summary.

### Status classification (the honesty rule)

`deriveStatus()` is the load-bearing logic (unit-tested in
`lib/imports/__tests__/run-recorder.test.ts`):

| Condition | Status |
|---|---|
| No failures | `SUCCESS` |
| Failures **and** some successes | `PARTIAL` |
| Failures **and** nothing succeeded | `FAILURE` |
| Knowingly-degraded feed (forced) | `PARTIAL` |

A pipeline may **force** `PARTIAL` when it is degraded for a reason that is not a
per-row failure — e.g. a trial-tier feed whose values scramble, or a run that
could not fetch every requested season. Crucially, a run **only carries an
`error`** when something genuinely failed or the feed is degraded: a run is never
`SUCCESS`-with-an-error, and a legitimately empty result (e.g. a course with no
confident geolocation match) is a clean success, not an error.

---

## 2. Pipeline-by-pipeline findings (2026-07-16)

Runs executed against the configured trial-tier SportsDataIO key, The Odds API,
OpenWeather, and OSM Nominatim. Fidelity legend: 🟢 real & usable · 🟡 real but
sparse · 🟠 degraded by provider tier · ⚪ starved (blocked on prerequisite).

| Pipeline | Result | Status | Finding |
|---|---|---|---|
| Player Statistics | 🟡 | `PARTIAL` | Season **2025** imports cleanly and populates `worldRanking` for **977** players. Seasons 2022–2024 return **HTTP 401** on the trial key, so the run is honestly PARTIAL. |
| Tournament Fields | 🟢 | `SUCCESS` | 32/43 upcoming events have a field; **3,855** entries synced. **~60** entries fail to match the player catalog due to name variants (e.g. "Scott Scheffler" vs "Scottie Scheffler", "Matthew" vs "Matt Fitzpatrick") — a real data-quality finding, tracked as `skipped`. |
| Odds | 🟢 | `SUCCESS` | **956** real bookmaker quotes across **5** books; **865** quotes linked to players, events linked to tournaments. The Odds API is fully live. |
| Fantasy / DFS | 🟠 | `PARTIAL` | DraftKings **salaries are real** (**2,160** rows, fully synced). Projections **404 on the trial tier** and are reported unavailable — never fabricated from salary. |
| Betting (SportsDataIO) | 🟠 | `PARTIAL` | The betting endpoint **404s** on the trial key; structure imports but no real odds. (Live odds come from The Odds API above, not this feed.) |
| News | 🟡 | `SUCCESS` | **2** real articles, both correctly player-linked. Sparse but genuine. |
| Course Geolocation | 🟢 | `SUCCESS` | Nominatim verifies real course coordinates (verified count grows per run). Courses with no confident golf-course match stay **UNKNOWN** and are skipped — never approximated. |
| Weather | ⚪ | `SUCCESS` (0 rows) | Starved: upcoming events currently lack a host course with **verified** coordinates, so there is nothing to fetch. Unblocks automatically as geolocation coverage grows. Honestly reports 0 snapshots rather than inventing a forecast. |
| Players / Courses / Tournaments | — | recorded on next run | Catalog importers; report real `ImportResult` counters (quality-scored) through the same recorder. |

**Net:** the four feeds the prior snapshot believed were empty — DFS salaries and
odds — are in fact **real and populated**. The genuinely constrained feeds
(prior-season stats, DFS projections, SportsDataIO betting) are trial-tier
limits, now reported as `PARTIAL` with the exact provider error, not hidden.

---

## 3. Rankings architecture (and the `player_rankings` removal)

The audit found a duplicated ranking store. The authoritative picture:

- **Official World Golf Ranking (OWGR)** is imported by the **statistics
  pipeline** onto `player_season_statistics.worldRanking`. This is the single
  source of truth for a player's world rank. The player directory sort and the
  player-detail OWGR panel both read the newest season that carries a rank.
- **The CaddieIQ composite rank** is **derived on demand** by the Ranking Engine
  (`lib/rankings`) from live signals — it is intentionally **not** persisted, so
  it can never drift from the model.
- **DataGolf** has no import feeding a persisted panel; it is represented with a
  null rank until a feed exists (never a fabricated number).

The former `player_rankings` table (`PlayerRanking` model + `RankingSystem`
enum) was written by **no importer**. It only ever held stale seed rows while the
real OWGR lived in season statistics and the composite was derived live — pure
duplication that made the ranking story ambiguous. It was **removed** in
migration `20260715190000_import_run_history`, and its two readers (the
player-repository search sort and the player-mapper rankings panel) were
repointed to the authoritative `worldRanking`. No real data was lost.

---

## 4. Honesty guarantees (invariants)

1. **No fabricated values.** Scrambled, unavailable, or empty feeds are reported
   as such; nothing is estimated or padded. (See the Data Catalog sentinel
   rules.)
2. **Status matches reality.** `SUCCESS` means every persistable record
   persisted; `PARTIAL` means a real degradation (failures or a knowingly-limited
   feed); `FAILURE` means the run could not complete. A run never claims
   `SUCCESS` while carrying an error.
3. **Never-run is not zero-success.** A pipeline with no recorded run shows
   "Never run", not a misleading 0-row success.
4. **History never breaks imports.** Recording is best-effort: if writing the
   audit row fails, the error is logged and the real import result is still
   returned.
5. **One source of truth per fact.** OWGR lives in season statistics; the
   composite is derived live; there is no second, unwritten ranking table.

---

## 5. Verifying / refreshing

Import pipelines are server-only. Trigger them through the app's import API
routes (auth-gated) or, for a local audit, run the exported `runXImport()`
functions with the `react-server` condition so the `server-only` guard resolves
to its stub. After a run, open **/admin/data-coverage** → **Import Run History**
to read the recorded outcome for every pipeline.

See also: [DATA_CATALOG.md](./DATA_CATALOG.md),
[TOURNAMENT_FIELD_INTELLIGENCE.md](./TOURNAMENT_FIELD_INTELLIGENCE.md),
[ARCHITECTURE.md](./ARCHITECTURE.md).
