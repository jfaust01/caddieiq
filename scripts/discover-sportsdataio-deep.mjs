/**
 * SportsDataIO deep discovery (read-only).
 *
 * Expands nested structures on the enabled feeds so the mapping layer can be
 * designed against real shapes: a full Player, a News item, Leaderboard player
 * rows (fantasy points + rounds), DFS slate players (salaries), and Betting
 * events → markets → outcomes. Never prints the API key; makes no writes.
 *
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/discover-sportsdataio-deep.mjs
 */

const KEY = process.env.SPORTSDATAIO_API_KEY
if (!KEY) {
  console.error("SPORTSDATAIO_API_KEY not set")
  process.exit(1)
}
const SEASON = 2025
const V2 = "https://api.sportsdata.io/golf/v2"
const ODDS = "https://api.sportsdata.io/v3/golf/odds"

async function get(url) {
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": KEY, Accept: "application/json" },
  })
  const text = await res.text()
  try {
    return { status: res.status, json: JSON.parse(text) }
  } catch {
    return { status: res.status, json: null, raw: text.slice(0, 300) }
  }
}

const keysOf = (o) => (o && typeof o === "object" ? Object.keys(o) : [])

async function main() {
  // 1) Player full shape
  const players = await get(`${V2}/json/Players`)
  if (players.status === 200) {
    const p = players.json.find((x) => x.PhotoUrl) ?? players.json[0]
    console.log("PLAYER sample:", JSON.stringify(p, null, 1).slice(0, 900))
  }

  // 2) News full shape
  const news = await get(`${V2}/json/News`)
  if (news.status === 200 && news.json[0]) {
    console.log("\nNEWS sample:", JSON.stringify(news.json[0], null, 1).slice(0, 800))
  }

  // 3) Find an upcoming/in-progress tournament for projections + a finished one for leaderboard
  const tourneys = await get(`${V2}/json/Tournaments/${SEASON}`)
  const list = tourneys.json ?? []
  const upcoming = list.find((t) => !t.IsOver) ?? list[list.length - 1]
  const finished = [...list].reverse().find((t) => t.IsOver) ?? list[0]
  console.log(
    `\nTOURNEYS upcoming=${upcoming?.TournamentID} (${upcoming?.Name}) finished=${finished?.TournamentID} (${finished?.Name})`,
  )

  // 4) Leaderboard player rows: fantasy points + rounds
  const lb = await get(`${V2}/json/Leaderboard/${finished?.TournamentID}`)
  if (lb.status === 200 && lb.json?.Players?.[0]) {
    const pr = lb.json.Players[0]
    console.log("\nLEADERBOARD player keys:", keysOf(pr).join(", "))
    console.log("LEADERBOARD player sample:", JSON.stringify(pr, null, 1).slice(0, 900))
    if (pr.Rounds?.[0]) console.log("LEADERBOARD round keys:", keysOf(pr.Rounds[0]).join(", "))
  }

  // 5) Projections (DFS) for upcoming tourney
  for (const tid of [upcoming?.TournamentID, finished?.TournamentID]) {
    const proj = await get(`${V2}/json/PlayerTournamentProjectionStats/${tid}`)
    if (proj.status === 200 && Array.isArray(proj.json) && proj.json.length) {
      console.log(`\nPROJECTIONS (tid=${tid}) count=${proj.json.length} keys:`, keysOf(proj.json[0]).join(", "))
      console.log("PROJECTION sample:", JSON.stringify(proj.json[0], null, 1).slice(0, 700))
      break
    } else {
      console.log(`\nPROJECTIONS (tid=${tid}) empty/failed status=${proj.status} len=${Array.isArray(proj.json) ? proj.json.length : "n/a"}`)
    }
  }

  // 6) DFS slates -> slate players (salaries)
  const slates = await get(`${V2}/json/DfsSlatesByTournament/${finished?.TournamentID}`)
  if (slates.status === 200 && slates.json?.[0]) {
    const s = slates.json[0]
    console.log("\nDFS SLATE keys:", keysOf(s).join(", "))
    if (s.DfsSlatePlayers?.[0]) {
      console.log("DFS SLATE PLAYER keys:", keysOf(s.DfsSlatePlayers[0]).join(", "))
      console.log("DFS SLATE PLAYER sample:", JSON.stringify(s.DfsSlatePlayers[0], null, 1).slice(0, 500))
    }
  }

  // 7) Betting events -> markets -> outcomes
  const be = await get(`${ODDS}/json/BettingEvents/${SEASON}`)
  if (be.status === 200 && Array.isArray(be.json)) {
    const evt = be.json.find((e) => e.BettingMarkets?.length) ?? be.json[0]
    console.log("\nBETTING EVENT keys:", keysOf(evt).join(", "))
    console.log(`BETTING EVENT ${evt.Name} tournamentId=${evt.TournamentId} markets=${evt.BettingMarkets?.length ?? 0}`)
    // Try dedicated market endpoint by event id
    const mk = await get(`${ODDS}/json/BettingMarkets/${evt.BettingEventID}`)
    console.log(`BETTING MARKETS by event status=${mk.status} count=${Array.isArray(mk.json) ? mk.json.length : "n/a"}`)
    const market = (Array.isArray(mk.json) ? mk.json : evt.BettingMarkets)?.[0]
    if (market) {
      console.log("BETTING MARKET keys:", keysOf(market).join(", "))
      console.log("BETTING MARKET sample:", JSON.stringify({ ...market, BettingOutcomes: undefined }, null, 1).slice(0, 500))
      if (market.BettingOutcomes?.[0]) {
        console.log("BETTING OUTCOME keys:", keysOf(market.BettingOutcomes[0]).join(", "))
        console.log("BETTING OUTCOME sample:", JSON.stringify(market.BettingOutcomes[0], null, 1).slice(0, 500))
      }
    }
  }
}

main()
