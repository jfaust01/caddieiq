/**
 * Placeholder normalizers for OpenWeather.
 *
 * No implementation yet — these define the resources OpenWeather will map into
 * CaddieIQ domain records (current conditions and forecasts tied to a course
 * location) so the import pipeline can be wired up now and filled in later.
 */

import { notImplemented } from "../shared/errors"
import type { Normalizer } from "../shared/types"

const PROVIDER = "weather"

/** Maps OpenWeather current-conditions payloads → CaddieIQ weather records. */
export class WeatherConditionsNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "conditions"

  normalize(): never {
    throw notImplemented(PROVIDER, "Conditions normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Conditions normalization")
  }
}

/** Maps OpenWeather forecast payloads → CaddieIQ forecast records. */
export class WeatherForecastNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "forecast"

  normalize(): never {
    throw notImplemented(PROVIDER, "Forecast normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Forecast normalization")
  }
}
