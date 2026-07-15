/**
 * Focused betting + news discovery (read-only). Expands a betting event's
 * markets and outcomes, and confirms player-scoped news. No writes; no key logs.
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/discover-betting.mjs
 */
const KEY = process.env.SPORTSDATAIO_API_KEY
const SEASON = 2025
const ODDS = "https://api.sportsdata.io/v3/golf/odds"
const V2 = "https://api.sportsdata.io/golf/v2"
const get = async (u) => {
  const r = await fetch(u, { headers: { "Ocp-Apim-Subscription-Key": KEY, Accept: "application/json" } })
  const t = await r.text()
  try { return { status: r.status, json: JSON.parse(t) } } catch { return { status: r.status, raw: t.slice(0, 200) } }
}
const keys = (o) => (o && typeof o === "object" ? Object.keys(o) : [])

async function main() {
  const be = await get(`${ODDS}/json/BettingEvents/${SEASON}`)
  const events = Array.isArray(be.json) ? be.json : []
  console.log(`events=${events.length}`)
  // Find an event that actually has markets, via the by-event markets endpoint.
  for (const evt of events.slice(0, 6)) {
    const mk = await get(`${ODDS}/json/BettingMarkets/${evt.BettingEventID}`)
    const markets = Array.isArray(mk.json) ? mk.json : []
    console.log(`event ${evt.BettingEventID} "${evt.Name}" tId=${evt.TournamentId} markets=${markets.length} (status ${mk.status})`)
    if (markets.length) {
      const m = markets.find((x) => x.BettingOutcomes?.length) ?? markets[0]
      console.log("  MARKET keys:", keys(m).join(", "))
      console.log("  MARKET:", JSON.stringify({ ...m, BettingOutcomes: `[${m.BettingOutcomes?.length}]` }))
      const o = m.BettingOutcomes?.[0]
      if (o) {
        console.log("  OUTCOME keys:", keys(o).join(", "))
        console.log("  OUTCOME:", JSON.stringify(o))
      }
      // distinct market types
      console.log("  MARKET TYPES:", [...new Set(markets.map((x) => x.BettingMarketType))].join(" | "))
      console.log("  BET TYPES:", [...new Set(markets.map((x) => x.BettingBetType))].join(" | "))
      break
    }
  }
  // News by player
  const np = await get(`${V2}/json/NewsByPlayerID/40003252`)
  console.log(`\nNewsByPlayerID status=${np.status} count=${Array.isArray(np.json) ? np.json.length : "n/a"}`)
}
main()
