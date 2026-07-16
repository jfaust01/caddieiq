import { describe, expect, it } from "vitest"

import { buildWeatherIntelligence, unavailableIntelligence } from "../intelligence"
import type { WeatherIntelligenceInput, WeatherRawPeriod, WeatherVenue } from "../types"

const VENUE: WeatherVenue = {
  courseId: "course_1",
  courseName: "Test Links",
  latitude: 33.7,
  longitude: -78.9,
}

/** A period with everything null — the honest "no data" period. */
function emptyPeriod(forecastTime: Date): WeatherRawPeriod {
  return {
    forecastTime,
    temperatureC: null,
    feelsLikeC: null,
    windSpeedMs: null,
    windGustMs: null,
    windDeg: null,
    precipProbability: null,
    rainMm: null,
    humidity: null,
    cloudCover: null,
    pressureHpa: null,
    visibilityM: null,
    conditionCode: null,
    conditionLabel: null,
  }
}

function period(forecastTime: Date, o: Partial<WeatherRawPeriod>): WeatherRawPeriod {
  return { ...emptyPeriod(forecastTime), ...o }
}

/** Build a full-day (8 x 3h) forecast starting at local midnight UTC. */
function buildInput(
  periods: WeatherRawPeriod[],
  opts: Partial<WeatherIntelligenceInput> = {},
): WeatherIntelligenceInput {
  return {
    venue: { latitude: 33.7, longitude: -78.9, utcOffsetSeconds: 0 },
    displayVenue: VENUE,
    source: "openweather",
    capturedAt: opts.capturedAt ?? new Date("2026-05-07T06:00:00Z"),
    forecastStart: null,
    forecastEnd: null,
    periods,
    schedule: opts.schedule ?? {
      startDate: new Date("2026-05-07T00:00:00Z"),
      endDate: new Date("2026-05-10T00:00:00Z"),
      numberOfRounds: 4,
    },
    now: opts.now ?? new Date("2026-05-07T12:00:00Z"),
    ...opts,
  }
}

describe("buildWeatherIntelligence — honesty guarantees", () => {
  it("returns unavailable with a gap when there are no periods", () => {
    const wx = buildWeatherIntelligence(buildInput([]))
    expect(wx.status).toBe("unavailable")
    expect(wx.confidence).toBe("unavailable")
    expect(wx.gaps.map((g) => g.code)).toContain("no-periods")
    expect(wx.current).toBeNull()
    expect(wx.days).toHaveLength(0)
    // Still names the venue so the UI can show context.
    expect(wx.venue?.courseName).toBe("Test Links")
  })

  it("never invents signals a period did not carry", () => {
    // A single period with only wind — temp/rain must stay null, not zero.
    const wx = buildWeatherIntelligence(
      buildInput([period(new Date("2026-05-07T12:00:00Z"), { windSpeedMs: 5 })]),
    )
    expect(wx.status).toBe("available")
    expect(wx.current?.windSpeedMph).toBeGreaterThan(0)
    expect(wx.current?.temperatureF).toBeNull()
    expect(wx.current?.rainProbability).toBeNull()
  })

  it("unavailableIntelligence always carries a family for downstream models", () => {
    const wx = unavailableIntelligence([{ code: "no-snapshot" }], "nope")
    expect(wx.family.status).toBe("unavailable")
    expect(wx.family.confidence).toBe("unavailable")
  })
})

describe("signal conversions + severity", () => {
  it("converts metric inputs to imperial display units", () => {
    const wx = buildWeatherIntelligence(
      buildInput([
        period(new Date("2026-05-07T12:00:00Z"), {
          temperatureC: 20, // 68F
          windSpeedMs: 10, // ~22.4 mph
        }),
      ]),
    )
    expect(wx.current?.temperatureF).toBe(68)
    // 10 m/s ≈ 22.4 mph, kept to one decimal.
    expect(wx.current?.windSpeedMph).toBeCloseTo(22.4, 1)
  })

  it("classifies wind severity bands", () => {
    const calm = buildWeatherIntelligence(
      buildInput([period(new Date("2026-05-07T12:00:00Z"), { windSpeedMs: 2 })]),
    )
    const strong = buildWeatherIntelligence(
      buildInput([period(new Date("2026-05-07T12:00:00Z"), { windSpeedMs: 12 })]),
    )
    expect(calm.current?.windSeverity).toBe("calm")
    expect(["strong", "extreme"]).toContain(strong.current?.windSeverity)
  })

  it("classifies rain severity from probability + volume", () => {
    const wx = buildWeatherIntelligence(
      buildInput([
        period(new Date("2026-05-07T12:00:00Z"), { precipProbability: 0.9, rainMm: 6 }),
      ]),
    )
    expect(["moderate", "heavy"]).toContain(wx.current?.rainSeverity)
  })
})

describe("wave analysis", () => {
  it("flags a morning advantage when afternoon wind is materially worse", () => {
    // Morning calm, afternoon windy on the same local day.
    const day = "2026-05-07"
    const periods = [
      period(new Date(`${day}T09:00:00Z`), { windSpeedMs: 2, temperatureC: 15 }),
      period(new Date(`${day}T12:00:00Z`), { windSpeedMs: 3, temperatureC: 18 }),
      period(new Date(`${day}T15:00:00Z`), { windSpeedMs: 12, temperatureC: 20 }),
      period(new Date(`${day}T18:00:00Z`), { windSpeedMs: 14, temperatureC: 19 }),
    ]
    const wx = buildWeatherIntelligence(buildInput(periods, { now: new Date(`${day}T06:00:00Z`) }))
    const d = wx.days[0]
    expect(d.waves.advantage).toBe("morning")
  })

  it("reports neutral when waves are similar", () => {
    const day = "2026-05-07"
    const periods = [
      period(new Date(`${day}T09:00:00Z`), { windSpeedMs: 5 }),
      period(new Date(`${day}T15:00:00Z`), { windSpeedMs: 5 }),
    ]
    const wx = buildWeatherIntelligence(buildInput(periods, { now: new Date(`${day}T06:00:00Z`) }))
    expect(wx.days[0].waves.advantage).toBe("neutral")
  })
})

describe("round mapping + confidence", () => {
  it("labels forecast days with their tournament round", () => {
    const periods = [
      period(new Date("2026-05-07T15:00:00Z"), { windSpeedMs: 4 }),
      period(new Date("2026-05-08T15:00:00Z"), { windSpeedMs: 4 }),
    ]
    const wx = buildWeatherIntelligence(buildInput(periods, { now: new Date("2026-05-07T06:00:00Z") }))
    const rounds = wx.days.map((d) => d.round)
    expect(rounds).toContain("round-1")
    expect(rounds).toContain("round-2")
  })

  it("degrades confidence and records a gap for a stale forecast", () => {
    const wx = buildWeatherIntelligence(
      buildInput([period(new Date("2026-05-07T15:00:00Z"), { windSpeedMs: 4 })], {
        capturedAt: new Date("2026-05-05T00:00:00Z"), // ~60h before now
        now: new Date("2026-05-07T12:00:00Z"),
      }),
    )
    expect(wx.gaps.map((g) => g.code)).toContain("forecast-stale")
    expect(["low", "medium"]).toContain(wx.confidence)
  })

  it("records a gap when the forecast window misses rounds", () => {
    // Only round 1 covered of a 4-round event.
    const wx = buildWeatherIntelligence(
      buildInput([period(new Date("2026-05-07T15:00:00Z"), { windSpeedMs: 4 })], {
        now: new Date("2026-05-07T06:00:00Z"),
      }),
    )
    expect(wx.gaps.map((g) => g.code)).toContain("rounds-uncovered")
  })
})
