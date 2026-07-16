/**
 * Weather Intelligence Engine — public surface.
 *
 * The engine has two halves, mirroring Course Intelligence:
 *  - A **pure** core (`intelligence.ts` + `signals.ts` / `characteristics.ts` /
 *    `waves.ts` / `types.ts`) that turns a verified
 *    {@link WeatherIntelligenceInput} into a confidence-graded
 *    {@link WeatherIntelligence}. No I/O, fully unit tested, safe to import
 *    anywhere.
 *  - A `server-only` service (`service.ts`) that loads the stored snapshot for a
 *    tournament and runs the pure core. Import that from server code only.
 *
 * Honest by construction: with no stored snapshot (no API key / no import yet),
 * the pure core returns an `unavailable` intelligence with machine-readable
 * gaps — it never fabricates a forecast.
 */
export * from "./types"
export { buildWeatherIntelligence, unavailableIntelligence } from "./intelligence"
export {
  computeWeatherStatus,
  resolvePhase,
  FORECAST_HORIZON_DAYS,
  type WeatherStatusCode,
  type WeatherStatusReport,
  type WeatherStatusTone,
  type WeatherTournamentPhase,
  type WeatherStatusInput,
} from "./status"
