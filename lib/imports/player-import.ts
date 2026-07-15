/**
 * Player import definition.
 *
 * Declares how the four existing layers wire together for players — it contains
 * NO orchestration logic of its own (timing, logging, aggregation, and the
 * fetch→map→validate→persist sequencing all live in {@link ImportManager}).
 * This file only supplies the four layer-specific steps:
 *
 *   fetch    → GolfDataProvider.listPlayers        (lib/providers)
 *   map      → mapSportsDataPlayer                 (lib/domain)
 *   validate → validatePlayers                     (lib/data-quality)
 *   persist  → PlayerRepository.bulkUpsert         (lib/repositories)
 */

import { validatePlayers } from "@/lib/data-quality"
import { mapSportsDataPlayer, type Player } from "@/lib/domain"
import type { GolfDataProvider, ProviderQuery } from "@/lib/providers/provider"
import type { SdioPlayer } from "@/lib/providers/sportsdataio/types"
import type { PlayerRepository } from "@/lib/repositories"

import type { ImportDefinition } from "./import-manager"

/** Dependencies the player import needs from the surrounding layers. */
export interface PlayerImportDeps {
  provider: GolfDataProvider<SdioPlayer, unknown, unknown>
  repository: PlayerRepository
}

/**
 * Build the player {@link ImportDefinition}. The manager consumes this to run
 * the pipeline generically.
 */
export function createPlayerImportDefinition(
  deps: PlayerImportDeps,
  query?: ProviderQuery,
): ImportDefinition<SdioPlayer, Player> {
  return {
    entity: "player",
    fetch: () => deps.provider.listPlayers(query),
    map: (raw) => mapSportsDataPlayer(raw),
    validate: (players) => validatePlayers(players),
    persist: (players) => deps.repository.bulkUpsert(players),
  }
}
