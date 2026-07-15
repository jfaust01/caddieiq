import { describe, expect, it, vi } from "vitest"

import { ProviderError } from "@/lib/providers/shared/errors"
import {
  buildNominatimQuery,
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

/** A repository test double capturing setVerifiedCoordinates calls. */
function fakeRepository(
  setImpl: (id: string, c: VerifiedCoordinatesInput) => Promise<RepositoryResult<CourseRecord>>,
  targets: CourseGeocodeTargetRow[] = [TARGET],
): CourseRepository {
  return {
    findCoursesNeedingCoordinates: vi.fn(async () => targets),
    setVerifiedCoordinates: vi.fn(setImpl),
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

  it("skips an estimated (non-verified) match without persisting", async () => {
    const set = vi.fn(async () => ({ outcome: "updated" }) as RepositoryResult<CourseRecord>)
    const repo = fakeRepository(set)
    const estimated: GeocodeMatch = { ...verifiedMatch, confidence: "estimated" }
    const service = new CourseGeolocationService(repo, fakeProvider(async () => estimated))

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("skipped")
    expect(outcome.reason).toBe("unverified-match")
    expect(set).not.toHaveBeenCalled()
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

  it("treats a repository skip (already verified) as a skip, not a verify", async () => {
    const repo = fakeRepository(async () => ({ outcome: "skipped" }))
    const service = new CourseGeolocationService(repo, fakeProvider(async () => verifiedMatch))

    const outcome = await service.locateCourse(TARGET)

    expect(outcome.status).toBe("skipped")
    expect(outcome.reason).toBe("already-verified")
  })
})

describe("CourseGeolocationService.locatePendingCourses", () => {
  it("aggregates outcomes across the backlog", async () => {
    const targets: CourseGeocodeTargetRow[] = [
      { ...TARGET, id: "a", name: "Verified GC" },
      { ...TARGET, id: "b", name: "Missing GC" },
      { ...TARGET, id: "c", name: "Boom GC" },
    ]
    const provider = fakeProvider(async (q) => {
      if (q.courseName === "Verified GC") return verifiedMatch
      if (q.courseName === "Missing GC") return null
      throw new ProviderError("boom", { provider: "fake" })
    })
    const repo = fakeRepository(async () => ({ outcome: "updated" }), targets)
    const service = new CourseGeolocationService(repo, provider)

    const summary = await service.locatePendingCourses()

    expect(summary.coursesConsidered).toBe(3)
    expect(summary.verified).toBe(1)
    expect(summary.skippedNotFound).toBe(1)
    expect(summary.failed).toBe(1)
  })
})
