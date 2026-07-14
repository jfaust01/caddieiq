/**
 * Placeholder normalizers for the Odds API.
 *
 * No implementation yet — these define the resources the Odds API will map into
 * CaddieIQ domain records (outright/market odds and bookmaker lines) so the
 * import pipeline can be wired up now and filled in later.
 */

import { notImplemented } from "../shared/errors"
import type { Normalizer } from "../shared/types"

const PROVIDER = "odds"

/** Maps outright/market odds payloads → CaddieIQ odds records. */
export class OddsMarketNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "markets"

  normalize(): never {
    throw notImplemented(PROVIDER, "Market odds normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Market odds normalization")
  }
}

/** Maps per-bookmaker line payloads → CaddieIQ bookmaker line records. */
export class OddsBookmakerNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "bookmakers"

  normalize(): never {
    throw notImplemented(PROVIDER, "Bookmaker line normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Bookmaker line normalization")
  }
}
