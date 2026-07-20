/**
 * Course Tagger
 * Generates descriptive tags for course style and characteristics
 * Multiple tags per course, each with confidence level
 */

import type { CalculatedMetrics } from "./metrics-engine"
import type { CourseInsightTag } from "./metrics"

export class CourseTagger {
  /**
   * Generate course style tags based on calculated metrics
   */
  static generateTags(metrics: CalculatedMetrics): CourseInsightTag[] {
    const tags: CourseInsightTag[] = []

    // Difficulty Tier Tags
    tags.push(...this.generateDifficultyTags(metrics))

    // Hazard Profile Tags
    tags.push(...this.generateHazardTags(metrics))

    // Play Style Tags
    tags.push(...this.generatePlayStyleTags(metrics))

    // Specialty Tags
    tags.push(...this.generateSpecialtyTags(metrics))

    return tags
  }

  private static generateDifficultyTags(metrics: CalculatedMetrics): CourseInsightTag[] {
    const tags: CourseInsightTag[] = []
    const score = metrics.difficulty.score

    if (score < 25) {
      tags.push({
        tag: "Beginner-Friendly",
        description: "Great for high-handicap golfers and beginners",
        confidence: 95,
      })
    } else if (score < 45) {
      tags.push({
        tag: "Intermediate",
        description: "Good challenge for mid-handicap golfers",
        confidence: 90,
      })
    } else if (score < 65) {
      tags.push({
        tag: "Challenging",
        description: "Significant test for better golfers",
        confidence: 90,
      })
    } else if (score < 85) {
      tags.push({
        tag: "Very Challenging",
        description: "Demanding course for accomplished golfers",
        confidence: 90,
      })
    } else {
      tags.push({
        tag: "Championship",
        description: "Elite-level challenge for expert golfers",
        confidence: 95,
      })
    }

    return tags
  }

  private static generateHazardTags(metrics: CalculatedMetrics): CourseInsightTag[] {
    const tags: CourseInsightTag[] = []

    // Water tags
    if (metrics.waterHazardRisk.score > 70) {
      tags.push({
        tag: "Water Heavy",
        description: "Significant water features throughout",
        confidence: metrics.waterHazardRisk.confidence,
      })
    }

    // Sand tags
    if (metrics.sandHazardRisk.score > 65) {
      tags.push({
        tag: "Bunker Heavy",
        description: "Multiple bunkers protecting greens and fairways",
        confidence: metrics.sandHazardRisk.confidence,
      })
    }

    // Tree tags
    if (metrics.treeRisk.score > 70) {
      tags.push({
        tag: "Tree-Lined",
        description: "Dense vegetation penalizes wayward shots",
        confidence: metrics.treeRisk.confidence,
      })
    }

    // OOB tags
    if (metrics.outOfBoundsRisk.score > 60) {
      tags.push({
        tag: "OOB Danger",
        description: "Out of bounds hazards create significant penalty risk",
        confidence: metrics.outOfBoundsRisk.confidence,
      })
    }

    return tags
  }

  private static generatePlayStyleTags(metrics: CalculatedMetrics): CourseInsightTag[] {
    const tags: CourseInsightTag[] = []

    // Bomber Friendly (long hitters advantage)
    if (metrics.fairwayWidth.score < 40 && metrics.difficulty.score < 60) {
      tags.push({
        tag: "Bomber Friendly",
        description: "Long drives rewarded; wide landing areas",
        confidence: Math.min(85, Math.max(metrics.fairwayWidth.confidence, 60)),
      })
    }

    // Accuracy Course (precise shots valued)
    if (metrics.fairwayWidth.score > 65 || (metrics.variance.score > 60 && metrics.ironDifficulty.score > 65)) {
      tags.push({
        tag: "Accuracy Course",
        description: "Precision and course management critical",
        confidence: 85,
      })
    }

    // Risk/Reward (aggressive play possible)
    if (metrics.hazardImpact.score > 60 && metrics.bogeyRisk.score > 55) {
      tags.push({
        tag: "Risk/Reward Design",
        description: "Aggressive play can pay off but carries penalties",
        confidence: 80,
      })
    }

    // Putter Friendly (putting less difficult)
    if (metrics.puttingDifficulty.score < 40) {
      tags.push({
        tag: "Putter Friendly",
        description: "Reasonable green complexity; not overly tricky",
        confidence: metrics.puttingDifficulty.confidence,
      })
    }

    // Putting Test (difficult greens)
    if (metrics.puttingDifficulty.score > 70) {
      tags.push({
        tag: "Putting Test",
        description: "Complex greens demand strong putting skill",
        confidence: metrics.puttingDifficulty.confidence,
      })
    }

    // Strategic Layout (course management matters)
    if (metrics.variance.score > 65 && metrics.playability.score > 50) {
      tags.push({
        tag: "Strategic Layout",
        description: "Course management and positioning critical",
        confidence: 85,
      })
    }

    return tags
  }

  private static generateSpecialtyTags(metrics: CalculatedMetrics): CourseInsightTag[] {
    const tags: CourseInsightTag[] = []

    // Mountain Course (elevation impacts play)
    if (metrics.elevationImpact.score > 60) {
      tags.push({
        tag: "Mountain Course",
        description: "Elevation changes significantly impact club selection",
        confidence: metrics.elevationImpact.confidence,
      })
    }

    // Weather-Sensitive (wind/climate impacts play)
    if (metrics.weatherFactor.score > 60) {
      tags.push({
        tag: "Weather-Sensitive",
        description: "Wind and climate create significant scoring variance",
        confidence: metrics.weatherFactor.confidence,
      })
    }

    // Unique Design (memorable or distinctive)
    if (metrics.uniqueness.score > 65) {
      tags.push({
        tag: "Unique Design",
        description: "Distinctive layout with memorable holes",
        confidence: metrics.uniqueness.confidence,
      })
    }

    // Playable Layout (good pacing and flow)
    if (metrics.playability.score > 70) {
      tags.push({
        tag: "Playable Layout",
        description: "Good pace and flow; easy to walk the course",
        confidence: 90,
      })
    }

    // Classic Design (balanced and consistent)
    if (metrics.variance.score < 50 && metrics.playability.score > 60 && metrics.uniqueness.score > 50) {
      tags.push({
        tag: "Classic Design",
        description: "Traditional layout with balanced holes",
        confidence: 80,
      })
    }

    // Modern Challenge (contemporary design with modern difficulty)
    if (metrics.difficulty.score > 65 && metrics.variance.score > 60 && metrics.uniqueness.score > 60) {
      tags.push({
        tag: "Modern Challenge",
        description: "Contemporary course design with modern difficulty",
        confidence: 85,
      })
    }

    return tags
  }

  /**
   * Get tag categories (for filtering/UI organization)
   */
  static getTagCategories(tags: CourseInsightTag[]): Record<string, CourseInsightTag[]> {
    const categories = {
      difficulty: [] as CourseInsightTag[],
      hazards: [] as CourseInsightTag[],
      playStyle: [] as CourseInsightTag[],
      specialty: [] as CourseInsightTag[],
    }

    const difficultyTags = ["Beginner-Friendly", "Intermediate", "Challenging", "Very Challenging", "Championship"]
    const hazardTags = ["Water Heavy", "Bunker Heavy", "Tree-Lined", "OOB Danger"]
    const playStyleTags = ["Bomber Friendly", "Accuracy Course", "Risk/Reward Design", "Putter Friendly", "Putting Test", "Strategic Layout"]
    const specialtyTags = ["Mountain Course", "Weather-Sensitive", "Unique Design", "Playable Layout", "Classic Design", "Modern Challenge"]

    for (const tag of tags) {
      if (difficultyTags.includes(tag.tag)) categories.difficulty.push(tag)
      else if (hazardTags.includes(tag.tag)) categories.hazards.push(tag)
      else if (playStyleTags.includes(tag.tag)) categories.playStyle.push(tag)
      else if (specialtyTags.includes(tag.tag)) categories.specialty.push(tag)
    }

    return categories
  }
}
