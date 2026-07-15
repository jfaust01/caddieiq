/**
 * Raw OpenWeather response shapes (5 day / 3 hour forecast endpoint,
 * `/data/2.5/forecast`). These mirror the upstream JSON exactly — every nested
 * field is optional because the free tier omits values situationally (e.g.
 * `wind.gust`, `rain['3h']`). Normalization into CaddieIQ signals happens in the
 * Weather Intelligence engine, never here.
 */

/** A single 3-hour forecast bucket from the `list` array. */
export interface OwmForecastEntry {
  /** Forecast validity time, UNIX seconds (UTC). */
  dt: number
  main?: {
    temp?: number
    feels_like?: number
    temp_min?: number
    temp_max?: number
    pressure?: number
    humidity?: number
  }
  weather?: Array<{
    id?: number
    main?: string
    description?: string
    icon?: string
  }>
  clouds?: { all?: number }
  wind?: {
    speed?: number
    deg?: number
    gust?: number
  }
  visibility?: number
  /** Probability of precipitation, 0..1. */
  pop?: number
  rain?: { "3h"?: number }
  snow?: { "3h"?: number }
  /** Part-of-day flag: "d" (day) or "n" (night). */
  sys?: { pod?: string }
  /** Local forecast time, formatted `YYYY-MM-DD HH:mm:ss`. */
  dt_txt?: string
}

/** The `city` block: venue metadata for the forecast. */
export interface OwmForecastCity {
  id?: number
  name?: string
  coord?: { lat?: number; lon?: number }
  country?: string
  /** Seconds offset from UTC at the venue. */
  timezone?: number
  /** Sunrise / sunset, UNIX seconds (UTC). */
  sunrise?: number
  sunset?: number
}

/** Full `/data/2.5/forecast` response envelope. */
export interface OwmForecastResponse {
  cod?: string | number
  message?: string | number
  cnt?: number
  list?: OwmForecastEntry[]
  city?: OwmForecastCity
}
