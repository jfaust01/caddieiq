import { describe, expect, it } from "vitest"
import type { Course, Player, Tournament } from "../../domain"
import {
  computeQualityScore,
  evaluateCourse,
  evaluatePlayer,
  evaluateTournament,
  validatePlayers,
} from ".."

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    externalRef: { source: "sportsdataio", externalId: "40000123" },
    firstName: "Rory",
    lastName: "McIlroy",
    fullName: "Rory McIlroy",
    slug: "rory-mcilroy",
    birthDate: new Date("1989-05-04"),
    heightCm: 175,
    weightKg: 73,
    turnedProYear: 2007,
    handedness: "RIGHT",
    status: "ACTIVE",
    headshotUrl: null,
    countryCode: "Northern Ireland",
    ...overrides,
  }
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    externalRef: { source: "sportsdataio", externalId: "c-100" },
    name: "Augusta National",
    slug: "augusta-national",
    city: "Augusta",
    stateProvince: "GA",
    country: "USA",
    par: 72,
    yardage: 7475,
    latitude: null,
    longitude: null,
    ...overrides,
  }
}

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    externalRef: { source: "sportsdataio", externalId: "t-1" },
    name: "The Masters",
    officialName: "The Masters Tournament",
    slug: "the-masters",
    status: "SCHEDULED",
    format: "STROKE_PLAY",
    startDate: new Date("2025-04-10"),
    endDate: new Date("2025-04-13"),
    purse: 20000000,
    ...overrides,
  }
}

describe("computeQualityScore", () => {
  it("scores a clean entity 100", () => {
    expect(computeQualityScore([])).toBe(100)
  })

  it("deducts 5 per warning and 25 per error, floored at 0", () => {
    expect(
      computeQualityScore([{ code: "SUSPECT_VALUE", severity: "warning", message: "" }]),
    ).toBe(95)
    expect(
      computeQualityScore([
        { code: "REQUIRED_FIELD_MISSING", severity: "error", message: "" },
        { code: "SUSPECT_VALUE", severity: "warning", message: "" },
      ]),
    ).toBe(70)
    expect(
      computeQualityScore(
        Array.from({ length: 6 }, () => ({
          code: "REQUIRED_FIELD_MISSING" as const,
          severity: "error" as const,
          message: "",
        })),
      ),
    ).toBe(0)
  })
})

describe("evaluatePlayer", () => {
  it("passes a complete player with score 100", () => {
    const report = evaluatePlayer(makePlayer())
    expect(report.isValid).toBe(true)
    expect(report.score).toBe(100)
    expect(report.errors).toHaveLength(0)
  })

  it("flags missing required names as errors", () => {
    const report = evaluatePlayer(makePlayer({ firstName: "", lastName: "" }))
    expect(report.isValid).toBe(false)
    expect(report.errors.some((issue) => issue.path === "firstName")).toBe(true)
  })

  it("flags a future birth date as an error", () => {
    const report = evaluatePlayer(makePlayer({ birthDate: new Date("2999-01-01") }))
    expect(report.errors.some((issue) => issue.code === "DATE_RANGE_INVALID")).toBe(true)
  })

  it("warns (not errors) on an implausible country code", () => {
    const report = evaluatePlayer(makePlayer({ countryCode: "12345" }))
    expect(report.isValid).toBe(true)
    expect(report.warnings.some((issue) => issue.code === "INVALID_COUNTRY_CODE")).toBe(true)
  })
})

describe("evaluateCourse", () => {
  it("errors on out-of-range coordinates", () => {
    const course = { ...makeCourse(), latitude: 999, longitude: 0 } as unknown as Course
    const report = evaluateCourse(course)
    expect(report.errors.some((issue) => issue.code === "INVALID_COORDINATES")).toBe(true)
  })

  it("errors when par is out of range", () => {
    const report = evaluateCourse(makeCourse({ par: 5 }))
    expect(report.errors.some((issue) => issue.code === "NUMBER_OUT_OF_RANGE")).toBe(true)
  })
})

describe("evaluateTournament", () => {
  it("errors when end date precedes start date", () => {
    const report = evaluateTournament(
      makeTournament({
        startDate: new Date("2025-04-13"),
        endDate: new Date("2025-04-10"),
      }),
    )
    expect(report.errors.some((issue) => issue.code === "DATE_RANGE_INVALID")).toBe(true)
  })
})

describe("validatePlayers (batch duplicate detection)", () => {
  it("flags duplicate external identifiers and slugs across the batch", () => {
    const outcome = validatePlayers([
      makePlayer({ externalRef: { source: "sportsdataio", externalId: "dup" }, slug: "a" }),
      makePlayer({ externalRef: { source: "sportsdataio", externalId: "dup" }, slug: "a" }),
    ])
    expect(outcome.summary.total).toBe(2)
    expect(outcome.summary.valid).toBe(0)
    for (const entry of outcome.evaluated) {
      expect(entry.report.errors.some((issue) => issue.code === "DUPLICATE_IDENTIFIER")).toBe(true)
      expect(entry.report.errors.some((issue) => issue.code === "DUPLICATE_SLUG")).toBe(true)
    }
  })

  it("summarizes a clean batch", () => {
    const outcome = validatePlayers([
      makePlayer({ externalRef: { source: "sportsdataio", externalId: "1" }, slug: "one" }),
      makePlayer({ externalRef: { source: "sportsdataio", externalId: "2" }, slug: "two" }),
    ])
    expect(outcome.summary.valid).toBe(2)
    expect(outcome.summary.averageScore).toBe(100)
  })
})
