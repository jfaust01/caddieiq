import { describe, expect, it, vi } from "vitest"

import { ProviderError } from "../../shared/errors"
import { CompositeGeocodingProvider } from "../composite"
import type { GeocodingProvider } from "../provider"
import type { GeocodeMatch, GeocodeQuery } from "../types"

const QUERY: GeocodeQuery = { courseName: "Test GC", city: "Testville", country: "USA" }

const verifiedMatch: GeocodeMatch = {
  latitude: 1,
  longitude: 2,
  confidence: "verified",
  source: "osm-nominatim",
  displayName: "Test GC, Testville",
  matchType: "golf_course",
}
const cityMatch: GeocodeMatch = {
  latitude: 3,
  longitude: 4,
  confidence: "estimated",
  source: "openweather-geocoding",
  displayName: "Testville, US",
  matchType: "city",
}

function fake(name: string, impl: () => Promise<GeocodeMatch | null>): GeocodingProvider {
  return { name, geocodeCourse: vi.fn(impl) }
}

describe("CompositeGeocodingProvider", () => {
  it("returns the primary's verified match and never calls the fallback", async () => {
    const fallback = fake("fallback", async () => cityMatch)
    const provider = new CompositeGeocodingProvider(
      fake("primary", async () => verifiedMatch),
      fallback,
    )
    const result = await provider.geocodeCourse(QUERY)
    expect(result).toEqual(verifiedMatch)
    expect(fallback.geocodeCourse).not.toHaveBeenCalled()
  })

  it("falls back to the city match only when the primary finds nothing", async () => {
    const provider = new CompositeGeocodingProvider(
      fake("primary", async () => null),
      fake("fallback", async () => cityMatch),
    )
    expect(await provider.geocodeCourse(QUERY)).toEqual(cityMatch)
  })

  it("returns null when neither provider locates the course", async () => {
    const provider = new CompositeGeocodingProvider(
      fake("primary", async () => null),
      fake("fallback", async () => null),
    )
    expect(await provider.geocodeCourse(QUERY)).toBeNull()
  })

  it("behaves as primary-only when no fallback is configured", async () => {
    const provider = new CompositeGeocodingProvider(fake("primary", async () => verifiedMatch))
    expect(await provider.geocodeCourse(QUERY)).toEqual(verifiedMatch)
  })

  it("still tries the fallback when the primary throws (best-effort coverage)", async () => {
    const provider = new CompositeGeocodingProvider(
      fake("primary", async () => {
        throw new ProviderError("boom", { provider: "primary", code: "NETWORK_ERROR" })
      }),
      fake("fallback", async () => cityMatch),
    )
    expect(await provider.geocodeCourse(QUERY)).toEqual(cityMatch)
  })

  it("surfaces the primary error (not a false 'not found') when it threw and the fallback is empty", async () => {
    const provider = new CompositeGeocodingProvider(
      fake("primary", async () => {
        throw new ProviderError("rate limited", { provider: "primary", code: "RATE_LIMIT_ERROR" })
      }),
      fake("fallback", async () => null),
    )
    await expect(provider.geocodeCourse(QUERY)).rejects.toThrow("rate limited")
  })

  it("throws the primary error when it threw and there is no fallback", async () => {
    const provider = new CompositeGeocodingProvider(
      fake("primary", async () => {
        throw new ProviderError("down", { provider: "primary", code: "CONNECTION_ERROR" })
      }),
    )
    await expect(provider.geocodeCourse(QUERY)).rejects.toThrow("down")
  })
})
