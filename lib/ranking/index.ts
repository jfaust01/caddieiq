/**
 * CaddieIQ Ranking Engine.
 *
 * The single source of truth for every ranking surfaced in the product. It sits
 * above the analytics framework: analytics modules produce per-player scores,
 * and this layer blends them — via a weighted {@link RankingPipeline} — into
 * ordered, typed {@link RankingPipelineResult}s.
 *
 * Architecture only: the {@link DefaultRankingPipeline} and {@link RankingService}
 * return realistic, deterministic **mock** rankings with no real calculations,
 * no Prisma, no API calls, and no SportsDataIO. `TODO(analytics)` / `TODO(ai)` /
 * `TODO(data)` markers show where live inputs will integrate.
 *
 * Primary entry points:
 *   - {@link rankingService} — read mock rankings by type.
 *   - {@link createRankingEngine} — build an engine for lower-level use.
 */

import { RankingEngine, type RankingEngineOptions } from "./engine"

export * from "./types"
export * from "./utils"
export * from "./ranking-registry"
export * from "./ranking-pipeline"
export * from "./engine"
export * from "./ranking-service"

/**
 * Build a {@link RankingEngine}. Mirrors the analytics layer's `createEngine()`
 * so the two frameworks feel consistent to callers.
 */
export function createRankingEngine(options: RankingEngineOptions = {}): RankingEngine {
  return new RankingEngine(options)
}
