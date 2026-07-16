/**
 * Tests for the Course Characteristics Enrichment Engine.
 *
 * Validates that characteristics are derived correctly from course data
 * and that unknown values are properly left null rather than fabricated.
 */

import { describe, it, expect } from "vitest"
import type { Course as CourseRecord } from "@/lib/generated/prisma/client"
import { enrichCourseCharacteristics } from "../course-characteristics-engine"

const baseCourse = (overrides: Partial<CourseRecord> = {}): CourseRecord => ({
  id: "test-course-1",
  name: "Test Course",
  slug: "test-course",
  city: "Test City",
  stateProvince: "TS",
  country: "US",
  par: null,
  yardage: null,
  altitudeFt: null,
  establishedYear: null,
  website: null,
  latitude: null,
  longitude: null,
  coordinateConfidence: "UNKNOWN",
  coordinateSource: null,
  coordinatesVerifiedAt: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

describe("enrichCourseCharacteristics", () => {
  describe("unknown values stay null", () => {
    it("returns all null when course has no par/yardage", () => {
      const course = baseCourse()
      const result = enrichCourseCharacteristics(course)

      expect(result.courseId).toBe("test-course-1")
      expect(result.drivingImportance).toBeNull()
      expect(result.approachImportance).toBeNull()
      expect(result.shortGameImportance).toBeNull()
      expect(result.puttingImportance).toBeNull()
      expect(result.style).toBeNull()
      expect(result.fairwayGrass).toBeNull()
      expect(result.greenSpeed).toBeNull()
      expect(result.birdieRate).toBeNull()
    })
  })

  describe("shot-importance weights derivation", () => {
    it("par-3: emphasizes approach and putting", () => {
      const course = baseCourse({ par: 3, yardage: 170 })
      const result = enrichCourseCharacteristics(course)

      expect(result.drivingImportance).toBe(0.15)
      expect(result.approachImportance).toBe(0.40)
      expect(result.shortGameImportance).toBe(0.20)
      expect(result.puttingImportance).toBe(0.25)
    })

    it("par-4: balanced", () => {
      const course = baseCourse({ par: 4, yardage: 390 })
      const result = enrichCourseCharacteristics(course)

      expect(result.drivingImportance).toBe(0.35)
      expect(result.approachImportance).toBe(0.35)
      expect(result.shortGameImportance).toBe(0.15)
      expect(result.puttingImportance).toBe(0.15)
    })

    it("par-5: driving-heavy", () => {
      const course = baseCourse({ par: 5, yardage: 560 })
      const result = enrichCourseCharacteristics(course)

      expect(result.drivingImportance).toBe(0.50)
      expect(result.approachImportance).toBe(0.25)
      expect(result.shortGameImportance).toBe(0.15)
      expect(result.puttingImportance).toBe(0.10)
    })

    it("par-6+: driving-heavy (same as par-5)", () => {
      const course = baseCourse({ par: 6, yardage: 680 })
      const result = enrichCourseCharacteristics(course)

      expect(result.drivingImportance).toBe(0.50)
      expect(result.approachImportance).toBe(0.25)
      expect(result.shortGameImportance).toBe(0.15)
      expect(result.puttingImportance).toBe(0.10)
    })
  })

  describe("style derivation", () => {
    it("returns null (no reliable source data)", () => {
      const course = baseCourse({ par: 72, yardage: 7200 })
      const result = enrichCourseCharacteristics(course)
      expect(result.style).toBeNull()
    })
  })

  describe("elevation handling", () => {
    it("returns 0 when altitudeFt is present", () => {
      const course = baseCourse({ altitudeFt: 5280 })
      const result = enrichCourseCharacteristics(course)
      expect(result.elevationChange).toBe(0)
    })

    it("returns null when altitudeFt is missing", () => {
      const course = baseCourse({ altitudeFt: null })
      const result = enrichCourseCharacteristics(course)
      expect(result.elevationChange).toBeNull()
    })
  })

  describe("complete enrichment", () => {
    it("produces a valid characteristics record", () => {
      const course = baseCourse({
        par: 72,
        yardage: 7100,
        altitudeFt: 2000,
      })
      const result = enrichCourseCharacteristics(course)

      // Verify structure
      expect(result).toHaveProperty("courseId")
      expect(result).toHaveProperty("drivingImportance")
      expect(result).toHaveProperty("approachImportance")
      expect(result).toHaveProperty("shortGameImportance")
      expect(result).toHaveProperty("puttingImportance")

      // Verify no fabricated values
      expect(result.fairwayGrass).toBeNull()
      expect(result.greenSpeed).toBeNull()
      expect(result.birdieRate).toBeNull()
      expect(result.bogeyRate).toBeNull()
      expect(result.varianceRating).toBeNull()
    })
  })
})
