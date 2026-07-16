import { describe, expect, it } from "vitest"

import type {
  WeatherRepository,
  WeatherSnapshotRow,
  WeatherVenueRow,
} from "@/lib/repositories"

import { WeatherIntelligenceService } from "../service"

const DAY_MS = 86_400_000

/** A located venue row; overridable per test. */
function venueRow(overrides: Partial<WeatherVenueRow> = {}): WeatherVenueRow {
  return {
    tournamentId: "t_1",
    tournamentName: "Test Open",
    courseId: "course_1",
    courseName: "Test Links",
    latitude: 33.7,
    longitude: -78.9,
    coordinateConfidence: "VERIFIED",
    startDate: new Date(Date.now() + 2 * DAY_MS),
    endDate: new Date(Date.now() + 5 * DAY_MS),
    numberOfRounds: 4,
    ...overrides,
  }
}

/**
 * A repository double returning a fixed venue and snapshot. `snapshot` defaults
 * to null (the empty-table case that the whole task is about).
 */
function fakeRepo(
  venue: WeatherVenueRow | null,
  snapshot: WeatherSnapshotRow | null = null,
): WeatherRepository {
  return {
    findWeatherVenueById: async () => venue,
    findByTournamentId: async () => snapshot,
  } as unknown as WeatherRepository
}

describe("WeatherIntelligenceService — honest empty states", () => {
  it("flags an event beyond the forecast horizon as expected, not a missing import", async () => {
    const venue = venueRow({ startDate: new Date(Date.now() + 63 * DAY_MS) })
    const service = new WeatherIntelligenceService(fakeRepo(venue))

    const wx = await service.getForTournament("t_1")

    expect(wx.family.status).toBe("unavailable")
    expect(wx.gaps.map((g) => g.code)).toContain("beyond-forecast-horizon")
    // The days-out count is carried for the UI copy.
    expect(wx.gaps.find((g) => g.code === "beyond-forecast-horizon")?.detail).toBe("63")
    // It must NOT be misreported as a missing import.
    expect(wx.gaps.map((g) => g.code)).not.toContain("no-snapshot")
  })

  it("reports a genuine missing import when the event is within the horizon", async () => {
    const venue = venueRow({ startDate: new Date(Date.now() + 2 * DAY_MS) })
    const service = new WeatherIntelligenceService(fakeRepo(venue))

    const wx = await service.getForTournament("t_1")

    expect(wx.family.status).toBe("unavailable")
    expect(wx.gaps.map((g) => g.code)).toContain("no-snapshot")
    expect(wx.gaps.map((g) => g.code)).not.toContain("beyond-forecast-horizon")
  })

  it("does not claim a horizon gap when the venue has no coordinates", async () => {
    const venue = venueRow({ latitude: null, longitude: null, coordinateConfidence: null })
    const service = new WeatherIntelligenceService(fakeRepo(venue))

    const wx = await service.getForTournament("t_1")

    // Coordinate resolution fails first — that is the actionable gap.
    expect(wx.gaps.map((g) => g.code)).toContain("course-missing-coordinates")
    expect(wx.gaps.map((g) => g.code)).not.toContain("beyond-forecast-horizon")
  })
})
