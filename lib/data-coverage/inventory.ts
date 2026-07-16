import type {
  PlatformInventory,
  PlatformInventoryEntry,
  PlatformInventorySummary,
  TableHealth,
  TableOwner,
} from "./types"

/**
 * The static classification of every database table — the single source of
 * truth behind both docs/PLATFORM_DATA_INVENTORY.md and the admin dashboard's
 * Platform Inventory section.
 *
 * Each entry encodes DESIGNED intent (purpose, owner, what feeds it, and what
 * its row count SHOULD be). The live health verdict is then derived by
 * reconciling that intent with the real row count via {@link classifyTable} —
 * nothing here is guessed, and the emptiness of every empty table has an
 * explicit, documented reason.
 *
 * `emptyBucket` is the health a table reports WHEN IT IS EMPTY:
 * - "broken"           → it should already hold data (an owning pipeline is failing).
 * - "waiting"          → legitimately empty until app usage / a dependency fills it.
 * - "future"           → schema reserved for an unbuilt sprint (no writer exists yet).
 * - "provider-limited" → blocked by the current provider tier.
 * A non-empty table is always "healthy" (unless explicitly `obsolete`).
 */
interface RegistryEntry {
  table: string
  label: string
  purpose: string
  owner: TableOwner
  populationMethod: string
  dependencies: string[]
  expectedState: string
  /** Health to report when the table is empty. */
  emptyBucket: Exclude<TableHealth, "healthy" | "obsolete">
  /** Reason shown when the table is empty (documents WHY empty is correct/not). */
  emptyReason: string
  /** Optional caveat appended when the table DOES hold data (e.g. "sparse"). */
  populatedNote?: string
  /** When true, the table is obsolete regardless of row count. */
  obsolete?: boolean
  /** Reason shown when the table is obsolete. */
  obsoleteReason?: string
}

/**
 * All 31 tables, grouped by owner for readability. Order here is the order the
 * dashboard and doc present them.
 */
const REGISTRY: readonly RegistryEntry[] = [
  // ---- Application & Auth (System / Application) -------------------------
  {
    table: "users",
    label: "Users",
    purpose: "Account identity and role (admin vs. member) for every person using CaddieIQ.",
    owner: "Application",
    populationMethod: "Better Auth email + password sign-up.",
    dependencies: [],
    expectedState: "At least one row (the admin) once the app is in use.",
    emptyBucket: "waiting",
    emptyReason: "Fills as people sign up; empty only before the first account exists.",
  },
  {
    table: "profiles",
    label: "Profiles",
    purpose: "Extended, app-specific user preferences layered on top of the auth account.",
    owner: "Application",
    populationMethod: "Written by the app when a user completes their profile.",
    dependencies: ["users"],
    expectedState: "One row per user who has completed onboarding.",
    emptyBucket: "waiting",
    emptyReason: "No user has completed a profile yet; created on demand through normal app usage.",
  },
  {
    table: "subscriptions",
    label: "Subscriptions",
    purpose: "Billing tier and entitlement state per user.",
    owner: "Application",
    populationMethod: "Written when billing is wired to a payment provider.",
    dependencies: ["users"],
    expectedState: "Empty until billing is enabled; then one row per paying user.",
    emptyBucket: "future",
    emptyReason: "Billing is not yet wired up (no payment provider integration in this sprint).",
  },
  {
    table: "sessions",
    label: "Auth Sessions",
    purpose: "Active login sessions issued by Better Auth.",
    owner: "System",
    populationMethod: "Better Auth on login; expired rows are pruned.",
    dependencies: ["users"],
    expectedState: "One row per active login; naturally fluctuates.",
    emptyBucket: "waiting",
    emptyReason: "Ephemeral — empty when no one is logged in.",
  },
  {
    table: "accounts",
    label: "Auth Accounts",
    purpose: "Credential/provider records backing each user (password hash, OAuth links).",
    owner: "System",
    populationMethod: "Better Auth on sign-up.",
    dependencies: ["users"],
    expectedState: "One row per user credential.",
    emptyBucket: "waiting",
    emptyReason: "Fills alongside users; empty only before the first sign-up.",
  },
  {
    table: "verifications",
    label: "Auth Verifications",
    purpose: "Short-lived email/verification tokens issued by Better Auth.",
    owner: "System",
    populationMethod: "Better Auth during verification flows; consumed then deleted.",
    dependencies: ["users"],
    expectedState: "Transient — usually empty between verification flows.",
    emptyBucket: "waiting",
    emptyReason: "Ephemeral tokens; empty is the normal resting state.",
  },

  // ---- Reference (System) ------------------------------------------------
  {
    table: "tours",
    label: "Tours",
    purpose: "The professional tours (PGA, DP World) every tournament and player hangs off.",
    owner: "System",
    populationMethod: "Reference data established during import bootstrap.",
    dependencies: [],
    expectedState: "A small fixed set (one row per supported tour).",
    emptyBucket: "broken",
    emptyReason: "Core reference data — tournaments and players cannot resolve their tour without it.",
  },
  {
    table: "seasons",
    label: "Seasons",
    purpose: "Per-tour, per-year season records used to group tournaments and memberships.",
    owner: "System",
    populationMethod: "Intended to be seeded per tour/year; the tournament importer links to a season only when one already exists (it never fabricates them).",
    dependencies: ["tours"],
    expectedState: "One row per tour per active year.",
    emptyBucket: "waiting",
    emptyReason:
      "No season-seeding step exists yet, so rows are absent. Tournaments still import correctly because their season link is optional; adding a small season seed is a documented follow-up, not a failure.",
  },
  {
    table: "nationalities",
    label: "Nationalities",
    purpose: "Canonical country records players are linked to for the nationality filter.",
    owner: "SportsDataIO",
    populationMethod: "Derived and linked during the player import.",
    dependencies: ["players"],
    expectedState: "One row per distinct country referenced by an imported player.",
    emptyBucket: "broken",
    emptyReason: "Should be populated by the player import; empty would mean the player pipeline never ran.",
  },

  // ---- Player domain (SportsDataIO) --------------------------------------
  {
    table: "players",
    label: "Players",
    purpose: "The player universe — every professional golfer tracked by the platform.",
    owner: "SportsDataIO",
    populationMethod: "Player import (SportsDataIO players endpoint).",
    dependencies: [],
    expectedState: "Thousands of rows covering the tracked tours.",
    emptyBucket: "broken",
    emptyReason: "The foundational entity; emptiness would mean the player import never ran.",
  },
  {
    table: "player_tour_histories",
    label: "Player Tour Histories",
    purpose: "Which tour(s) a player is/was a member of, and when.",
    owner: "SportsDataIO",
    populationMethod: "Written during the player import when tour membership is resolvable.",
    dependencies: ["players", "tours", "seasons"],
    expectedState: "One or more membership rows for players with resolvable tour history.",
    emptyBucket: "waiting",
    emptyReason: "Populated only where the provider exposes membership; currently sparse.",
    populatedNote:
      "Sparse relative to the player count — only memberships the provider exposed on the trial tier are linked.",
  },
  {
    table: "player_season_statistics",
    label: "Player Season Statistics",
    purpose: "Season-level performance metrics per player, and the authoritative Official World Golf Ranking (worldRanking).",
    owner: "SportsDataIO",
    populationMethod: "Statistics import (SportsDataIO player-season-stats endpoint).",
    dependencies: ["players"],
    expectedState: "One row per player per accessible season.",
    emptyBucket: "broken",
    emptyReason: "Should hold the current season; emptiness would mean the statistics pipeline failed.",
    populatedNote:
      "Current season is real and complete. Prior seasons are provider-limited — the trial-tier key returns HTTP 401 for them.",
  },
  {
    table: "news_articles",
    label: "News Articles",
    purpose: "Player and general golf news headlines for context surfaces.",
    owner: "SportsDataIO",
    populationMethod: "News import (SportsDataIO news endpoint).",
    dependencies: ["players"],
    expectedState: "A rolling set of recent articles.",
    emptyBucket: "waiting",
    emptyReason: "Fills as news is published/imported.",
    populatedNote: "Sparse — the trial-tier news feed returns very few articles.",
  },

  // ---- Course domain (SportsDataIO + enrichment) -------------------------
  {
    table: "courses",
    label: "Courses",
    purpose: "Course profiles (name, location, par, coordinates) used by tournaments and weather.",
    owner: "SportsDataIO",
    populationMethod: "Course import (SportsDataIO), enriched with coordinates by the two-tier geolocation pipeline (OSM course-precise, OpenWeather city-level fallback).",
    dependencies: [],
    expectedState: "Hundreds of rows; coordinates in two tiers (VERIFIED course-precise, APPROXIMATE city-level).",
    emptyBucket: "broken",
    emptyReason: "Core reference; emptiness would mean the course import never ran.",
    populatedNote:
      "Coordinates come in two tiers: VERIFIED (course-precise, from OSM) and APPROXIMATE (city-level, from OpenWeather). Both unlock weather; only VERIFIED is course-precise. The geolocation pipeline improves the mix incrementally.",
  },
  {
    table: "course_characteristics",
    label: "Course Characteristics",
    purpose: "Rich course-fit attributes (grass, green speed, shot-value importances) consumed by the Course Fit / Course Intelligence model.",
    owner: "Manual Enrichment",
    populationMethod: "Manual/enrichment authoring — no automated importer feeds this.",
    dependencies: ["courses"],
    expectedState: "Empty until the course-enrichment workflow is built.",
    emptyBucket: "future",
    emptyReason: "No enrichment pipeline exists yet; the Course Intelligence model reads this table but nothing populates it in this sprint.",
  },

  // ---- Tournament domain (SportsDataIO) ----------------------------------
  {
    table: "tournaments",
    label: "Tournaments",
    purpose: "Events on a tour — the spine of scheduling, fields, odds, and weather.",
    owner: "SportsDataIO",
    populationMethod: "Tournament import (SportsDataIO).",
    dependencies: ["tours"],
    expectedState: "One row per tracked event across the season.",
    emptyBucket: "broken",
    emptyReason: "Emptiness would mean the tournament import never ran.",
  },
  {
    table: "tournament_courses",
    label: "Tournament Courses",
    purpose: "Join table linking each tournament to the course(s) it is played on.",
    owner: "SportsDataIO",
    populationMethod: "Course-linking step of the tournament import.",
    dependencies: ["tournaments", "courses"],
    expectedState: "At least one course link per tournament.",
    emptyBucket: "broken",
    emptyReason: "Emptiness would break course-dependent features (e.g. weather) for every event.",
  },
  {
    table: "tournament_fields",
    label: "Tournament Fields",
    purpose: "The entrant roster (field) for each tournament.",
    owner: "SportsDataIO",
    populationMethod: "Field import (SportsDataIO tournament field endpoint).",
    dependencies: ["tournaments", "players"],
    expectedState: "Many entrant rows per event with a field.",
    emptyBucket: "broken",
    emptyReason: "Emptiness would mean the field pipeline failed.",
    populatedNote: "A minority of entrants remain unmatched to players due to provider name mismatches.",
  },

  // ---- Round domain (SportsDataIO — future) ------------------------------
  {
    table: "rounds",
    label: "Rounds",
    purpose: "Per-round scheduling and status within a tournament.",
    owner: "SportsDataIO",
    populationMethod: "A round-level import pipeline planned for a later sprint.",
    dependencies: ["tournaments"],
    expectedState: "Empty until round-level ingestion ships (Sprint 3.7).",
    emptyBucket: "future",
    emptyReason: "Schema reserved for round-level scoring; no importer writes it yet.",
  },
  {
    table: "player_rounds",
    label: "Player Rounds",
    purpose: "One player's performance in one round — the anchor for future stats, DFS scoring, betting results, and model scores.",
    owner: "SportsDataIO",
    populationMethod: "A round-level import pipeline planned for a later sprint.",
    dependencies: ["rounds", "tournament_fields"],
    expectedState: "Empty until round-level ingestion ships (Sprint 3.7).",
    emptyBucket: "future",
    emptyReason: "Schema reserved as the per-player-per-round anchor record; no importer writes it yet.",
  },
  {
    table: "round_statistics",
    label: "Round Statistics",
    purpose: "Raw per-round shot statistics (SG splits, GIR, putts) — a key input to Player Skill Intelligence.",
    owner: "SportsDataIO",
    populationMethod: "A round-level statistics import planned for a later sprint.",
    dependencies: ["player_rounds"],
    expectedState: "Empty until round-level ingestion ships (Sprint 3.8).",
    emptyBucket: "future",
    emptyReason: "The Player Skill engine reads this table, but the round-statistics importer is not built yet.",
  },

  // ---- Betting & Fantasy (SportsDataIO — provider limited) ---------------
  {
    table: "betting_events",
    label: "Betting Events",
    purpose: "Bookmaker betting events tied to tournaments (SportsDataIO BettingEvent).",
    owner: "SportsDataIO",
    populationMethod: "Betting import (SportsDataIO betting endpoint).",
    dependencies: ["tournaments"],
    expectedState: "Empty on the trial tier; populates with a production key.",
    emptyBucket: "provider-limited",
    emptyReason: "The SportsDataIO betting endpoint returns 404 / scrambled values on the trial tier, so no real events are persisted.",
  },
  {
    table: "betting_markets",
    label: "Betting Markets",
    purpose: "Markets within a betting event (outright, top-10, etc.).",
    owner: "SportsDataIO",
    populationMethod: "Betting import (nested under events).",
    dependencies: ["betting_events"],
    expectedState: "Empty on the trial tier; depends on betting_events.",
    emptyBucket: "provider-limited",
    emptyReason: "No betting events are available on the trial tier, so there are no markets to persist.",
  },
  {
    table: "betting_outcomes",
    label: "Betting Outcomes",
    purpose: "Individual priced outcomes within a betting market.",
    owner: "SportsDataIO",
    populationMethod: "Betting import (nested under markets).",
    dependencies: ["betting_markets"],
    expectedState: "Empty on the trial tier; depends on betting_markets.",
    emptyBucket: "provider-limited",
    emptyReason: "Outcome VALUES arrive scrambled on the trial tier; with no available markets there is nothing real to persist.",
  },
  {
    table: "fantasy_projections",
    label: "Fantasy Projections",
    purpose: "Projected fantasy points per player per slate.",
    owner: "SportsDataIO",
    populationMethod: "Fantasy import (SportsDataIO projections endpoint).",
    dependencies: ["tournaments", "players"],
    expectedState: "Empty on the trial tier; populates with a production key.",
    emptyBucket: "provider-limited",
    emptyReason: "The projections endpoint 404s / scrambles on the trial tier, so no real projections are persisted (DFS salaries, which are real, import separately).",
  },
  {
    table: "dfs_salaries",
    label: "DFS Salaries",
    purpose: "Real DraftKings salary per player per slate — the flagship real DFS signal and the DFS Value model's core input.",
    owner: "SportsDataIO",
    populationMethod: "Fantasy import (SportsDataIO DFS slates) — salaries are real even on the trial tier.",
    dependencies: ["tournaments", "players"],
    expectedState: "Thousands of rows when events are slated.",
    emptyBucket: "waiting",
    emptyReason: "Populates when DraftKings slates are published for upcoming events.",
    populatedNote: "Real DraftKings salaries — the one fully-real leg of the fantasy/betting family on the trial tier.",
  },

  // ---- Odds (The Odds API) ----------------------------------------------
  {
    table: "odds_events",
    label: "Odds Events",
    purpose: "Betting events sourced from The Odds API (independent of SportsDataIO betting).",
    owner: "The Odds API",
    populationMethod: "Odds import (The Odds API events endpoint).",
    dependencies: ["tournaments"],
    expectedState: "One row per event currently offered by the books.",
    emptyBucket: "waiting",
    emptyReason: "Fills with events the books currently price; naturally low between events.",
    populatedNote: "Sparse — only events the books are actively pricing right now.",
  },
  {
    table: "odds_quotes",
    label: "Odds Quotes",
    purpose: "Individual bookmaker price quotes (outright/top-N) linked to players where possible.",
    owner: "The Odds API",
    populationMethod: "Odds import (The Odds API odds endpoint).",
    dependencies: ["odds_events", "players"],
    expectedState: "Many quotes per priced event across bookmakers.",
    emptyBucket: "waiting",
    emptyReason: "Depends on odds_events; fills whenever the books are pricing golf.",
    populatedNote: "Real, multi-bookmaker quotes with a high player-link rate.",
  },

  // ---- Weather (OpenWeather) --------------------------------------------
  {
    table: "weather_snapshots",
    label: "Weather Snapshots",
    purpose: "A point-in-time forecast pull for a tournament's host course.",
    owner: "OpenWeather",
    populationMethod: "Weather import (OpenWeather) for upcoming events with verified course coordinates.",
    dependencies: ["tournaments", "tournament_courses", "courses"],
    expectedState: "Populates for upcoming events whose host course has VERIFIED coordinates.",
    emptyBucket: "waiting",
    emptyReason: "Blocked upstream: upcoming events currently lack host courses with VERIFIED coordinates, so the weather import has nothing to fetch for. Advancing the geolocation pipeline unblocks it.",
  },
  {
    table: "weather_periods",
    label: "Weather Periods",
    purpose: "The per-interval forecast rows (wind, temp, precipitation) inside a snapshot.",
    owner: "OpenWeather",
    populationMethod: "Weather import (nested under snapshots).",
    dependencies: ["weather_snapshots"],
    expectedState: "Multiple period rows per snapshot.",
    emptyBucket: "waiting",
    emptyReason: "Depends entirely on weather_snapshots, which is itself waiting on verified course coordinates.",
  },

  // ---- Operations (System) ----------------------------------------------
  {
    table: "import_runs",
    label: "Import Runs",
    purpose: "Append-only audit trail of every import execution (provider, status, row counts, errors).",
    owner: "System",
    populationMethod: "Written by every runXImport() via the run-recorder.",
    dependencies: [],
    expectedState: "Grows by one row per import run.",
    emptyBucket: "broken",
    emptyReason: "Emptiness would mean no import has run since the audit trail was introduced.",
  },
]

/** Reconcile a table's designed intent with its live row count. */
function resolveHealth(entry: RegistryEntry, rowCount: number): TableHealth {
  if (entry.obsolete) return "obsolete"
  return rowCount > 0 ? "healthy" : entry.emptyBucket
}

/** Build the plain-language reason string for a resolved verdict. */
function resolveReason(entry: RegistryEntry, rowCount: number, health: TableHealth): string {
  if (health === "obsolete") {
    return entry.obsoleteReason ?? "No longer required."
  }
  if (health === "healthy") {
    const base = `${rowCount.toLocaleString()} row${rowCount === 1 ? "" : "s"} present.`
    return entry.populatedNote ? `${base} ${entry.populatedNote}` : base
  }
  return entry.emptyReason
}

/** Empty per-bucket summary accumulator. */
function emptySummary(): PlatformInventorySummary {
  return {
    healthy: 0,
    waiting: 0,
    future: 0,
    providerLimited: 0,
    obsolete: 0,
    broken: 0,
    total: 0,
  }
}

const BUCKET_KEY: Record<TableHealth, keyof Omit<PlatformInventorySummary, "total">> = {
  healthy: "healthy",
  waiting: "waiting",
  future: "future",
  "provider-limited": "providerLimited",
  obsolete: "obsolete",
  broken: "broken",
}

/**
 * Build the full Platform Inventory from a map of live row counts keyed by
 * table name. Pure and side-effect free so it can be unit-tested and rendered
 * on the server without a database. A table missing from `counts` is treated as
 * zero rows (honest: an absent count is not a populated table).
 */
export function buildPlatformInventory(
  counts: Readonly<Record<string, number>>,
): PlatformInventory {
  const summary = emptySummary()
  const entries: PlatformInventoryEntry[] = REGISTRY.map((entry) => {
    const rowCount = counts[entry.table] ?? 0
    const health = resolveHealth(entry, rowCount)
    summary[BUCKET_KEY[health]] += 1
    summary.total += 1
    return {
      table: entry.table,
      label: entry.label,
      purpose: entry.purpose,
      owner: entry.owner,
      populationMethod: entry.populationMethod,
      dependencies: entry.dependencies,
      expectedState: entry.expectedState,
      rowCount,
      health,
      reason: resolveReason(entry, rowCount, health),
    }
  })
  return { entries, summary }
}

/** The physical table names the inventory expects counts for, in report order. */
export const INVENTORY_TABLES: readonly string[] = REGISTRY.map((e) => e.table)
