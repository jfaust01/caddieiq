/**
 * Morning Brief — the few verified headlines worth knowing right now.
 *
 * Pure, deterministic derivation over engine output. Each candidate line is
 * emitted only when its source signal is actually present; a tournament with
 * no imported intelligence yields an empty brief (honest empty state), never a
 * fabricated headline.
 */

import type { DfsValueField, DfsBoardEntry } from "@/lib/dfs-value"
import type { TournamentOddsView } from "@/lib/odds-intelligence"
import type { FieldFitBoard } from "@/lib/analytics/course-fit"
import type { WeatherIntelligence } from "@/lib/weather-intelligence"
import type { TournamentFieldReport } from "@/features/tournaments/types"

import type { BriefItem, MorningBrief } from "./types"

/** Status codes for which a live/loaded forecast reading exists to summarize. */
const FORECAST_STATUS_CODES = new Set([
  "forecast-available",
  "live-forecast",
  "historical-available",
])

/** First entry of a named DFS board, or `null` when the board is absent/empty. */
function topBoardEntry(dfsField: DfsValueField, key: string): DfsBoardEntry | null {
  const board = dfsField.boards.find((b) => b.key === key)
  return board?.entries[0] ?? null
}

/** A compact, honest weather chip (e.g. "72°F · 12 mph"), or `null`. */
function weatherChip(weather: WeatherIntelligence): string | null {
  if (!FORECAST_STATUS_CODES.has(weather.statusReport.code)) return null
  if (weather.status !== "available" || !weather.current) return null
  const parts: string[] = []
  if (weather.current.temperatureF !== null) parts.push(`${Math.round(weather.current.temperatureF)}\u00b0F`)
  if (weather.current.windSpeedMph !== null) parts.push(`${Math.round(weather.current.windSpeedMph)} mph`)
  return parts.length > 0 ? parts.join(" \u00b7 ") : null
}

export interface BuildMorningBriefInputs {
  readonly dfsField: DfsValueField
  readonly odds: TournamentOddsView
  readonly fitBoard: FieldFitBoard
  readonly weather: WeatherIntelligence
  readonly fieldReport: TournamentFieldReport
}

/**
 * Assemble the Morning Brief from verified engine output. Order reflects
 * decision priority: value → market → fit → conditions → field status.
 */
export function buildMorningBrief(inputs: BuildMorningBriefInputs): MorningBrief {
  const { dfsField, odds, fitBoard, weather, fieldReport } = inputs
  const items: BriefItem[] = []
  const sources: string[] = []

  // Top DFS value play.
  const topValue = topBoardEntry(dfsField, "topValues")
  if (topValue) {
    items.push({
      id: "brief-dfs",
      icon: "dfs",
      label: `Top DFS value: ${topValue.displayName}`,
      detail: topValue.headline,
      tone: "positive",
    })
    sources.push("DFS Value")
  }

  // Betting favorite (first market, selections are sorted most-likely first).
  const primaryMarket = odds.markets[0]
  const favorite = primaryMarket?.selections[0]
  if (odds.confidence !== "unavailable" && favorite) {
    items.push({
      id: "brief-odds",
      icon: "odds",
      label: `Betting favorite: ${favorite.selection}`,
      detail: `${Math.round(favorite.fairProbability * 100)}% fair win probability across ${favorite.bookCount} book${favorite.bookCount === 1 ? "" : "s"}`,
      tone: "neutral",
    })
    sources.push("Odds Intelligence")
  }

  // Strongest course fit.
  const bestFit = fitBoard.topFits[0]
  if (bestFit && bestFit.result.score !== null) {
    items.push({
      id: "brief-fit",
      icon: "course",
      label: `Best course fit: ${bestFit.displayName}`,
      detail: `Course fit ${Math.round(bestFit.result.score)} / 100${bestFit.result.band ? ` (${bestFit.result.band})` : ""}`,
      tone: "positive",
    })
    sources.push("Course Fit")
  }

  // Conditions.
  const chip = weatherChip(weather)
  if (chip) {
    items.push({
      id: "brief-weather",
      icon: "weather",
      label: "Conditions",
      detail: chip,
      tone: "neutral",
    })
    sources.push("Weather Intelligence")
  }

  // Field status.
  if (fieldReport.playerCount !== null && fieldReport.playerCount > 0) {
    items.push({
      id: "brief-field",
      icon: "field",
      label: "Field",
      detail: `${fieldReport.playerCount} players committed${fieldReport.confidence ? ` (${fieldReport.confidence} confidence)` : ""}`,
      tone: "neutral",
    })
    sources.push("Field Report")
  }

  return { items, sources: Array.from(new Set(sources)) }
}
