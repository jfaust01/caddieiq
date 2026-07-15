/**
 * Tournament import definition.
 *
 * Wires the four layers for tournaments with no orchestration logic of its own
 * (see {@link ImportManager}):
 *
 *   fetch    → GolfDataProvider.listTournaments    (lib/providers)
 *   map      → mapSportsDataTournament             (lib/domain)
 *   validate → validateTournaments                 (lib/data-quality)
 *   persist  → TournamentRepository.bulkUpsert     (lib/repositories)
 *
 * Relationship note: `TournamentRepository` requires a resolved `tourId` to
 * *insert* a new tournament (it is a required FK the base domain object does not
 * carry). Resolving tour/season linkage is a documented downstream concern, so
 * this definition forwards each validated tournament with `tourId: undefined`.
 * The repository therefore updates existing tournaments (matched by `slug`) and
 * reports a captured `RelationshipError` for brand-new ones — surfaced in the
 * ImportReport rather than thrown. When a tour-resolution step is added, it
 * simply populates `tourId` here; no orchestration changes are required.
 * TODO(relationships): resolve `tourId`/`seasonId` before persist.
 */

import { validateTournaments } from "@/lib/data-quality"
import { mapSportsDataTournament, type Tournament } from "@/lib/domain"
import type { GolfDataProvider, ProviderQuery } from "@/lib/providers/provider"
import type { SdioTournament } from "@/lib/providers/sportsdataio/types"
import type { TournamentPersistInput, TournamentRepository } from "@/lib/repositories"

import type { ImportDefinition } from "./import-manager"

/** Dependencies the tournament import needs from the surrounding layers. */
export interface TournamentImportDeps {
  provider: GolfDataProvider<unknown, SdioTournament, unknown>
  repository: TournamentRepository
  /**
   * Optional hook to resolve the required `tourId` (and optional `seasonId`)
   * for a validated tournament before persistence. Defaults to leaving them
   * unresolved, which lets existing tournaments update and reports new ones as
   * relationship failures.
   */
  resolveRelations?: (tournament: Tournament) => {
    tourId?: string
    seasonId?: string | null
  }
}

/** Build the tournament {@link ImportDefinition}. */
export function createTournamentImportDefinition(
  deps: TournamentImportDeps,
  query?: ProviderQuery,
): ImportDefinition<SdioTournament, Tournament> {
  const resolve = deps.resolveRelations ?? (() => ({}))
  return {
    entity: "tournament",
    fetch: () => deps.provider.listTournaments(query),
    map: (raw) => mapSportsDataTournament(raw),
    validate: (tournaments) => validateTournaments(tournaments),
    persist: (tournaments) => {
      const inputs: TournamentPersistInput[] = tournaments.map((tournament) => ({
        tournament,
        ...resolve(tournament),
      }))
      return deps.repository.bulkUpsert(inputs)
    },
  }
}
