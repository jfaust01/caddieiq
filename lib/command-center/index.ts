/**
 * Tournament Command Center — derived-summary barrel.
 *
 * Pure, deterministic derivations over existing engine output: Morning Brief,
 * Tournament Story, Trending, and AI Coach. No I/O, no fabrication.
 */

export * from "./types"
export { buildMorningBrief, type BuildMorningBriefInputs } from "./brief"
export { buildTournamentStory, type BuildTournamentStoryInputs } from "./story"
export { buildTrending, type BuildTrendingInputs } from "./trending"
export { buildCoachRecommendations, type BuildCoachInputs } from "./ai-coach"
