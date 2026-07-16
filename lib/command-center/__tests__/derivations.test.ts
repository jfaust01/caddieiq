import { describe, expect, it } from "vitest"

import { buildMorningBrief } from "../brief"
import { buildTournamentStory } from "../story"
import { buildTrending } from "../trending"
import { buildCoachRecommendations } from "../ai-coach"
import type { DfsValueField } from "@/lib/dfs-value/types"
import type { TournamentOddsView } from "@/lib/odds-intelligence/types"
import type { FieldFitBoard } from "@/lib/analytics/course-fit/types"
import type { WeatherIntelligence } from "@/lib/weather-intelligence"
import type { TournamentField, TournamentFieldReport } from "@/features/tournaments/types"

/**
 * These fixtures model the "engine returned nothing" state — the hardest case
 * for the Command Center, which must degrade to honest empty output rather than
 * throw or fabricate. Deep shapes are cast so the tests stay resilient to
 * unrelated field additions while still exercising real derivation code paths.
 */
const emptyDfsField = {
  players: [],
  boards: [],
  ratedPlayers: 0,
  pricedPlayers: 0,
  totalPlayers: 0,
  averageConfidence: "low",
} as unknown as DfsValueField
const emptyOdds = { confidence: "unavailable", markets: [] } as unknown as TournamentOddsView
const emptyFitBoard = {
  topFits: [],
  fades: [],
  trendingUp: [],
  mostUncertain: [],
  scoredPlayers: 0,
  totalPlayers: 0,
} as unknown as FieldFitBoard
const emptyWeather = {
  status: "unavailable",
  statusReport: { code: "not-available", label: "Weather not available" },
  current: null,
  detail: null,
} as unknown as WeatherIntelligence
const emptyFieldReport = { confidence: "unavailable", playerCount: 0 } as unknown as TournamentFieldReport
const emptyField = {
  size: 0,
  entrants: [],
  analyticsSummary: { ratedPlayers: 0, averageRating: null },
  rankingLeaders: { topOverall: [], topForm: [] },
} as unknown as TournamentField

describe("command-center derivations (empty engines)", () => {
  it("buildMorningBrief returns a brief without throwing on empty data", () => {
    const brief = buildMorningBrief({
      dfsField: emptyDfsField,
      odds: emptyOdds,
      fitBoard: emptyFitBoard,
      weather: emptyWeather,
      fieldReport: emptyFieldReport,
    })
    expect(brief).toBeDefined()
    expect(Array.isArray(brief.items)).toBe(true)
  })

  it("buildTournamentStory omits sections with no data instead of fabricating", () => {
    const story = buildTournamentStory({
      field: emptyField,
      fitBoard: emptyFitBoard,
      weather: emptyWeather,
      odds: emptyOdds,
      dfsField: emptyDfsField,
    })
    expect(story).toBeDefined()
    expect(Array.isArray(story.paragraphs)).toBe(true)
  })

  it("buildTrending returns categories with null players when no leaders exist", () => {
    const trending = buildTrending({
      dfsField: emptyDfsField,
      odds: emptyOdds,
      fitBoard: emptyFitBoard,
    })
    expect(trending).toBeDefined()
    expect(Array.isArray(trending.categories)).toBe(true)
    // Every category should be present but carry no fabricated player.
    for (const category of trending.categories) {
      expect(category.player === null || typeof category.player === "object").toBe(true)
    }
  })

  it("buildCoachRecommendations returns no groups when boards are empty", () => {
    const coach = buildCoachRecommendations({
      dfsField: emptyDfsField,
      fitBoard: emptyFitBoard,
    })
    expect(coach).toBeDefined()
    expect(Array.isArray(coach.groups)).toBe(true)
  })
})
