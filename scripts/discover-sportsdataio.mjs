/**
 * SportsDataIO live discovery probe (read-only).
 *
 * Hits a curated set of candidate Golf endpoints across the known base paths
 * and reports, for each: HTTP status, payload shape (array/object), row count,
 * and the union of top-level field names on the first few rows. Never prints
 * the API key. Used to produce the Task 1 discovery report; makes no writes.
 *
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/discover-sportsdataio.mjs
 */

const KEY = process.env.SPORTSDATAIO_API_KEY
if (!KEY) {
  console.error("SPORTSDATAIO_API_KEY not set")
  process.exit(1)
}

// A recent, known season/tournament to exercise event-scoped feeds. The
// tournament id is resolved dynamically below from the schedule.
const SEASON = 2025

// Candidate endpoints. Base is relative to https://api.sportsdata.io/golf.
// We try both /v2 and /v3 shapes since betting/projection feeds often live on
// a different version than the core stats feeds.
const CANDIDATES = [
  ["v2", "/json/AvailableSeasons"],
  ["v2", "/json/Players"],
  ["v2", `/json/Schedule/${SEASON}`],
  ["v2", `/json/Tournaments/${SEASON}`],
  ["v2", "/json/InjuredPlayers"],
  ["v2", "/json/News"],
  [
    "v2",
    "/json/NewsByDate/2025-JUN-15",
  ],
  ["v2", "/json/Rankings"],
  ["v2", "/json/PlayerSeasonStats/" + SEASON],
  // Fantasy / DFS
  ["v2", "__TOURNEY__/projections"],
  ["v2", "__TOURNEY__/dfsslates"],
  ["v2", "__TOURNEY__/leaderboard"],
  // Betting (odds API commonly on v3/golf/odds)
  ["v3-odds", "/json/BettingMarketsByEvent/__TOURNEY_ID__"],
  ["v3-odds", "/json/BettingEvents/" + SEASON],
  ["v3-odds", "/json/BettingFuturesByEvent/__TOURNEY_ID__"],
]

const BASES = {
  v2: "https://api.sportsdata.io/golf/v2",
  "v3-odds": "https://api.sportsdata.io/v3/golf/odds",
}

async function hit(base, path) {
  const url = `${BASES[base]}${path}`
  const started = Date.now()
  try {
    const res = await fetch(url, {
      headers: { "Ocp-Apim-Subscription-Key": KEY, Accept: "application/json" },
    })
    const ms = Date.now() - started
    const text = await res.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      /* non-json */
    }
    return { status: res.status, ms, json, raw: text.slice(0, 200) }
  } catch (e) {
    return { status: 0, ms: Date.now() - started, error: String(e) }
  }
}

function shape(json) {
  if (Array.isArray(json)) {
    const keys = new Set()
    for (const row of json.slice(0, 5)) {
      if (row && typeof row === "object") Object.keys(row).forEach((k) => keys.add(k))
    }
    return { kind: "array", count: json.length, keys: [...keys] }
  }
  if (json && typeof json === "object") {
    return { kind: "object", count: 1, keys: Object.keys(json) }
  }
  return { kind: typeof json, count: 0, keys: [] }
}

async function main() {
  // Resolve a real tournament id from the schedule for event-scoped probes.
  let tourneyId = null
  const sched = await hit("v2", `/json/Tournaments/${SEASON}`)
  if (sched.status === 200 && Array.isArray(sched.json)) {
    const withField = sched.json.find((t) => t.TournamentID) || sched.json[0]
    tourneyId = withField?.TournamentID ?? null
    console.log(`[resolve] tournament id for event-scoped probes: ${tourneyId}`)
  }

  const eventPaths = {
    "__TOURNEY__/projections": `/json/PlayerTournamentProjectionStats/${tourneyId}`,
    "__TOURNEY__/dfsslates": `/json/DfsSlatesByTournament/${tourneyId}`,
    "__TOURNEY__/leaderboard": `/json/Leaderboard/${tourneyId}`,
  }

  for (const [base, rawPath] of CANDIDATES) {
    let path = rawPath
    if (eventPaths[rawPath]) path = eventPaths[rawPath]
    path = path.replace("__TOURNEY_ID__", tourneyId ?? "0")

    const r = await hit(base, path)
    if (r.status === 200 && r.json != null) {
      const s = shape(r.json)
      console.log(
        `OK   ${base.padEnd(8)} ${path}\n     ${s.kind} count=${s.count} keys=[${s.keys.join(", ")}]`,
      )
    } else {
      console.log(
        `FAIL ${base.padEnd(8)} ${path}  -> HTTP ${r.status} ${r.error ?? r.raw ?? ""}`,
      )
    }
  }
}

main()
