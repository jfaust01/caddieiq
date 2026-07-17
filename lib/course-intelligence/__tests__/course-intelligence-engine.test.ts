/**
 * Course Intelligence Engine tests.
 *
 * Verify deterministic calculations and edge cases.
 */

import { describe, it, expect } from "vitest"
import { generateCourseIntelligence, getCourseIntelligenceHash } from "../course-intelligence-engine"
import type { CourseAnalysisInput } from "../types"

/**
 * Sample course data: average difficulty course.
 */
const SAMPLE_COURSE_INPUT: CourseAnalysisInput = {
  courseId: "test-course-1",
  par: 72,
  totalYardage: 6800,
  courseRating: 72.5,
  slopeRating: 130,
  courseStyle: "parkland",
  greenSize: "medium",
  greenSpeed: "stimp-11",
  elevation: 500,
  holes: [
    // Front nine
    { holeNumber: 1, par: 4, yardage: 385, handicap: 5 },
    { holeNumber: 2, par: 4, yardage: 410, handicap: 3 },
    { holeNumber: 3, par: 3, yardage: 165, handicap: 15 },
    { holeNumber: 4, par: 5, yardage: 612, handicap: 1 },
    { holeNumber: 5, par: 4, yardage: 398, handicap: 7 },
    { holeNumber: 6, par: 3, yardage: 147, handicap: 17 },
    { holeNumber: 7, par: 4, yardage: 425, handicap: 9 },
    { holeNumber: 8, par: 3, yardage: 156, handicap: 13 },
    { holeNumber: 9, par: 4, yardage: 387, handicap: 11 },
    // Back nine
    { holeNumber: 10, par: 4, yardage: 395, handicap: 2 },
    { holeNumber: 11, par: 4, yardage: 421, handicap: 4 },
    { holeNumber: 12, par: 3, yardage: 178, handicap: 14 },
    { holeNumber: 13, par: 4, yardage: 408, handicap: 6 },
    { holeNumber: 14, par: 5, yardage: 541, handicap: 8 },
    { holeNumber: 15, par: 3, yardage: 162, handicap: 16 },
    { holeNumber: 16, par: 4, yardage: 415, handicap: 10 },
    { holeNumber: 17, par: 3, yardage: 148, handicap: 18 },
    { holeNumber: 18, par: 4, yardage: 430, handicap: 12 },
  ],
  tees: [
    { teeName: "Black", yardage: 6800, rating: 74.2, slope: 135 },
    { teeName: "Blue", yardage: 6400, rating: 72.5, slope: 130 },
    { teeName: "White", yardage: 6000, rating: 70.8, slope: 125 },
    { teeName: "Red", yardage: 5400, rating: 68.5, slope: 115 },
  ],
}

describe("Course Intelligence Engine", () => {
  it("generates intelligence with all metrics", () => {
    const intelligence = generateCourseIntelligence(SAMPLE_COURSE_INPUT)

    expect(intelligence).toBeDefined()
    expect(intelligence.courseId).toBe("test-course-1")
    expect(intelligence.generatedAt).toBeInstanceOf(Date)

    // Verify all metrics exist and are in valid range
    const metrics = [
      intelligence.overallDifficulty,
      intelligence.drivingImportance,
      intelligence.approachImportance,
      intelligence.shortGameImportance,
      intelligence.puttingImportance,
      intelligence.windSensitivity,
      intelligence.penaltySeverity,
      intelligence.birdiePotential,
      intelligence.scoringVolatility,
    ]

    metrics.forEach((metric) => {
      expect(metric.stars).toBeGreaterThanOrEqual(1)
      expect(metric.stars).toBeLessThanOrEqual(5)
      expect(metric.score).toBeGreaterThanOrEqual(0)
      expect(metric.score).toBeLessThanOrEqual(100)
    })
  })

  it("is deterministic - identical input produces identical output", () => {
    const result1 = generateCourseIntelligence(SAMPLE_COURSE_INPUT)
    const result2 = generateCourseIntelligence(SAMPLE_COURSE_INPUT)

    // All metrics should be identical
    expect(result1.overallDifficulty).toEqual(result2.overallDifficulty)
    expect(result1.drivingImportance).toEqual(result2.drivingImportance)
    expect(result1.approachImportance).toEqual(result2.approachImportance)
    expect(result1.shortGameImportance).toEqual(result2.shortGameImportance)
    expect(result1.puttingImportance).toEqual(result2.puttingImportance)
    expect(result1.windSensitivity).toEqual(result2.windSensitivity)
    expect(result1.penaltySeverity).toEqual(result2.penaltySeverity)
    expect(result1.birdiePotential).toEqual(result2.birdiePotential)
    expect(result1.scoringVolatility).toEqual(result2.scoringVolatility)
  })

  it("hash changes when input changes", () => {
    const hash1 = getCourseIntelligenceHash(SAMPLE_COURSE_INPUT)

    // Modify a hole
    const modifiedInput: CourseAnalysisInput = {
      ...SAMPLE_COURSE_INPUT,
      holes: [
        ...SAMPLE_COURSE_INPUT.holes.slice(0, -1),
        { holeNumber: 18, par: 5, yardage: 500, handicap: 12 }, // Changed par and yardage
      ],
    }

    const hash2 = getCourseIntelligenceHash(modifiedInput)

    expect(hash1).not.toBe(hash2)
  })

  it("hash is deterministic", () => {
    const hash1 = getCourseIntelligenceHash(SAMPLE_COURSE_INPUT)
    const hash2 = getCourseIntelligenceHash(SAMPLE_COURSE_INPUT)

    expect(hash1).toBe(hash2)
  })

  it("handles difficult course (high slope)", () => {
    const difficultCourse: CourseAnalysisInput = {
      ...SAMPLE_COURSE_INPUT,
      slopeRating: 150,
      courseRating: 75,
    }

    const intelligence = generateCourseIntelligence(difficultCourse)

    // Should have high difficulty
    expect(intelligence.overallDifficulty.score).toBeGreaterThan(60)
    // Birdie potential should be lower
    expect(intelligence.birdiePotential.score).toBeLessThan(50)
  })

  it("handles easy course (low slope)", () => {
    const easyCourse: CourseAnalysisInput = {
      ...SAMPLE_COURSE_INPUT,
      slopeRating: 110,
      courseRating: 70,
    }

    const intelligence = generateCourseIntelligence(easyCourse)

    // Should have lower difficulty
    expect(intelligence.overallDifficulty.score).toBeLessThan(50)
    // Birdie potential should be higher
    expect(intelligence.birdiePotential.score).toBeGreaterThan(50)
  })

  it("recognizes links-style courses with high wind sensitivity", () => {
    const linksCourse: CourseAnalysisInput = {
      ...SAMPLE_COURSE_INPUT,
      courseStyle: "Links",
    }

    const intelligence = generateCourseIntelligence(linksCourse)

    // Links courses should have high wind sensitivity
    expect(intelligence.windSensitivity.score).toBeGreaterThan(60)
  })

  it("handles edge case: minimal data", () => {
    const minimalInput: CourseAnalysisInput = {
      courseId: "minimal",
      holes: SAMPLE_COURSE_INPUT.holes,
      tees: [{ teeName: "Standard", yardage: 6500 }], // No rating/slope
    }

    const intelligence = generateCourseIntelligence(minimalInput)

    // Should still generate valid metrics
    expect(intelligence).toBeDefined()
    expect(intelligence.overallDifficulty.stars).toBeGreaterThanOrEqual(1)
    expect(intelligence.overallDifficulty.stars).toBeLessThanOrEqual(5)
  })
})
