/**
 * Course Intelligence Service
 * Orchestrates calculation, explanation, tagging, and persistence of course intelligence
 * Integrates with the metrics engine and repository
 */

import { prisma } from "@/lib/prisma"
import { CourseIntelligenceEngine, type CalculatedMetrics } from "./metrics-engine"
import { ExplanationEngine, type ExplanationRecord } from "./explanation-engine"
import { CourseTagger } from "./course-tagger"
import type { CourseData, CourseInsightTag } from "./metrics"

export interface IntelligenceGenerationResult {
  courseId: string
  success: boolean
  metrics: CalculatedMetrics
  explanations: ExplanationRecord[]
  tags: CourseInsightTag[]
  dataCompleteness: number
  error?: string
}

export class CourseIntelligenceService {
  /**
   * Generate complete course intelligence from course data
   * Returns metrics, explanations, tags, and persists all to database
   */
  static async generateIntelligence(courseData: CourseData): Promise<IntelligenceGenerationResult> {
    try {
      console.log(`[v0] Generating intelligence for: ${courseData.name}`)

      // Step 1: Calculate all metrics
      const metrics = CourseIntelligenceEngine.calculateMetrics(courseData)

      // Step 2: Generate explanations
      const explanations = ExplanationEngine.generateExplanations(metrics)

      // Step 3: Generate course tags
      const tags = CourseTagger.generateTags(metrics)

      // Step 4: Persist to database
      await this.persistIntelligence(courseData.id, metrics, explanations, tags)

      console.log(`[v0] Intelligence generated successfully for: ${courseData.name}`)

      return {
        courseId: courseData.id,
        success: true,
        metrics,
        explanations,
        tags,
        dataCompleteness: metrics.dataCompleteness,
      }
    } catch (error) {
      console.error(`[v0] Intelligence generation failed for: ${courseData.name}`, error)
      return {
        courseId: courseData.id,
        success: false,
        metrics: {} as CalculatedMetrics,
        explanations: [],
        tags: [],
        dataCompleteness: 0,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Persist all intelligence data to database
   */
  private static async persistIntelligence(
    courseId: string,
    metrics: CalculatedMetrics,
    explanations: ExplanationRecord[],
    tags: CourseInsightTag[],
  ): Promise<void> {
    // Upsert course intelligence record
    const intelligence = await prisma.courseIntelligence.upsert({
      where: { courseId },
      create: {
        courseId,
        // Difficulty metrics
        overallDifficultyScore: metrics.difficulty.score,
        overallDifficultyStars: metrics.difficulty.stars,
        scoringDifficultyScore: metrics.scoringDifficulty.score,
        scoringDifficultyStars: metrics.scoringDifficulty.stars,
        bogeyRiskScore: metrics.bogeyRisk.score,
        bogeyRiskStars: metrics.bogeyRisk.stars,
        varianceScore: metrics.variance.score,
        varianceStars: metrics.variance.stars,

        // Fairway & approach metrics
        fairwayWidthScore: metrics.fairwayWidth.score,
        fairwayWidthStars: metrics.fairwayWidth.stars,
        ironDifficultyScore: metrics.ironDifficulty.score,
        ironDifficultyStars: metrics.ironDifficulty.stars,
        puttingDifficultyScore: metrics.puttingDifficulty.score,
        puttingDifficultyStars: metrics.puttingDifficulty.stars,

        // Hazard metrics
        waterHazardRiskScore: metrics.waterHazardRisk.score,
        waterHazardRiskStars: metrics.waterHazardRisk.stars,
        sandHazardRiskScore: metrics.sandHazardRisk.score,
        sandHazardRiskStars: metrics.sandHazardRisk.stars,
        treeRiskScore: metrics.treeRisk.score,
        treeRiskStars: metrics.treeRisk.stars,
        outOfBoundsRiskScore: metrics.outOfBoundsRisk.score,
        outOfBoundsRiskStars: metrics.outOfBoundsRisk.stars,
        hazardImpactScore: metrics.hazardImpact.score,
        hazardImpactStars: metrics.hazardImpact.stars,

        // Characteristics
        elevationImpactScore: metrics.elevationImpact.score,
        elevationImpactStars: metrics.elevationImpact.stars,
        weatherFactorScore: metrics.weatherFactor.score,
        weatherFactorStars: metrics.weatherFactor.stars,
        playabilityScore: metrics.playability.score,
        playabilityStars: metrics.playability.stars,
        uniquenessScore: metrics.uniqueness.score,
        uniquenessStars: metrics.uniqueness.stars,

        // Metadata
        dataCompleteness: metrics.dataCompleteness,
        courseTags: tags,
        calculationVersion: "v1",
        calculatedAt: new Date(),
      },
      update: {
        // Difficulty metrics
        overallDifficultyScore: metrics.difficulty.score,
        overallDifficultyStars: metrics.difficulty.stars,
        scoringDifficultyScore: metrics.scoringDifficulty.score,
        scoringDifficultyStars: metrics.scoringDifficulty.stars,
        bogeyRiskScore: metrics.bogeyRisk.score,
        bogeyRiskStars: metrics.bogeyRisk.stars,
        varianceScore: metrics.variance.score,
        varianceStars: metrics.variance.stars,

        // Fairway & approach metrics
        fairwayWidthScore: metrics.fairwayWidth.score,
        fairwayWidthStars: metrics.fairwayWidth.stars,
        ironDifficultyScore: metrics.ironDifficulty.score,
        ironDifficultyStars: metrics.ironDifficulty.stars,
        puttingDifficultyScore: metrics.puttingDifficulty.score,
        puttingDifficultyStars: metrics.puttingDifficulty.stars,

        // Hazard metrics
        waterHazardRiskScore: metrics.waterHazardRisk.score,
        waterHazardRiskStars: metrics.waterHazardRisk.stars,
        sandHazardRiskScore: metrics.sandHazardRisk.score,
        sandHazardRiskStars: metrics.sandHazardRisk.stars,
        treeRiskScore: metrics.treeRisk.score,
        treeRiskStars: metrics.treeRisk.stars,
        outOfBoundsRiskScore: metrics.outOfBoundsRisk.score,
        outOfBoundsRiskStars: metrics.outOfBoundsRisk.stars,
        hazardImpactScore: metrics.hazardImpact.score,
        hazardImpactStars: metrics.hazardImpact.stars,

        // Characteristics
        elevationImpactScore: metrics.elevationImpact.score,
        elevationImpactStars: metrics.elevationImpact.stars,
        weatherFactorScore: metrics.weatherFactor.score,
        weatherFactorStars: metrics.weatherFactor.stars,
        playabilityScore: metrics.playability.score,
        playabilityStars: metrics.playability.stars,
        uniquenessScore: metrics.uniqueness.score,
        uniquenessStars: metrics.uniqueness.stars,

        // Metadata
        dataCompleteness: metrics.dataCompleteness,
        courseTags: tags,
        calculatedAt: new Date(),
      },
    })

    // Upsert explanations (delete old and create new)
    await prisma.courseMetricExplanation.deleteMany({
      where: { courseIntelligenceId: intelligence.id },
    })

    for (const explanation of explanations) {
      await prisma.courseMetricExplanation.create({
        data: {
          courseIntelligenceId: intelligence.id,
          metric: explanation.metric,
          title: explanation.title,
          summary: explanation.summary,
          contributingFactors: explanation.contributingFactors,
          calculationVersion: "v1",
        },
      })
    }
  }

  /**
   * Get intelligence for display/consumption
   */
  static async getIntelligence(courseId: string) {
    const intelligence = await prisma.courseIntelligence.findUnique({
      where: { courseId },
      include: {
        explanations: true,
      },
    })

    return intelligence
  }

  /**
   * Generate average stats across all courses with intelligence
   */
  static async getIntelligenceStats() {
    const stats = await prisma.courseIntelligence.aggregate({
      _avg: {
        overallDifficultyScore: true,
        scoringDifficultyScore: true,
        bogeyRiskScore: true,
        fairwayWidthScore: true,
        ironDifficultyScore: true,
        puttingDifficultyScore: true,
        hazardImpactScore: true,
        dataCompleteness: true,
      },
      _count: true,
    })

    return {
      totalCourses: stats._count,
      avgOverallDifficulty: Math.round(stats._avg.overallDifficultyScore || 0),
      avgScoringDifficulty: Math.round(stats._avg.scoringDifficultyScore || 0),
      avgBogeyRisk: Math.round(stats._avg.bogeyRiskScore || 0),
      avgFairwayWidth: Math.round(stats._avg.fairwayWidthScore || 0),
      avgIronDifficulty: Math.round(stats._avg.ironDifficultyScore || 0),
      avgPuttingDifficulty: Math.round(stats._avg.puttingDifficultyScore || 0),
      avgHazardImpact: Math.round(stats._avg.hazardImpactScore || 0),
      avgDataCompleteness: Math.round(stats._avg.dataCompleteness || 0),
    }
  }
}
