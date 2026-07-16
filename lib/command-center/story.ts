/**
 * Tournament Story — an auto-generated narrative overview.
 *
 * Assembles a handful of plain-language paragraphs (field strength, course-fit
 * landscape, weather outlook, betting landscape, DFS landscape) strictly from
 * values the engines already produced. A paragraph is included only when its
 * inputs are present, so the story never asserts anything unverified.
 */

import type { TournamentField } from "@/features/tournaments/types"
import type { WeatherIntelligence } from "@/lib/weather-intelligence"
import type { TournamentOddsView } from "@/lib/odds-intelligence"
import type { DfsValueField } from "@/lib/dfs-value"
import type { FieldFitBoard } from "@/lib/analytics/course-fit"

import type { StoryParagraph, TournamentStory } from "./types"

export interface BuildTournamentStoryInputs {
  readonly field: TournamentField
  readonly fitBoard: FieldFitBoard
  readonly weather: WeatherIntelligence
  readonly odds: TournamentOddsView
  readonly dfsField: DfsValueField
}

/**
 * Build the Tournament Story. Every sentence cites a present value; sections
 * with no imported data are omitted rather than filled with placeholders.
 */
export function buildTournamentStory(inputs: BuildTournamentStoryInputs): TournamentStory {
  const { field, fitBoard, weather, odds, dfsField } = inputs
  const paragraphs: StoryParagraph[] = []

  // Field strength.
  const summary = field.analyticsSummary
  if (field.size > 0 && summary && summary.ratedPlayers > 0) {
    paragraphs.push({
      id: "story-field",
      heading: "The Field",
      body: `${field.size} players are in the field, ${summary.ratedPlayers} of them with rated season data. This is a ${describeStrength(summary.averageRating)} field by CaddieIQ's Analytics Engine.`,
    })
  }

  // Course-fit landscape.
  if (fitBoard.scoredPlayers > 0 && fitBoard.topFits[0]?.result.score !== null) {
    const leader = fitBoard.topFits[0]
    paragraphs.push({
      id: "story-fit",
      heading: "Course Fit",
      body: `Course fit was scored for ${fitBoard.scoredPlayers} of ${fitBoard.totalPlayers} entrants. ${leader.displayName} profiles as the strongest fit at ${Math.round(leader.result.score as number)} / 100${leader.result.band ? ` (${leader.result.band})` : ""}.`,
    })
  }

  // Weather outlook.
  if (weather.detail) {
    paragraphs.push({
      id: "story-weather",
      heading: "Conditions",
      body: weather.detail,
    })
  } else if (weather.status === "available" && weather.current) {
    const parts: string[] = []
    if (weather.current.temperatureF !== null) parts.push(`${Math.round(weather.current.temperatureF)}\u00b0F`)
    if (weather.current.windSpeedMph !== null) parts.push(`${Math.round(weather.current.windSpeedMph)} mph wind`)
    if (parts.length > 0) {
      paragraphs.push({
        id: "story-weather",
        heading: "Conditions",
        body: `Current conditions at the venue: ${parts.join(", ")}.`,
      })
    }
  }

  // Betting landscape.
  const market = odds.markets[0]
  if (odds.confidence !== "unavailable" && market && market.selections.length > 0) {
    const fav = market.selections[0]
    paragraphs.push({
      id: "story-odds",
      heading: "The Betting Market",
      body: `The market makes ${fav.selection} the favorite at ${Math.round(fav.fairProbability * 100)}% fair win probability, priced across ${fav.bookCount} book${fav.bookCount === 1 ? "" : "s"}. Market confidence is ${odds.confidence}.`,
    })
  }

  // DFS landscape.
  if (dfsField.ratedPlayers > 0) {
    const topBoard = dfsField.boards.find((b) => b.key === "topValues")
    const top = topBoard?.entries[0]
    const lead = top ? ` ${top.displayName} leads the value board — ${top.headline}.` : ""
    paragraphs.push({
      id: "story-dfs",
      heading: "DFS Value",
      body: `The DFS Value model scored ${dfsField.ratedPlayers} of ${dfsField.totalPlayers} entrants (${dfsField.pricedPlayers} with a salary), at ${dfsField.averageConfidence} average confidence.${lead}`,
    })
  }

  return { paragraphs }
}

/** Map a 0–100 average strength to a factual descriptor. */
function describeStrength(avg: number | null): string {
  if (avg === null) return "mixed"
  if (avg >= 75) return "elite"
  if (avg >= 60) return "strong"
  if (avg >= 45) return "solid"
  return "wide-open"
}
