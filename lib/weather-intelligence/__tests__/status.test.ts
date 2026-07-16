import { describe, expect, it } from "vitest"

import { computeWeatherStatus, resolvePhase, FORECAST_HORIZON_DAYS } from "../status"

const NOW = new Date("2026-07-16T12:00:00.000Z")

/** Convenience: a date `days` from NOW (negative = past). */
function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000)
}

describe("resolvePhase", () => {
  it("classifies future, current, and past at day granularity", () => {
    expect(resolvePhase(daysFromNow(3), daysFromNow(6), NOW)).toBe("future")
    expect(resolvePhase(daysFromNow(-1), daysFromNow(2), NOW)).toBe("current")
    expect(resolvePhase(daysFromNow(-6), daysFromNow(-3), NOW)).toBe("past")
  })

  it("treats an undated event as future (never fabricates live/historical)", () => {
    expect(resolvePhase(null, null, NOW)).toBe("future")
  })

  it("treats a single-day event (no end date) as ending the day it starts", () => {
    // Starts and ends today → current.
    expect(resolvePhase(daysFromNow(0), null, NOW)).toBe("current")
    // Started and ended yesterday → past.
    expect(resolvePhase(daysFromNow(-1), null, NOW)).toBe("past")
  })
})

describe("computeWeatherStatus", () => {
  const base = {
    now: NOW,
    hasCoordinates: true,
    hasSnapshot: false,
    providerSupportsHistorical: false,
  }

  it("future event beyond the horizon → forecast-not-yet-available", () => {
    const s = computeWeatherStatus({ ...base, startDate: daysFromNow(60), endDate: daysFromNow(63) })
    expect(s.code).toBe("forecast-not-yet-available")
    expect(s.refreshEligible).toBe(false)
    expect(s.awaitingImport).toBe(false)
  })

  it("future event inside the window with no snapshot → awaiting-forecast-import", () => {
    const s = computeWeatherStatus({ ...base, startDate: daysFromNow(3), endDate: daysFromNow(6) })
    expect(s.code).toBe("awaiting-forecast-import")
    expect(s.refreshEligible).toBe(true)
    expect(s.awaitingImport).toBe(true)
  })

  it("future event inside the window with a snapshot → forecast-available", () => {
    const s = computeWeatherStatus({ ...base, hasSnapshot: true, startDate: daysFromNow(2), endDate: daysFromNow(5) })
    expect(s.code).toBe("forecast-available")
    expect(s.tone).toBe("positive")
  })

  it("current event with a snapshot → live-forecast", () => {
    const s = computeWeatherStatus({ ...base, hasSnapshot: true, startDate: daysFromNow(-1), endDate: daysFromNow(2) })
    expect(s.code).toBe("live-forecast")
  })

  it("eligible event whose last import failed → weather-import-failed", () => {
    const s = computeWeatherStatus({
      ...base,
      startDate: daysFromNow(3),
      endDate: daysFromNow(6),
      lastImportFailed: true,
    })
    expect(s.code).toBe("weather-import-failed")
    expect(s.tone).toBe("warning")
    expect(s.refreshEligible).toBe(true)
  })

  it("a snapshot supersedes a stale failure flag (success is the latest truth)", () => {
    const s = computeWeatherStatus({
      ...base,
      hasSnapshot: true,
      startDate: daysFromNow(3),
      endDate: daysFromNow(6),
      lastImportFailed: true,
    })
    expect(s.code).toBe("forecast-available")
  })

  it("completed event, forecast-only provider → historical-unavailable (not 'awaiting')", () => {
    const s = computeWeatherStatus({ ...base, hasSnapshot: true, startDate: daysFromNow(-6), endDate: daysFromNow(-3) })
    expect(s.code).toBe("historical-unavailable")
    expect(s.awaitingImport).toBe(false)
    expect(s.refreshEligible).toBe(false)
  })

  it("completed event with a historical-capable provider + snapshot → historical-available", () => {
    const s = computeWeatherStatus({
      ...base,
      hasSnapshot: true,
      providerSupportsHistorical: true,
      startDate: daysFromNow(-6),
      endDate: daysFromNow(-3),
    })
    expect(s.code).toBe("historical-available")
  })

  it("future event without coordinates → coordinates-unavailable", () => {
    const s = computeWeatherStatus({ ...base, hasCoordinates: false, startDate: daysFromNow(3), endDate: daysFromNow(6) })
    expect(s.code).toBe("coordinates-unavailable")
    expect(s.refreshEligible).toBe(false)
  })

  it("past event without coordinates is still historical (past resolves first)", () => {
    const s = computeWeatherStatus({ ...base, hasCoordinates: false, startDate: daysFromNow(-6), endDate: daysFromNow(-3) })
    expect(s.code).toBe("historical-unavailable")
  })

  it("confirmed provider outage on an eligible event → provider-unavailable", () => {
    const s = computeWeatherStatus({
      ...base,
      startDate: daysFromNow(3),
      endDate: daysFromNow(6),
      providerOnline: false,
    })
    expect(s.code).toBe("provider-unavailable")
  })

  it("an unprobed provider (undefined) does not assert an outage", () => {
    const s = computeWeatherStatus({ ...base, startDate: daysFromNow(3), endDate: daysFromNow(6) })
    expect(s.code).toBe("awaiting-forecast-import")
  })

  it("the horizon boundary is inclusive", () => {
    const s = computeWeatherStatus({ ...base, startDate: daysFromNow(FORECAST_HORIZON_DAYS), endDate: daysFromNow(FORECAST_HORIZON_DAYS + 2) })
    expect(s.code).toBe("awaiting-forecast-import")
  })
})
