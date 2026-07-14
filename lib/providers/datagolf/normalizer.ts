/**
 * Placeholder normalizers for DataGolf.
 *
 * No implementation yet — these define the resources DataGolf will map into
 * CaddieIQ domain records (rankings, skill/strokes-gained metrics, and
 * projections) so the import pipeline can be wired up now and filled in later.
 */

import { notImplemented } from "../shared/errors"
import type { Normalizer } from "../shared/types"

const PROVIDER = "datagolf"

/** Maps DataGolf ranking payloads → CaddieIQ player rankings. */
export class DataGolfRankingNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "rankings"

  normalize(): never {
    throw notImplemented(PROVIDER, "Ranking normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Ranking normalization")
  }
}

/** Maps DataGolf skill/strokes-gained payloads → CaddieIQ round statistics. */
export class DataGolfSkillNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "skills"

  normalize(): never {
    throw notImplemented(PROVIDER, "Skill normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Skill normalization")
  }
}

/** Maps DataGolf pre-tournament projections → CaddieIQ projection records. */
export class DataGolfProjectionNormalizer implements Normalizer<unknown, unknown> {
  readonly resource = "projections"

  normalize(): never {
    throw notImplemented(PROVIDER, "Projection normalization")
  }

  normalizeMany(): never {
    throw notImplemented(PROVIDER, "Projection normalization")
  }
}
