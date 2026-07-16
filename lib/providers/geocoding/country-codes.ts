/**
 * Country-code normalization for the OpenWeather Geocoding API.
 *
 * The course feed (SportsDataIO) stores nationality-style, IOC/sports country
 * codes — "USA", "ENG", "SCO", "MAS", "BER", "PUR" — NOT ISO 3166-1 codes.
 * OpenWeather's `/geo/1.0/direct` expects an ISO 3166-1 alpha-2 country code
 * ("US", "GB", "MY", …). This module is the pure, well-tested bridge between
 * the two vocabularies.
 *
 * Honesty notes:
 *   - The UK's constituent countries (England, Scotland, Wales, Northern
 *     Ireland) all map to ISO "GB", which is what OpenWeather recognizes.
 *   - Territories with their own ISO code (Puerto Rico → PR, Bermuda → BM) are
 *     mapped to that code, not to their sovereign state.
 *   - An unrecognized or absent code returns `null`; callers then omit the
 *     country qualifier rather than guessing, so we never send a wrong country.
 */

/**
 * IOC / SportsDataIO country code → ISO 3166-1 alpha-2. Covers the nations and
 * territories that actually appear on the professional golf schedule; extend as
 * new venues appear. Keys are compared case-insensitively (see
 * {@link toIso2CountryCode}).
 */
const SPORTS_CODE_TO_ISO2: Readonly<Record<string, string>> = {
  // North America
  USA: "US",
  CAN: "CA",
  MEX: "MX",
  // United Kingdom (all constituent countries → GB for ISO/OpenWeather)
  GBR: "GB",
  ENG: "GB",
  SCO: "GB",
  WAL: "GB",
  NIR: "GB",
  // Ireland
  IRL: "IE",
  // Continental Europe
  FRA: "FR",
  ESP: "ES",
  POR: "PT",
  GER: "DE",
  DEU: "DE",
  ITA: "IT",
  NED: "NL",
  NLD: "NL",
  BEL: "BE",
  SUI: "CH",
  CHE: "CH",
  AUT: "AT",
  SWE: "SE",
  NOR: "NO",
  DEN: "DK",
  DNK: "DK",
  FIN: "FI",
  ISL: "IS",
  // Asia
  JPN: "JP",
  KOR: "KR",
  CHN: "CN",
  TPE: "TW",
  HKG: "HK",
  IND: "IN",
  THA: "TH",
  MAS: "MY",
  SGP: "SG",
  SIN: "SG",
  PHI: "PH",
  INA: "ID",
  VIE: "VN",
  // Oceania
  AUS: "AU",
  NZL: "NZ",
  FIJ: "FJ",
  // Africa
  RSA: "ZA",
  ZAF: "ZA",
  KEN: "KE",
  ZIM: "ZW",
  MAR: "MA",
  MRI: "MU",
  // Central America & Caribbean
  BAH: "BS",
  BER: "BM",
  PUR: "PR",
  DOM: "DO",
  JAM: "JM",
  CAY: "KY",
  TRI: "TT",
  // South America
  ARG: "AR",
  BRA: "BR",
  CHI: "CL",
  CHL: "CL",
  COL: "CO",
  VEN: "VE",
  URU: "UY",
  PAR: "PY",
  ECU: "EC",
}

/**
 * Convert a stored country code to an ISO 3166-1 alpha-2 code for OpenWeather.
 *
 * Accepts the IOC/SportsDataIO codes in {@link SPORTS_CODE_TO_ISO2} (matched
 * case-insensitively) and also passes through a value that is already a valid
 * two-letter code (e.g. "US"). Returns `null` for anything unrecognized or
 * empty so the caller can omit the country qualifier instead of sending a
 * wrong one.
 */
export function toIso2CountryCode(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()

  // Already an alpha-2 code (and not one of our 3-letter keys).
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) return upper

  return SPORTS_CODE_TO_ISO2[upper] ?? null
}

/**
 * US state/territory two-letter codes. OpenWeather only honors the `state`
 * component of a query for US locations, so we only forward a state when the
 * country resolves to "US" AND the state looks like a US postal code.
 */
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
])

/** True when `state` is a US postal code usable in an OpenWeather query. */
export function isUsStateCode(state: string | null | undefined): boolean {
  const s = state?.trim().toUpperCase()
  return s != null && US_STATE_CODES.has(s)
}
