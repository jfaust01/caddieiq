import { describe, expect, it, vi } from "vitest"

import { ProviderError } from "@/lib/providers/shared/errors"
import {
  buildNominatimQuery,
  buildNominatimQueryVariants,
  isGolfCourseFeature,
  normalizeCourseName,
  selectVerifiedGolfMatch,
  type NominatimRawResult,
} from "@/lib/providers/geocoding"
import type { GeocodingProvider, GeocodeMatch, GeocodeQuery } from "@/lib/providers/geocoding"
import type {
  CourseGeocodeTargetRow,
  CourseRepository,
  VerifiedCoordinatesInput,
} from "@/lib/repositories"
import type { RepositoryResult } from "@/lib/repositories"
import type { Course as CourseRecord } from "@/lib/generated/prisma/client"

import { CourseGeolocationService } from "../course-geolocation"

// --- selectVerifiedGolfMatch (pure honesty gate) ---------------------------

const golfResult: NominatimRawResult = {
  lat: "36.5687",
  lon: "-121.9503",
  class: "leisure",
  type: "golf_course",
  display_name: "Pebble Beach Golf Links, Monterey County, California",
}

describe("selectVerifiedGolfMatch", () => {
  it("returns a verified match for a genuine golf_course feature", () => {
    const match = selectVerifiedGolfMatch([golfResult], "osm-nominatim")
    expect(match).not.toBeNull()
    expect(match?.confidence).toBe("verified")
    expect(match?.latitude).toBeCloseTo(36.5687, 4)
    expect(match?.longitude).toBeCloseTo(-121.9503, 4)
    expect(match?.source).toBe("osm-nominatim")
    expect(match?.matchType).toBe("leisure:golf_course")
  })

  it("ignores a locality centroid (place/city) — never fabricates", () => {
    const city: NominatimRawResult = {
      lat: "36.6",
      lon: "-121.9",
      class: "place",
      type: "city",
      display_name: "Monterey, California",
    }
    expect(selectVerifiedGolfMatch([city], "osm-nominatim")).toBeNull()
  })

  it("skips non-golf results and picks the first real golf feature", () => {
    const results: NominatimRawResult[] = [
      { class: "highway", type: "residential", lat: "1", lon: "2" },
      { class: "place", type: "hamlet", lat: "3", lon: "4" },
      golfResult,
    ]
    expect(selectVerifiedGolfMatch(results, "osm-nominatim")?.latitude).toBeCloseTo(36.5687, 4)
  })

  it("rejects a golf feature with an out-of-range coordinate", () => {
    const bad: NominatimRawResult = { class: "leisure", type: "golf_course", lat: "999", lon: "0" }
    expect(selectVerifiedGolfMatch([bad], "osm-nominatim")).toBeNull()
  })

  it("returns null for an empty result set", () => {
    expect(selectVerifiedGolfMatch([], "osm-nominatim")).toBeNull()
  })

  it("verifies a golf_course tagged via the jsonv2 `category` field", () => {
    // Real jsonv2 responses put the category on `category`, leaving `class`
    // undefined — e.g. Augusta National. This must still verify.
    const jsonv2Golf: NominatimRawResult = {
      lat: "33.5006",
      lon: "-82.0226",
      category: "leisure",
      type: "golf_course",
      addresstype: "leisure",
      display_name: "Augusta National Golf Club, Augusta, GA",
    }
    const match = selectVerifiedGolfMatch([jsonv2Golf], "osm-nominatim")
    expect(match?.confidence).toBe("verified")
    expect(match?.matchType).toBe("leisure:golf_course")
  })

  it("rejects a clubhouse POI tagged `restaurant` — honesty over coverage", () => {
    // Pebble Beach's node is mapped as a restaurant, not a golf_course; we must
    // not auto-verify it (the user chose the strict golf-feature-only rule).
    const clubhouse: NominatimRawResult = {
      lat: "36.5697",
      lon: "-121.9497",
      category: "amenity",
      type: "restaurant",
      display_name: "Pebble Beach Golf Links, 17 Mile Drive, Pebble Beach",
    }
    expect(selectVerifiedGolfMatch([clubhouse], "osm-nominatim")).toBeNull()
  })
})

describe("isGolfCourseFeature", () => {
  it.each([
    ["jsonv2 category", { category: "leisure", type: "golf_course" }, true],
    ["legacy class", { class: "leisure", type: "golf_course" }, true],
    ["addresstype only", { addresstype: "leisure", type: "golf" }, true],
    ["restaurant POI", { category: "amenity", type: "restaurant" }, false],
    ["locality centroid", { category: "place", type: "city" }, false],
    ["leisure but not golf", { category: "leisure", type: "park" }, false],
    ["missing type", { category: "leisure" }, false],
  ] satisfies Array<[string, NominatimRawResult, boolean]>)(
    "%s -> %s",
    (_label, raw, expected) => {
      expect(isGolfCourseFeature(raw)).toBe(expected)
    },
  )
})

describe("buildNominatimQuery", () => {
  it("joins the present locality parts and drops blanks", () => {
    expect(
      buildNominatimQuery({
        courseName: "Augusta National",
        city: "Augusta",
        stateProvince: "GA",
        country: null,
      }),
    ).toBe("Augusta National, Augusta, GA")
  })
})

describe("normalizeCourseName", () => {
  it.each([
    ["Torrey Pines (North)", "Torrey Pines"],
    ["Chambers Bay GC", "Chambers Bay Golf Course"],
    ["Plainfield CC", "Plainfield Country Club"],
    ["Kuala Lumpur G&CC", "Kuala Lumpur Golf and Country Club"],
    ["Silverado CC (North)", "Silverado Country Club"],
    ["Pebble Beach Golf Links", "Pebble Beach Golf Links"],
  ])("normalizes %s -> %s", (input, expected) => {
    expect(normalizeCourseName(input)).toBe(expected)
  })
})

describe("buildNominatimQueryVariants", () => {
  it("yields raw then normalized, de-duplicated", () => {
    expect(
      buildNominatimQueryVariants({
        courseName: "Chambers Bay GC",
        city: "University Place",
        stateProvince: "WA",
        country: "USA",
      }),
    ).toEqual([
      "Chambers Bay GC, University Place, WA, USA",
      "Chambers Bay Golf Course, University Place, WA, USA",
    ])
  })

  it("collapses to a single variant when normalization is a no-op", () => {
    expect(
      buildNominatimQueryVariants({
        courseName: "Augusta National Golf Club",
        city: null,
        stateProvince: null,
        country: null,
      }),
    ).toEqual(["Augusta National Golf Club"])
  })
})

// --- CourseGeolocationService ----------------------------------------------

const TARGET: CourseGeocodeTargetRow = {
  id: "course_1",
  name: "Pebble Beach Golf Links",
  city: "Pebble Beach",
  stateProvince: "CA",
  country: "USA",
}

/** A provider that returns a fixed result (or throws) for every query. */
function fakeProvider(
  impl: (q: GeocodeQuery) => Promise<GeocodeMatch | null>,
): GeocodingProvider {
  return { name: "fake", geocodeCourse: impl }
}

/**
 * A repository test double. `setImpl` backs BOTH tiers (verified + approximate)
 * so a single stub can assert either write path; pass a distinct
 * `setApproximateImpl` when a test needs to differentiate the two.
 */
function fakeRepository(
  setImpl: (id: string, c: VerifiedCoordinatesInput) => Promise<RepositoryResult<CourseRecord>>,
  targets: CourseGeocodeTargetRow[] = [TARGET],
  setApproximateImpl?: (
    id: string,
    c: VerifiedCoordinatesInput,
  ) => Promise<RepositoryResult<CourseRecord>>,
): CourseRepository {
  return {
    findCoursesNeedingCoordinates: vi.fn(async () => targets),
    setVerifiedCoordinates: vi.fn(setImpl),
    setApproximateCoordinates: vi.fn(setApproximateImpl ?? setImpl),
  } as unknown as CourseRepository
}

const verifiedMatch: GeocodeMatch = {
  latitude: 36.5687,
  longitude: -121.9503,
  confidence: "verified",
  source: "osm-nominatim",
  displayName: "Pebble Beach Golf Links",
  matchType: "leisure:golf_course",
}

describe("CourseGeolocationService.locateCourse", () => {
  it("persists a verified match and reports verified", async () => {
    const set = vi.fn(async () => ({ outcome: "updated" }) as RepositoryResult<CourseRecord>)
    const repo = fakeRepository(set)
    const service = new CourseGeolocationService(repo, fakeProvider(async () => verifiedMatch))

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("verified")
    expect(outcome.coordinates).toEqual({
      latitude: 36.5687,
      longitude: -121.9503,
      source: "osm-nominatim",
      tier: "verified",
    })
    expect(set).toHaveBeenCalledWith("course_1", {
      latitude: 36.5687,
      longitude: -121.9503,
      source: "osm-nominatim",
    })
  })

  it("skips (never persists) when the provider finds nothing", async () => {
    const set = vi.fn(async () => ({ outcome: "updated" }) as RepositoryResult<CourseRecord>)
    const repo = fakeRepository(set)
    const service = new CourseGeolocationService(repo, fakeProvider(async () => null))

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("skipped")
    expect(outcome.reason).toBe("not-found")
    expect(set).not.toHaveBeenCalled()
  })

  it("persists an estimated (city-level) match as APPROXIMATE, not VERIFIED", async () => {
    const setVerified = vi.fn(async () => ({ outcome: "updated" }) as RepositoryResult<CourseRecord>)
    const setApprox = vi.fn(async () => ({ outcome: "updated" }) as RepositoryResult<CourseRecord>)
    const repo = fakeRepository(setVerified, [TARGET], setApprox)
    const estimated: GeocodeMatch = {
      ...verifiedMatch,
      confidence: "estimated",
      source: "openweather-geocoding",
    }
    const service = new CourseGeolocationService(repo, fakeProvider(async () => estimated))

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("approximate")
    expect(outcome.coordinates?.tier).toBe("approximate")
    expect(outcome.coordinates?.source).toBe("openweather-geocoding")
    // Routed to the approximate writer only — never the verified one.
    expect(setApprox).toHaveBeenCalledOnce()
    expect(setVerified).not.toHaveBeenCalled()
  })

  it("captures a provider failure without throwing", async () => {
    const repo = fakeRepository(async () => ({ outcome: "updated" }))
    const service = new CourseGeolocationService(
      repo,
      fakeProvider(async () => {
        throw new ProviderError("nominatim down", { provider: "osm-nominatim" })
      }),
    )

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("failed")
    expect(outcome.error).toContain("nominatim down")
  })

  it("treats a repository skip (already resolved) as a skip, not a verify", async () => {
    const repo = fakeRepository(async () => ({ outcome: "skipped" }))
    const service = new CourseGeolocationService(repo, fakeProvider(async () => verifiedMatch))

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("skipped")
    expect(outcome.reason).toBe("already-resolved")
  })
})

describe("CourseGeolocationService.locatePendingCourses", () => {
  it("aggregates outcomes across the backlog", async () => {
    const targets: CourseGeocodeTargetRow[] = [
      { ...TARGET, id: "a", name: "Verified GC" },
      { ...TARGET, id: "b", name: "Missing GC" },
      { ...TARGET, id: "c", name: "Boom GC" },
      { ...TARGET, id: "d", name: "City Only GC" },
    ]
    const provider = fakeProvider(async (q) => {
      if (q.courseName === "Verified GC") return verifiedMatch
      if (q.courseName === "Missing GC") return null
      if (q.courseName === "City Only GC") {
        return { ...verifiedMatch, confidence: "estimated", source: "openweather-geocoding" }
      }
      throw new ProviderError("boom", { provider: "fake" })
    })
    const repo = fakeRepository(async () => ({ outcome: "updated" }), targets)
    const service = new CourseGeolocationService(repo, provider)

    const summary = await service.locatePendingCourses()

    expect(summary.coursesConsidered).toBe(4)
    expect(summary.verified).toBe(1)
    expect(summary.approximate).toBe(1)
    expect(summary.skippedNotFound).toBe(1)
    expect(summary.failed).toBe(1)
  })
})
