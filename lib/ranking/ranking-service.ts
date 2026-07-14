/**
 * RankingService — the placeholder read API for rankings.
 *
 * This is the single source of truth callers (pages, loaders, the future API
 * layer) use to fetch rankings. Today it drives the {@link RankingEngine} with
 * a small, self-contained mock roster so it returns realistic, deterministic
 * rankings with **no real calculations and no external calls**.
 *
 * TODO(data): replace the mock roster with real player records from the domain
 * model, and feed real analytics into the engine, once the data platform lands.
 */

import { RankingEngine } from "./engine"
import type {
  PlayerRankingResult,
  RankingPipelineResult,
  RankingPlayerInput,
  RankingScope,
  RankingType,
  RankingWeights,
} from "./types"

/**
 * A tiny, provider-agnostic mock roster. Ids are stable so ranking output is
 * deterministic across runs. This intentionally lives in the service (not the
 * Player feature) to keep the ranking layer free of UI/client coupling.
 *
 * TODO(data): remove in favor of real player records.
 */
const MOCK_ROSTER: RankingPlayerInput[] = [
  { playerId: "p-scheffler", label: "Scottie Scheffler", worldRanking: 1 },
  { playerId: "p-mcilroy", label: "Rory McIlroy", worldRanking: 2 },
  { playerId: "p-schauffele", label: "Xander Schauffele", worldRanking: 3 },
  { playerId: "p-aberg", label: "Ludvig Åberg", worldRanking: 4 },
  { playerId: "p-morikawa", label: "Collin Morikawa", worldRanking: 5 },
  { playerId: "p-hovland", label: "Viktor Hovland", worldRanking: 6 },
  { playerId: "p-cantlay", label: "Patrick Cantlay", worldRanking: 7 },
  { playerId: "p-fleetwood", label: "Tommy Fleetwood", worldRanking: 8 },
  { playerId: "p-thomas", label: "Justin Thomas", worldRanking: 9 },
  { playerId: "p-fowler", label: "Rickie Fowler", worldRanking: 10 },
  { playerId: "p-lowry", label: "Shane Lowry", worldRanking: 11 },
  { playerId: "p-straka", label: "Sepp Straka", worldRanking: 12 },
]

export interface GetRankingOptions {
  scope?: RankingScope
  /** Weight overrides merged over the ranking type's registry defaults. */
  weights?: RankingWeights
  /** Custom-model id when `type` is `"model"`. */
  modelId?: string
  /** Cap the number of returned rows. */
  limit?: number
}

export class RankingService {
  private readonly engine: RankingEngine

  constructor(engine: RankingEngine = new RankingEngine()) {
    this.engine = engine
  }

  /**
   * Return a full mock ranking of the given type. No real analytics run — the
   * engine synthesizes deterministic module scores for the mock roster.
   */
  async getRanking(
    type: RankingType,
    options: GetRankingOptions = {},
  ): Promise<RankingPipelineResult> {
    const result = await this.engine.rankPlayers(type, MOCK_ROSTER, {
      scope: options.scope,
      weights: options.weights,
      modelId: options.modelId,
    })

    if (options.limit && options.limit > 0) {
      return { ...result, results: result.results.slice(0, options.limit) }
    }
    return result
  }

  /** Return just the ordered rows for a ranking type. */
  async getRankingResults(
    type: RankingType,
    options: GetRankingOptions = {},
  ): Promise<PlayerRankingResult[]> {
    const { results } = await this.getRanking(type, options)
    return results
  }

  /** Find a single player's row within a ranking, or `null` if absent. */
  async getPlayerRankingResult(
    type: RankingType,
    playerId: string,
    options: GetRankingOptions = {},
  ): Promise<PlayerRankingResult | null> {
    const results = await this.getRankingResults(type, options)
    return results.find((result) => result.playerId === playerId) ?? null
  }
}

/** Shared singleton for convenient imports. */
export const rankingService = new RankingService()
