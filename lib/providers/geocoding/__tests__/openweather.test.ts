import { describe, expect, it } from "vitest"

import { buildOpenWeatherQuery, selectCityMatch, type OpenWeatherGeoResult } from "../openweather"

describe("buildOpenWeatherQuery", () => {
  it("returns null when there is no city to anchor on (never geocodes by course name)", () => {
    expect(buildOpenWeatherQuery({ courseName: "Augusta National", city: null })).toBeNull()
    expect(buildOpenWeatherQuery({ courseName: "X", city: "   " })).toBeNull()
  })

  it("includes the US state only for US courses", () => {
    expect(
      buildOpenWeatherQuery({ courseName: "X", city: "Augusta", stateProvince: "GA", country: "USA" }),
    ).toBe("Augusta,GA,US")
  })

  it("omits the state for non-US countries even when a region is present", () => {
    // A non-US 'state' is meaningless to OpenWeather's US-only state segment.
    expect(
      buildOpenWeatherQuery({ courseName: "X", city: "St Andrews", stateProvince: "Fife", country: "SCO" }),
    ).toBe("St Andrews,GB")
  })

  it("returns null when there is no disambiguating anchor (unknown country, no US state)", () => {
    // A bare city is globally ambiguous — refuse rather than risk the wrong country.
    expect(buildOpenWeatherQuery({ courseName: "X", city: "Dubai", country: "ZZZ" })).toBeNull()
    expect(buildOpenWeatherQuery({ courseName: "X", city: "Ayrshire", country: null })).toBeNull()
  })

  it("infers US from a valid state code even when the country field is blank", () => {
    expect(
      buildOpenWeatherQuery({ courseName: "X", city: "Chaska", stateProvince: "MN", country: null }),
    ).toBe("Chaska,MN,US")
  })
})

describe("selectCityMatch", () => {
  const source = "openweather-geocoding"

  it("selects the first in-range result as an estimated city match", () => {
    const results: OpenWeatherGeoResult[] = [
      { name: "Augusta", lat: 33.47, lon: -81.97, country: "US", state: "Georgia" },
    ]
    const match = selectCityMatch(results, source)
    expect(match).toEqual({
      latitude: 33.47,
      longitude: -81.97,
      confidence: "estimated",
      source,
      displayName: "Augusta, Georgia, US",
      matchType: "city",
    })
  })

  it("skips out-of-range or non-finite coordinates", () => {
    const results: OpenWeatherGeoResult[] = [
      { name: "Bad", lat: 999, lon: 0, country: "US" },
      { name: "AlsoBad", lat: Number.NaN, lon: 10, country: "US" },
      { name: "Good", lat: 51.5, lon: -0.12, country: "GB" },
    ]
    expect(selectCityMatch(results, source)?.displayName).toBe("Good, GB")
  })

  it("returns null when nothing resolves (never fabricates)", () => {
    expect(selectCityMatch([], source)).toBeNull()
  })

  it("reports confidence 'estimated' — never 'verified' — so it can only become APPROXIMATE", () => {
    const match = selectCityMatch([{ name: "X", lat: 1, lon: 2, country: "US" }], source)
    expect(match?.confidence).toBe("estimated")
  })
})
