/**
 * Phase 14 Course Intelligence Validation Endpoint
 * Tests the complete Course Intelligence Engine with real course data
 * Run after deploying Phase 14 to verify all systems work end-to-end
 */

import { NextResponse } from "next/server"
import { CourseIntelligenceEngine } from "@/lib/course-intelligence/metrics-engine"
import { ExplanationEngine } from "@/lib/course-intelligence/explanation-engine"
import { CourseTagger } from "@/lib/course-intelligence/course-tagger"
import type { CourseData } from "@/lib/course-intelligence/metrics"

// Austin Country Club test data
const TEST_COURSE: CourseData = {
  id: "course-18214",
  name: "Austin Country Club",
  holes: [
    { holeNumber: 1, par: 4, yardage: 368, handicap: 3 },
    { holeNumber: 2, par: 3, yardage: 187, handicap: 15 },
    { holeNumber: 3, par: 4, yardage: 420, handicap: 5 },
    { holeNumber: 4, par: 4, yardage: 398, handicap: 7 },
    { holeNumber: 5, par: 5, yardage: 541, handicap: 1 },
    { holeNumber: 6, par: 3, yardage: 162, handicap: 17 },
    { holeNumber: 7, par: 4, yardage: 410, handicap: 6 },
    { holeNumber: 8, par: 4, yardage: 383, handicap: 9 },
    { holeNumber: 9, par: 5, yardage: 541, handicap: 2 },
    { holeNumber: 10, par: 4, yardage: 383, handicap: 8 },
    { holeNumber: 11, par: 3, yardage: 195, handicap: 13 },
    { holeNumber: 12, par: 4, yardage: 475, handicap: 4 },
    { holeNumber: 13, par: 5, yardage: 556, handicap: 10 },
    { holeNumber: 14, par: 4, yardage: 397, handicap: 11 },
    { holeNumber: 15, par: 4, yardage: 415, handicap: 12 },
    { holeNumber: 16, par: 3, yardage: 213, handicap: 18 },
    { holeNumber: 17, par: 4, yardage: 426, handicap: 14 },
    { holeNumber: 18, par: 4, yardage: 391, handicap: 16 },
  ],
  tees: [
    {
      teeName: "Blue",
      yardage: 6824,
      rating: 73.2,
      slope: 134,
      holeCount: 18,
    },
    {
      teeName: "White",
      yardage: 6450,
      rating: 72.1,
      slope: 130,
      holeCount: 18,
    },
  ],
  address: {
    country: "United States",
    state: "TX",
    city: "Austin",
    elevation: 1000,
  },
  coordinates: {
    latitude: 30.2672,
    longitude: -97.8611,
  },
  hazardCounts: {
    water: 8,
    sand: 15,
    trees: 120,
    outOfBounds: 4,
  },
}

export async function GET() {
  try {
    console.log("[v0] Phase 14 Validation - Starting")

    // Step 1: Calculate metrics
    console.log("[v0] Calculating metrics...")
    const metrics = CourseIntelligenceEngine.calculateMetrics(TEST_COURSE)
    console.log("[v0] Metrics calculated successfully")

    // Step 2: Generate explanations
    console.log("[v0] Generating explanations...")
    const explanations = ExplanationEngine.generateExplanations(metrics)
    console.log(`[v0] Generated ${explanations.length} explanations`)

    // Step 3: Generate tags
    console.log("[v0] Generating course tags...")
    const tags = CourseTagger.generateTags(metrics)
    console.log(`[v0] Generated ${tags.length} course tags`)

    // Step 4: Generate summary statistics
    const avgDifficulty = CourseIntelligenceEngine.getAverageDifficulty(metrics)
    const avgHazard = CourseIntelligenceEngine.getAverageHazardRisk(metrics)
    const difficultySummary = CourseIntelligenceEngine.getDifficultySummary(metrics.difficulty.score)

    // Validation checks
    const validations = {
      metricsCalculated: Object.keys(metrics).length === 17, // 16 metrics + dataCompleteness
      explanationsGenerated: explanations.length === 16,
      tagsGenerated: tags.length > 0,
      allScoresValid:
        metrics.difficulty.score > 0 &&
        metrics.fairwayWidth.score >= 0 &&
        metrics.hazardImpact.score > 0,
      dataCompletenessValid: metrics.dataCompleteness >= 80,
      starsCorrect:
        metrics.difficulty.stars >= 1 &&
        metrics.difficulty.stars <= 5 &&
        metrics.fairwayWidth.stars >= 1 &&
        metrics.fairwayWidth.stars <= 5,
    }

    const allValid = Object.values(validations).every((v) => v === true)

    return NextResponse.json(
      {
        success: allValid,
        course: {
          id: TEST_COURSE.id,
          name: TEST_COURSE.name,
          holeCount: TEST_COURSE.holes.length,
          totalYardage: TEST_COURSE.holes.reduce((sum, h) => sum + h.yardage, 0),
        },
        metrics: {
          difficulty: {
            score: metrics.difficulty.score,
            stars: metrics.difficulty.stars,
            confidence: metrics.difficulty.confidence,
          },
          scoringDifficulty: {
            score: metrics.scoringDifficulty.score,
            stars: metrics.scoringDifficulty.stars,
          },
          bogeyRisk: {
            score: metrics.bogeyRisk.score,
            stars: metrics.bogeyRisk.stars,
          },
          fairwayWidth: {
            score: metrics.fairwayWidth.score,
            stars: metrics.fairwayWidth.stars,
          },
          ironDifficulty: {
            score: metrics.ironDifficulty.score,
            stars: metrics.ironDifficulty.stars,
          },
          puttingDifficulty: {
            score: metrics.puttingDifficulty.score,
            stars: metrics.puttingDifficulty.stars,
          },
          hazardImpact: {
            score: metrics.hazardImpact.score,
            stars: metrics.hazardImpact.stars,
          },
          waterHazardRisk: {
            score: metrics.waterHazardRisk.score,
            stars: metrics.waterHazardRisk.stars,
          },
          sandHazardRisk: {
            score: metrics.sandHazardRisk.score,
            stars: metrics.sandHazardRisk.stars,
          },
          treeRisk: {
            score: metrics.treeRisk.score,
            stars: metrics.treeRisk.stars,
          },
          elevationImpact: {
            score: metrics.elevationImpact.score,
            stars: metrics.elevationImpact.stars,
          },
          playability: {
            score: metrics.playability.score,
            stars: metrics.playability.stars,
          },
          uniqueness: {
            score: metrics.uniqueness.score,
            stars: metrics.uniqueness.stars,
          },
        },
        statistics: {
          averageDifficulty: avgDifficulty,
          averageHazardRisk: avgHazard,
          difficultySummary,
          dataCompleteness: metrics.dataCompleteness,
        },
        courseTags: tags.slice(0, 10).map((t) => ({
          tag: t.tag,
          description: t.description,
          confidence: t.confidence,
        })),
        explanationSample: explanations.slice(0, 3).map((e) => ({
          metric: e.metric,
          title: e.title,
          summary: e.summary,
        })),
        validations,
        timestamp: new Date().toISOString(),
      },
      { status: allValid ? 200 : 400 },
    )
  } catch (error) {
    console.error("[v0] Phase 14 Validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
