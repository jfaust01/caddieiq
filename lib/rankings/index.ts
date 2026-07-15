/**
 * CaddieIQ Ranking Engine (concrete).
 *
 * Reusable rankings built entirely from the Analytics Engine. Given the
 * analytics the platform already produces, this engine orders players into
 * typed leaderboards (Overall, Recent Form, Fantasy, Consistency, Season) that
 * every surface shares — player-page badges, tournament-field sorting, and the
 * tournament hub's leaders. It never recomputes performance scores, so rankings
 * always agree with the ratings shown elsewhere, and future AI explanations can
 * reference these rankings instead of recalculating them.
 *
 * Layers:
 *   - {@link ./types}       — the shared ranking contract (RankingTypes).
 *   - {@link ./calculator}  — the pure ordering core (RankingCalculator).
 *   - {@link ./service}     — server-only orchestration (RankingService).
 *
 * There is no RankingRepository: rankings are derived, never persisted, and the
 * player universes they rank are resolved through the Analytics Engine.
 *
 * Not to be confused with `@/lib/ranking` (singular) — the older scaffold-only
 * framework that returns mock rankings for the standalone rankings explorer.
 */

export * from "./types"
export {
  RANKING_CATEGORY_META,
  RANKING_CATEGORY_ORDER,
  buildBoardSet,
  ranksByPlayer,
  selectPlayerProfile,
} from "./calculator"
export { rankingService } from "./service"
