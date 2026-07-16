/**
 * AI Caddie answerer grounded in the Weather Intelligence Engine.
 *
 * "What's the weather / wind this week?" → the overall golf-weather
 * characteristics plus wave advantage. Player-level "wind beneficiaries" are
 * NOT fabricated: the platform does not model per-player wind edges, so we say
 * so honestly and report the conditions the engine actually holds.
 */

import type { WeatherIntelligence } from "@/lib/weather-intelligence/types"
import type { CaddieAnswer } from "../types"
import { emptyAnswer, fromWeatherConfidence } from "./shared"

const ENGINE = "Weather Intelligence Engine"

export function answerWeather(weather: WeatherIntelligence | null, tournamentName: string): CaddieAnswer {
  if (!weather || weather.status === "unavailable" || !weather.overall) {
    const detail = weather?.detail ?? "Forecast isn't available yet"
    return emptyAnswer("weather", tournamentName, ENGINE, detail, [
      "Best cash plays?",
      "Who fits the course?",
      "Odds favorites?",
    ])
  }

  const o = weather.overall
  const bullets: string[] = []
  if (o.avgWindMph != null) {
    bullets.push(
      `Average wind ${Math.round(o.avgWindMph)} mph${o.windSeverity ? ` (${o.windSeverity})` : ""}${
        o.maxGustMph != null ? `, gusts to ${Math.round(o.maxGustMph)} mph` : ""
      }`,
    )
  }
  if (o.maxRainProbability != null) {
    bullets.push(`Peak rain chance ${Math.round(o.maxRainProbability * 100)}%${o.rainSeverity ? ` (${o.rainSeverity})` : ""}`)
  }
  if (o.avgTempF != null) {
    bullets.push(`Average temperature ${Math.round(o.avgTempF)}°F${o.temperatureComfort ? ` (${o.temperatureComfort})` : ""}`)
  }
  if (o.playability) bullets.push(`Overall playability: ${o.playability}`)
  if (weather.waveAdvantage === "morning" || weather.waveAdvantage === "afternoon") {
    bullets.push(`Wave advantage favors the ${weather.waveAdvantage} wave`)
  }

  return {
    intent: "weather",
    headline: "Weather outlook",
    summary: `Forecast conditions for ${tournamentName}${weather.venue?.courseName ? ` at ${weather.venue.courseName}` : ""}.`,
    bullets: bullets.length > 0 ? bullets : ["Forecast captured, but no golf-relevant extremes stand out."],
    entities: [],
    citations: [
      {
        engine: ENGINE,
        confidence: fromWeatherConfidence(weather.confidence),
        detail: "Per-player wind edges are not modeled",
      },
    ],
    confidence: fromWeatherConfidence(weather.confidence),
    followUps: ["Best GPP plays?", "Who fits the course?", "Odds favorites?"],
    isEmpty: false,
  }
}
