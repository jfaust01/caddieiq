/**
 * Placeholder normalizers for SportsDataIO.
 *
 * No implementation yet — these define the resources SportsDataIO will map into
 * CaddieIQ domain records (players, tournaments, rounds, statistics) so the
 * import pipeline can be wired up now and filled in later.
 */

import { notImplemented } from "../shared/errors"
import type { Normalizer } from "../shared/types"

const PROVIDER = "sportsdataio"

/** Maps SportsDataIO player payloads → CaddieIQ player records. */
export class SportsDataIoPlayerNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "players"

  normalize(): never {
    throw notImplemented(PROVIDER, "Player normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Player normalization")
  }
}

/** Maps SportsDataIO tournament payloads → CaddieIQ tournament records. */
export class SportsDataIoTournamentNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "tournaments"

  normalize(): never {
    throw notImplemented(PROVIDER, "Tournament normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Tournament normalization")
  }
}

/** Maps SportsDataIO round/scoring payloads → CaddieIQ round statistics. */
export class SportsDataIoStatisticNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "statistics"

  normalize(): never {
    throw notImplemented(PROVIDER, "Statistic normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Statistic normalization")
  }
}
