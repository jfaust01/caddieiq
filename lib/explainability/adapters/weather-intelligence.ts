/**
 * Adapter: Weather Intelligence → Explanation (signal family, not a score).
 *
 * Weather Intelligence is a signal family, not a 0–100 score, so the headline
 * value is `null` and the band carries the golf-relevant playability read. Each
 * family characteristic (wind, rain, temperature, playability, tee-time wave)
 * becomes a descriptive, context-only contributor carrying its real measured
 * value. The truthful lifecycle status (via `statusReport`) and any data gaps
 * become explicit limitations — a completed or unlocated event degrades
 * honestly instead of implying a forecast exists.
 */

import type { WeatherIntelligence, WeatherGap } from "@/lib/weather-intelligence/types"
import { fromGraded } from "../confidence"
import { buildHeadline, emptyNarrative, round1 } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, Explanation, ExplanationSubject, Limitation } from "../types"

function titleCase(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function gapMessage(gap: WeatherGap): string {
  const base: Record<WeatherGap["code"], string> = {
    "tournament-not-found": "The event could not be resolved.",
    "no-host-course": "No host course is linked, so there is no venue to forecast.",
    "course-missing-coordinates": "The host course has no coordinates, so no forecast can be located.",
    "beyond-forecast-horizon": "The event is beyond the provider's ~5-day forecast horizon, so no snapshot exists yet.",
    "no-snapshot": "No forecast snapshot has been imported for this event.",
    "no-periods": "The snapshot carried no usable forecast periods.",
    "forecast-stale": "The forecast snapshot is stale.",
    "rounds-uncovered": "Some tournament rounds are outside the covered forecast window.",
    "signal-missing": "A forecast signal was missing from the snapshot.",
  }
  return `${base[gap.code]}${gap.detail ? ` (${gap.detail})` : ""}`
}

export function toWeatherExplanation(
  weather: WeatherIntelligence,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("weather-intelligence")
  const family = weather.family
  const confidence = fromGraded(weather.confidence)

  const contributors: Contributor[] = []
  if (family.status === "available") {
    if (family.wind) {
      contributors.push({
        key: "wind",
        label: "Wind",
        description: `${titleCase(family.wind)}${family.avgWindMph !== null ? ` — avg ${round1(family.avgWindMph)} mph${family.maxGustMph !== null ? `, gusts to ${round1(family.maxGustMph)} mph` : ""}` : ""}.`,
        rawValue: family.avgWindMph !== null ? round1(family.avgWindMph) : family.wind,
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: false,
      })
    }
    if (family.rain) {
      contributors.push({
        key: "rain",
        label: "Precipitation",
        description: `${titleCase(family.rain)}${family.maxRainProbability !== null ? ` — peak ${Math.round(family.maxRainProbability * 100)}% chance` : ""}.`,
        rawValue: family.maxRainProbability !== null ? Math.round(family.maxRainProbability * 100) : family.rain,
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: false,
      })
    }
    if (family.temperature) {
      contributors.push({
        key: "temperature",
        label: "Temperature",
        description: `${titleCase(family.temperature)}${family.avgTempF !== null ? ` — avg ${round1(family.avgTempF)}°F` : ""}.`,
        rawValue: family.avgTempF !== null ? round1(family.avgTempF) : family.temperature,
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: false,
      })
    }
    if (family.waveAdvantage && family.waveAdvantage !== "unknown") {
      contributors.push({
        key: "wave-advantage",
        label: "Tee-Time Wave Edge",
        description: family.waveAdvantage === "neutral" ? "Neither wave is favored by the conditions." : `The ${family.waveAdvantage} wave is favored by the conditions.`,
        rawValue: family.waveAdvantage,
        normalizedValue: null,
        weightPct: null,
        contribution: null,
        direction: "neutral",
        confidence,
        independent: false,
      })
    }
  }

  const limitations: Limitation[] = []
  const report = weather.statusReport
  // Surface the truthful lifecycle state whenever no live/forecast signal is present.
  if (family.status !== "available") {
    limitations.push({ code: `weather-status:${report.code}`, message: `${report.label} — ${report.description}` })
  }
  for (const gap of weather.gaps) {
    limitations.push({ code: `weather-gap:${gap.code}`, message: gapMessage(gap) })
  }

  const reasoning: string[] = []
  if (family.status === "available") {
    if (family.playability) reasoning.push(`Overall course playability: ${titleCase(family.playability)}.`)
    if (family.stability) reasoning.push(`Conditions are ${family.stability}-stability across the window.`)
    if (family.forecastAgeHours !== null) reasoning.push(`Forecast captured ${Math.round(family.forecastAgeHours)}h ago.`)
  } else {
    reasoning.push(report.label)
  }

  return {
    model,
    subject,
    headline: buildHeadline({
      value: null,
      unit: "none",
      band: family.playability ? family.playability.toUpperCase() : null,
      confidence,
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "verified-forecast",
        message: "Every signal traces to a verified provider forecast snapshot; missing values are reported, never fabricated.",
      },
    ],
    limitations,
    provenance: {
      sources: ["Weather Intelligence (OpenWeather snapshots)"],
      asOf: weather.provenance?.capturedAt ?? null,
    },
    narrative: emptyNarrative(),
  }
}
