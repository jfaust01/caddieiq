import { describe, expect, it } from "vitest"

import {
  buildCourseProfile,
  getCharacteristic,
  hasVerifiedIntelligence,
  pickCharacteristics,
} from "../profile"
import type { CourseCharacteristicInput, CourseProfileInput } from "../profile-types"

/** A fully-null characteristic record (nothing verified). */
const EMPTY_CHARACTERISTIC: CourseCharacteristicInput = {
  style: null,
  fairwayGrass: null,
  roughGrass: null,
  greenGrass: null,
  greenSpeed: null,
  fairwayWidth: null,
  roughLength: null,
  treeLined: null,
  waterHazards: null,
  windExposure: null,
  elevationChange: null,
  drivingImportance: null,
  approachImportance: null,
  shortGameImportance: null,
  puttingImportance: null,
  scramblingDifficulty: null,
  birdieRate: null,
  bogeyRate: null,
  varianceRating: null,
}

const BARE_INPUT: CourseProfileInput = {
  courseId: "course_1",
  par: null,
  yardage: null,
  altitudeFt: null,
  characteristic: null,
}

describe("buildCourseProfile — honesty guarantees", () => {
  it("models every characteristic even with no data at all", () => {
    const profile = buildCourseProfile(BARE_INPUT)
    expect(profile.characteristics.length).toBeGreaterThan(0)
    expect(profile.coverage.total).toBe(profile.characteristics.length)
  })

  it("reports every characteristic as unknown when there is no source data", () => {
    const profile = buildCourseProfile(BARE_INPUT)
    expect(profile.coverage.verified).toBe(0)
    expect(profile.characteristics.every((c) => c.signal.status === "unknown")).toBe(true)
    expect(hasVerifiedIntelligence(profile)).toBe(false)
  })

  it("treats a present-but-empty characteristic record as fully unknown", () => {
    const profile = buildCourseProfile({ ...BARE_INPUT, characteristic: EMPTY_CHARACTERISTIC })
    expect(profile.coverage.verified).toBe(0)
  })

  it("never fabricates: non-finite source values stay unknown", () => {
    const profile = buildCourseProfile({
      ...BARE_INPUT,
      yardage: Number.NaN,
      characteristic: { ...EMPTY_CHARACTERISTIC, greenSpeed: Number.POSITIVE_INFINITY },
    })
    expect(getCharacteristic(profile, "length")?.signal.status).toBe("unknown")
    expect(getCharacteristic(profile, "greenSpeed")?.signal.status).toBe("unknown")
  })
})

describe("buildCourseProfile — verified facts", () => {
  it("formats measured facts with units", () => {
    const profile = buildCourseProfile({
      ...BARE_INPUT,
      par: 72,
      yardage: 7435,
      altitudeFt: 650,
    })
    const par = getCharacteristic(profile, "par")?.signal
    const length = getCharacteristic(profile, "length")?.signal
    const elevation = getCharacteristic(profile, "elevation")?.signal
    expect(par).toMatchObject({ status: "verified", kind: "measure", value: 72, display: "Par 72" })
    expect(length).toMatchObject({ status: "verified", display: "7,435 yds" })
    expect(elevation).toMatchObject({ status: "verified", display: "650 ft" })
  })

  it("maps categorical tokens to labels and ignores unknown tokens", () => {
    const profile = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, style: "LINKS", greenGrass: "POA" },
    })
    expect(getCharacteristic(profile, "courseType")?.signal).toMatchObject({
      status: "verified",
      display: "Links",
    })
    expect(getCharacteristic(profile, "greenSurface")?.signal).toMatchObject({
      status: "verified",
      display: "Poa annua",
    })
  })
})

describe("buildCourseProfile — rating normalization", () => {
  it("bands green speed by the documented Stimpmeter thresholds", () => {
    const slow = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, greenSpeed: 9 },
    })
    const fast = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, greenSpeed: 13 },
    })
    expect(getCharacteristic(slow, "greenSpeed")?.signal).toMatchObject({ band: "low" })
    expect(getCharacteristic(fast, "greenSpeed")?.signal).toMatchObject({ band: "high", raw: 13 })
  })

  it("bands 0–1 importance weights into tertiles", () => {
    const profile = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, drivingImportance: 0.8, puttingImportance: 0.5 },
    })
    expect(getCharacteristic(profile, "drivingImportance")?.signal).toMatchObject({ band: "high" })
    expect(getCharacteristic(profile, "puttingImportance")?.signal).toMatchObject({ band: "medium" })
  })

  it("projects the treeLined boolean onto low/high", () => {
    const lined = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, treeLined: true },
    })
    const open = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, treeLined: false },
    })
    expect(getCharacteristic(lined, "treeCoverage")?.signal).toMatchObject({ band: "high" })
    expect(getCharacteristic(open, "treeCoverage")?.signal).toMatchObject({ band: "low" })
  })
})

describe("buildCourseProfile — scoring environment", () => {
  it("classifies a penal setup as a major championship", () => {
    const profile = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, birdieRate: 0.14, bogeyRate: 0.3 },
    })
    expect(getCharacteristic(profile, "scoringEnvironment")?.signal).toMatchObject({
      value: "major-championship",
    })
  })

  it("classifies a soft setup as a birdie fest", () => {
    const profile = buildCourseProfile({
      ...BARE_INPUT,
      characteristic: { ...EMPTY_CHARACTERISTIC, birdieRate: 0.24, bogeyRate: 0.12 },
    })
    expect(getCharacteristic(profile, "scoringEnvironment")?.signal).toMatchObject({
      value: "birdie-fest",
    })
  })

  it("stays unknown when neither rate is present", () => {
    const profile = buildCourseProfile({ ...BARE_INPUT, characteristic: EMPTY_CHARACTERISTIC })
    expect(getCharacteristic(profile, "scoringEnvironment")?.signal.status).toBe("unknown")
  })
})

describe("selectors", () => {
  it("picks an ordered subset by key", () => {
    const profile = buildCourseProfile(BARE_INPUT)
    const picked = pickCharacteristics(profile, ["length", "windExposure", "scoringEnvironment"])
    expect(picked.map((c) => c.meta.key)).toEqual(["length", "windExposure", "scoringEnvironment"])
  })
})
