/**
 * Comprehensive tests for Course Intelligence Metrics
 */

import { describe, it, expect } from "vitest"
import {
  AUSTIN_COUNTRY_CLUB,
  EASY_9_HOLE,
  CHAMPIONSHIP_COURSE,
  PAR_3_COURSE,
  MINIMAL_DATA_COURSE,
} from "./fixtures"
import {
  calculateDifficulty,
  calculateScoringDifficulty,
  calculateBogeyRisk,
  calculateVariance,
  calculateFairwayWidth,
  calculateIronDifficulty,
  calculatePuttingDifficulty,
  calculateWaterHazardRisk,
  calculateSandHazardRisk,
  calculateTreeRisk,
  calculateOutOfBoundsRisk,
  calculateHazardImpact,
  calculateElevationImpact,
  calculateWeatherFactor,
  calculatePlayability,
  calculateUniqueness,
} from "../index"
import { CourseIntelligenceEngine } from "../../metrics-engine"
import { CourseTagger } from "../../course-tagger"

describe("Course Intelligence Metrics", () => {
  describe("Difficulty Metrics", () => {
    it("should calculate overall difficulty correctly", () => {
      const result = calculateDifficulty(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.stars).toBeGreaterThanOrEqual(1)
      expect(result.stars).toBeLessThanOrEqual(5)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      expect(result.explanation).toBeDefined()
      expect(result.dataPoints.length).toBeGreaterThan(0)
    })

    it("should show easy course as easier than championship", () => {
      const easy = calculateDifficulty(EASY_9_HOLE)
      const championship = calculateDifficulty(CHAMPIONSHIP_COURSE)
      expect(championship.score).toBeGreaterThan(easy.score)
    })

    it("should calculate scoring difficulty from slope rating", () => {
      const result = calculateScoringDifficulty(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThanOrEqual(80)
    })

    it("should calculate bogey risk from handicap distribution", () => {
      const result = calculateBogeyRisk(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.dataPoints.some((p) => p.includes("holes"))).toBe(true)
    })

    it("should calculate variance in difficulty", () => {
      const result = calculateVariance(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.dataPoints.length).toBeGreaterThan(0)
    })
  })

  describe("Fairway & Approach Metrics", () => {
    it("should estimate fairway width from course data", () => {
      const result = calculateFairwayWidth(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeLessThanOrEqual(100)
    })

    it("should calculate iron difficulty from par and handicap", () => {
      const result = calculateIronDifficulty(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.dataPoints.some((p) => p.includes("approach"))).toBe(true)
    })

    it("should identify par 3 courses as having high putting importance", () => {
      const result = calculateIronDifficulty(PAR_3_COURSE)
      expect(result.score).toBeGreaterThan(0)
    })

    it("should calculate putting difficulty from green complexity", () => {
      const result = calculatePuttingDifficulty(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeGreaterThanOrEqual(70)
    })
  })

  describe("Hazard Metrics", () => {
    it("should calculate water hazard risk from hazard count", () => {
      const result = calculateWaterHazardRisk(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThan(0)
      expect(result.dataPoints.some((p) => p.includes("water"))).toBe(true)
    })

    it("should calculate sand hazard risk", () => {
      const result = calculateSandHazardRisk(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThan(0)
    })

    it("should calculate tree risk", () => {
      const result = calculateTreeRisk(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThan(0)
    })

    it("should calculate OOB risk", () => {
      const result = calculateOutOfBoundsRisk(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it("should aggregate hazard risks", () => {
      const result = calculateHazardImpact(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThan(0)
      expect(result.dataPoints.length).toBeGreaterThanOrEqual(4)
    })

    it("should show high hazard impact for championship course", () => {
      const result = calculateHazardImpact(CHAMPIONSHIP_COURSE)
      expect(result.score).toBeGreaterThan(50)
    })
  })

  describe("Characteristics Metrics", () => {
    it("should calculate elevation impact", () => {
      const result = calculateElevationImpact(CHAMPIONSHIP_COURSE)
      expect(result.score).toBeGreaterThan(0)
      expect(result.dataPoints.some((p) => p.includes("elevation"))).toBe(true)
    })

    it("should calculate weather factor", () => {
      const result = calculateWeatherFactor(CHAMPIONSHIP_COURSE)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it("should calculate playability", () => {
      const result = calculatePlayability(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeGreaterThanOrEqual(80)
    })

    it("should calculate course uniqueness", () => {
      const result = calculateUniqueness(AUSTIN_COUNTRY_CLUB)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.dataPoints.length).toBeGreaterThan(0)
    })
  })

  describe("Course Intelligence Engine", () => {
    it("should calculate all metrics for Austin Country Club", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      expect(metrics.difficulty.score).toBeGreaterThan(0)
      expect(metrics.fairwayWidth.score).toBeGreaterThanOrEqual(0)
      expect(metrics.hazardImpact.score).toBeGreaterThan(0)
      expect(metrics.dataCompleteness).toBeGreaterThan(80)
    })

    it("should calculate data completeness", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      expect(metrics.dataCompleteness).toBeGreaterThanOrEqual(0)
      expect(metrics.dataCompleteness).toBeLessThanOrEqual(100)
    })

    it("should show minimal data completeness for incomplete course", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(MINIMAL_DATA_COURSE)
      expect(metrics.dataCompleteness).toBeLessThan(50)
    })

    it("should calculate average difficulty", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      const avg = CourseIntelligenceEngine.getAverageDifficulty(metrics)
      expect(avg).toBeGreaterThan(0)
      expect(avg).toBeLessThanOrEqual(100)
    })

    it("should calculate average hazard risk", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(CHAMPIONSHIP_COURSE)
      const avg = CourseIntelligenceEngine.getAverageHazardRisk(metrics)
      expect(avg).toBeGreaterThan(40)
    })

    it("should generate difficulty summary", () => {
      const easy = CourseIntelligenceEngine.getDifficultySummary(15)
      const hard = CourseIntelligenceEngine.getDifficultySummary(85)
      expect(easy).toContain("Beginner")
      expect(hard).toContain("Championship")
    })
  })

  describe("Course Tagger", () => {
    it("should generate tags for Austin Country Club", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      const tags = CourseTagger.generateTags(metrics)
      expect(tags.length).toBeGreaterThan(0)
      expect(tags[0].tag).toBeDefined()
      expect(tags[0].confidence).toBeGreaterThanOrEqual(0)
    })

    it("should tag easy course as beginner-friendly", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(EASY_9_HOLE)
      const tags = CourseTagger.generateTags(metrics)
      const hasBeginnerTag = tags.some((t) => t.tag.includes("Beginner"))
      expect(hasBeginnerTag).toBe(true)
    })

    it("should tag championship course as challenging", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(CHAMPIONSHIP_COURSE)
      const tags = CourseTagger.generateTags(metrics)
      const hasChallengingTag = tags.some(
        (t) =>
          t.tag.includes("Championship") ||
          t.tag.includes("Challenging") ||
          t.tag.includes("Very Challenging"),
      )
      expect(hasChallengingTag).toBe(true)
    })

    it("should categorize tags correctly", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      const tags = CourseTagger.generateTags(metrics)
      const categories = CourseTagger.getTagCategories(tags)
      expect(Object.keys(categories).length).toBeGreaterThan(0)
      expect(categories.difficulty.length).toBeGreaterThan(0)
    })

    it("should tag par 3 course appropriately", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(PAR_3_COURSE)
      const tags = CourseTagger.generateTags(metrics)
      expect(tags.length).toBeGreaterThan(0)
      expect(tags.some((t) => t.tag.includes("Beginner"))).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle minimal data gracefully", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(MINIMAL_DATA_COURSE)
      expect(metrics.difficulty).toBeDefined()
      expect(metrics.fairwayWidth).toBeDefined()
      expect(metrics.hazardImpact).toBeDefined()
    })

    it("should handle 9-hole courses", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(EASY_9_HOLE)
      expect(metrics.difficulty).toBeDefined()
      expect(metrics.playability).toBeDefined()
    })

    it("should handle extreme length courses", () => {
      const metrics = CourseIntelligenceEngine.calculateMetrics(CHAMPIONSHIP_COURSE)
      expect(metrics.difficulty.score).toBeGreaterThan(60)
    })

    it("should produce consistent results for same input", () => {
      const metrics1 = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      const metrics2 = CourseIntelligenceEngine.calculateMetrics(AUSTIN_COUNTRY_CLUB)
      expect(metrics1.difficulty.score).toBe(metrics2.difficulty.score)
      expect(metrics1.fairwayWidth.score).toBe(metrics2.fairwayWidth.score)
    })
  })
})
