import { describe, expect, it, vi } from "vitest"

import type { PrismaClient } from "@/lib/generated/prisma/client"
import type { OpenWeatherClient } from "@/lib/providers/weather/client"
import type {
  WeatherRepository,
  WeatherSnapshotRow,
  WeatherVenueRow,
} from "@/lib/repositories"

import { importWeather, probeWeatherProvider } from "../weather-import"

/** A prisma test double exposing only the tournament reads the importer uses. */
function fakePrisma(opts: {
  windowIds?: string[]
  nearest?: { name: string; startDate: Date } | null
}): PrismaClient {
  return {
    tournament: {
      findMany: vi.fn(async () => (opts.windowIds ?? []).map((id) => ({ id }))),
      findFirst: vi.fn(async () => opts.nearest ?? null),
    },
  } as unknown as PrismaClient
}

const venue: WeatherVenueRow = {
  tournamentId: "t1",
  tournamentName: "Test Open",
  courseId: "c1",
  courseName: "Test GC",
  latitude: 25.81,
  longitude: -80.34,
  coordinateConfidence: "VERIFIED",
  startDate: new Date("2026-07-16T00:00:00Z"),
  endDate: new Date("2026-07-19T00:00:00Z"),
  numberOfRounds: 4,
}

function fakeRepository(overrides: Partial<WeatherRepository> = {}): WeatherRepository {
  return {
    findWeatherVenueById: vi.fn(async () => venue),
    getCapturedAt: vi.fn(async () => null),
    replaceSnapshot: vi.fn(async () => ({ outcome: "updated" as const, data: {} as WeatherSnapshotRow })),
    // The importer now writes a per-tournament audit log for every considered
    // event; the double records the calls so tests can assert on them.
    createImportLog: vi.fn(async () => {}),
    ...overrides,
  } as unknown as WeatherRepository
}

function fakeForecastClient(periods: number): OpenWeatherClient {
  return {
    fetchForecast: vi.fn(async () => ({
      city: { timezone: -14400 },
      list: Array.from({ length: periods }, (_, i) => ({
        dt: Math.floor(Date.now() / 1000) + i * 3600 * 3,
        main: { temp: 20, feels_like: 20, humidity: 50, pressure: 1015 },
        wind: { speed: 3, deg: 180 },
        clouds: { all: 20 },
        pop: 0.1,
        weather: [{ id: 800, main: "Clear" }],
      })),
    })),
  } as unknown as OpenWeatherClient
}

describe("importWeather – selection transparency (no silent failures)", () => {
  it("explains an empty auto window instead of returning a silent zero", async () => {
    const nearest = { name: "Biltmore Championship", startDate: new Date(Date.now() + 60 * 86_400_000) }
    const summary = await importWeather({
      prisma: fakePrisma({ windowIds: [], nearest }),
      repository: fakeRepository(),
      client: fakeForecastClient(0),
    })

    expect(summary.tournamentsConsidered).toBe(0)
    expect(summary.selectionMode).toBe("auto")
    expect(summary.emptyReason).not.toBeNull()
    // The reason names the nearest event and frames it as expected, not failure.
    expect(summary.emptyReason).toContain("Biltmore Championship")
    expect(summary.emptyReason).toContain("expected")
    expect(summary.notes.length).toBeGreaterThan(0)
    expect(summary.failed).toBe(0)
  })

  it("reports the empty reason for an explicit run with no ids", async () => {
    const summary = await importWeather({
      prisma: fakePrisma({}),
      repository: fakeRepository(),
      tournamentIds: [],
    })
    // Empty explicit list falls through to auto; still explained, never silent.
    expect(summary.emptyReason).not.toBeNull()
  })

  it("stores a snapshot when a forecastable venue is selected", async () => {
    const repo = fakeRepository()
    const summary = await importWeather({
      prisma: fakePrisma({}),
      repository: repo,
      client: fakeForecastClient(8),
      tournamentIds: ["t1"],
    })

    expect(summary.selectionMode).toBe("explicit")
    expect(summary.fetched).toBe(1)
    expect(summary.stored).toBe(1)
    expect(summary.periodsStored).toBe(8)
    expect(summary.emptyReason).toBeNull()
    expect(repo.replaceSnapshot).toHaveBeenCalledOnce()
    // A STORED per-tournament log is recorded with an honest provider response.
    expect(repo.createImportLog).toHaveBeenCalledOnce()
    expect(repo.createImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tournamentId: "t1",
        result: "STORED",
        forecastEligible: true,
        periodsWritten: 8,
        rowsInserted: 1,
      }),
    )
  })

  it("skips a venue with no coordinates with an explicit note, never fetching", async () => {
    const client = fakeForecastClient(8)
    const repo = fakeRepository({
      findWeatherVenueById: vi.fn(async () => ({ ...venue, latitude: null, longitude: null, coordinateConfidence: null })),
    })
    const summary = await importWeather({
      prisma: fakePrisma({}),
      repository: repo,
      client,
      tournamentIds: ["t1"],
    })

    expect(summary.skippedNoCoordinates).toBe(1)
    expect(summary.fetched).toBe(0)
    expect(client.fetchForecast).not.toHaveBeenCalled()
    expect(summary.notes.some((n) => n.includes("no coordinates"))).toBe(true)
    // The skip is recorded as a SKIPPED, forecast-ineligible log with a reason.
    expect(repo.createImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "SKIPPED",
        forecastEligible: false,
        skippedReason: expect.stringContaining("coordinates"),
      }),
    )
  })
})

describe("probeWeatherProvider", () => {
  it("reports healthy when the provider returns a forecast", async () => {
    const health = await probeWeatherProvider(fakeForecastClient(40))
    expect(health.ok).toBe(true)
    expect(health.status).toBe(200)
    expect(health.periods).toBe(40)
    expect(health.error).toBeNull()
  })

  it("reports unhealthy (never throws) when the provider fails", async () => {
    const failing = {
      fetchForecast: vi.fn(async () => {
        throw new Error("OpenWeather rejected the API key.")
      }),
    } as unknown as OpenWeatherClient

    const health = await probeWeatherProvider(failing)
    expect(health.ok).toBe(false)
    expect(health.periods).toBe(0)
    expect(health.error).toContain("API key")
  })
})
