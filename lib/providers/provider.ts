/**
 * Provider capability contracts.
 *
 * This is the abstraction the rest of CaddieIQ depends on. Application code,
 * the (future) normalization layer, and the import pipeline reference these
 * interfaces — never a concrete provider such as SportsDataIO. Swapping or
 * adding a provider (DataGolf, OpenWeather, The Odds API, …) therefore requires
 * no changes above this seam: a new class simply implements the relevant
 * capability interface.
 *
 * Scope: these contracts describe how we *fetch* raw, typed data from an
 * upstream source. They deliberately do not describe normalization or
 * persistence — those layers consume the responses defined here. See the
 * `Normalizer`/`Provider` ingestion contracts in `./shared/types` for the
 * complementary layer that maps these raw responses into domain records.
 *
 * Note on exports: this module is intentionally imported by path
 * (`@/lib/providers/provider`) rather than re-exported from the package root,
 * because the ingestion scaffold already exports classes named
 * `WeatherProvider`/`OddsProvider`. The two layers are distinct concerns.
 */

/**
 * Operational status of a provider, derived from its most recent health check.
 *
 * - `operational`   — connected and authenticated; safe to use.
 * - `degraded`      — reachable but impaired (elevated latency, partial quota).
 * - `unauthenticated` — reachable but credentials are missing/invalid.
 * - `unavailable`   — could not be reached at all.
 * - `unknown`       — not yet probed.
 */
export type ProviderStatus =
  | "operational"
  | "degraded"
  | "unauthenticated"
  | "unavailable"
  | "unknown"

/**
 * The result of `DataProvider.health()`. A cheap, side-effect-free probe that
 * reports whether a provider can currently serve requests. Never contains
 * secrets.
 */
export interface HealthCheck {
  /** Stable provider identifier, e.g. "sportsdataio". */
  providerName: string
  /** Version/revision of the provider client implementation. */
  version: string
  /** Whether the upstream API was reachable. */
  connected: boolean
  /** Whether the configured credentials were accepted. */
  authenticated: boolean
  /** Round-trip latency of the probe in milliseconds. */
  latency: number
  /** Rolled-up operational status derived from the fields above. */
  status: ProviderStatus
  /** When the probe ran. */
  checkedAt: Date
  /** Optional human-readable detail (e.g. "quota 90% used"). Never a secret. */
  message?: string
}

/**
 * Metadata attached to every provider response so downstream layers can trace
 * provenance without re-deriving it.
 */
export interface ProviderResponseMeta {
  /** Which provider produced the payload. */
  provider: string
  /** The logical resource requested (e.g. "players"). */
  resource: string
  /** When the payload was fetched. */
  fetchedAt: Date
  /** Upstream request id/etag, when the API supplies one. */
  requestId?: string
}

/**
 * A single typed, **un-normalized** record from a provider, wrapped with
 * provenance metadata. The `data` is the provider's own shape; mapping into
 * CaddieIQ domain models happens later in the normalization layer.
 */
export interface ProviderResponse<TData> {
  data: TData
  meta: ProviderResponseMeta
}

/** A collection response: many raw records plus provenance metadata. */
export interface ProviderListResponse<TData> {
  data: TData[]
  meta: ProviderResponseMeta
  /** Total available upstream, when the API reports it (for pagination). */
  totalCount?: number
}

/** Common pagination/query parameters accepted by list-style calls. */
export interface ProviderQuery {
  /** Provider-native season/year filter (e.g. 2024). */
  season?: number
  /** Max records to request, when the upstream supports limiting. */
  limit?: number
  /** Opaque cursor/offset for paginated upstreams. */
  cursor?: string
}

/**
 * Base contract shared by every provider capability. A concrete provider
 * declares its identity and exposes a health probe; capability interfaces below
 * extend this with domain-specific reads.
 */
export interface DataProvider {
  /** Stable provider identifier, e.g. "sportsdataio". */
  readonly providerName: string
  /** Version/revision of the provider client implementation. */
  readonly version: string
  /** Report current connectivity/auth without mutating state. */
  health(): Promise<HealthCheck>
}

/**
 * Golf data capability: players, tournaments, and courses. SportsDataIO is the
 * first implementation; DataGolf may implement the same contract later. Methods
 * return raw, typed provider responses — they never normalize.
 *
 * @typeParam TPlayer     - Raw player shape for the implementing provider.
 * @typeParam TTournament - Raw tournament shape for the implementing provider.
 * @typeParam TCourse     - Raw course shape for the implementing provider.
 */
export interface GolfDataProvider<
  TPlayer = unknown,
  TTournament = unknown,
  TCourse = unknown,
> extends DataProvider {
  /** List players in the provider's catalog. */
  listPlayers(query?: ProviderQuery): Promise<ProviderListResponse<TPlayer>>
  /** Fetch a single player by the provider's native id. */
  getPlayer(playerId: string): Promise<ProviderResponse<TPlayer>>
  /** List tournaments, optionally scoped by season. */
  listTournaments(query?: ProviderQuery): Promise<ProviderListResponse<TTournament>>
  /** Fetch a single tournament by the provider's native id. */
  getTournament(tournamentId: string): Promise<ProviderResponse<TTournament>>
  /** List courses in the provider's catalog. */
  listCourses(query?: ProviderQuery): Promise<ProviderListResponse<TCourse>>
}

/**
 * Weather capability: current conditions and forecasts for a course/location.
 * OpenWeather will be the first implementation. Contract only for now.
 */
export interface WeatherProvider<TConditions = unknown, TForecast = unknown>
  extends DataProvider {
  /** Current conditions for a latitude/longitude. */
  getCurrentConditions(
    lat: number,
    lon: number,
  ): Promise<ProviderResponse<TConditions>>
  /** Forecast for a latitude/longitude. */
  getForecast(lat: number, lon: number): Promise<ProviderResponse<TForecast>>
}

/**
 * Odds capability: betting markets for tournaments/players. The Odds API will
 * be the first implementation. Contract only for now.
 */
export interface OddsProvider<TMarket = unknown> extends DataProvider {
  /** List markets, optionally scoped to a tournament. */
  listOdds(query?: ProviderQuery & { tournamentId?: string }): Promise<
    ProviderListResponse<TMarket>
  >
}
