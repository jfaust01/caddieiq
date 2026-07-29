/**
 * Hole-score import definition.
 *
 * Wires the four layers for hole-by-hole scoring:
 *
 *   fetch    → GolfDataProvider.fetchHoleScores  (lib/providers)
 *   map      → mapSdioHoleScore                  (lib/domain)
 *   validate → validateHoleScores                (lib/data-quality)
 *   persist  → HoleScoreRepository.bulkUpsert    (lib/repositories)
 *
 * Hole scores are imported per player-round and use a composite unique
 * constraint (playerRoundId, holeNumber) to ensure idempotent imports.
 */

import { validateHoleScores } from "@/lib/data-quality"
import { mapSdioHoleScore, type HoleScore } from "@/lib/domain"
import type { GolfDataProvider, ProviderQuery } from "@/lib/providers/provider"
import type { SdioHoleScore } from "@/lib/providers/sportsdataio/types"
import type { HoleScorePersistInput, HoleScoreRepository } from "@/lib/repositories"

import type { ImportDefinition } from "./import-manager"

/** Dependencies the hole-score import needs. */
export interface HoleScoreImportDeps {
  provider: GolfDataProvider<unknown, SdioHoleScore, unknown>
  repository: HoleScoreRepository
  /**
   * Tournament ID being imported (used to filter provider queries).
   * Hole scores are scoped to tournament → round → player → holes.
   */
  tournamentId: string
}

/** Build the hole-score {@link ImportDefinition}. */
export function createHoleScoreImportDefinition(
  deps: HoleScoreImportDeps,
  query?: ProviderQuery,
): ImportDefinition<SdioHoleScore, HoleScore> {
  return {
    entity: "hole_score",
    fetch: () =>
      deps.provider.fetchHoleScores({
        ...query,
        tournamentId: deps.tournamentId,
      }),
    map: (raw) => mapSdioHoleScore(raw),
    validate: (holeScores) => validateHoleScores(holeScores),
    persist: (holeScores) => {
      const inputs: HoleScorePersistInput[] = holeScores.map((hole) => ({
        playerRoundId: hole.playerRoundId,
        holeNumber: hole.holeNumber,
        par: hole.par,
        score: hole.score,
        toPar: hole.toPar,
        dkPoints: hole.dkPoints,
        source: hole.source,
        externalId: hole.externalId,
        importedAt: new Date(),
      }))
      return deps.repository.bulkUpsert(inputs)
    },
  }
}
