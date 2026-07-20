/**
 * Explanation Engine
 * Generates human-readable explanations for each metric
 * Produces CourseMetricExplanation records with contributing factors
 */

import type { CalculatedMetrics } from "./metrics-engine"

export interface ExplanationRecord {
  metric: string
  title: string
  summary: string
  contributingFactors: string
}

export class ExplanationEngine {
  /**
   * Generate explanations for all calculated metrics
   */
  static generateExplanations(metrics: CalculatedMetrics): ExplanationRecord[] {
    const explanations: ExplanationRecord[] = []

    // Difficulty Metrics
    explanations.push(this.explainDifficulty(metrics.difficulty))
    explanations.push(this.explainScoringDifficulty(metrics.scoringDifficulty))
    explanations.push(this.explainBogeyRisk(metrics.bogeyRisk))
    explanations.push(this.explainVariance(metrics.variance))

    // Fairway & Approach Metrics
    explanations.push(this.explainFairwayWidth(metrics.fairwayWidth))
    explanations.push(this.explainIronDifficulty(metrics.ironDifficulty))
    explanations.push(this.explainPuttingDifficulty(metrics.puttingDifficulty))

    // Hazard Metrics
    explanations.push(this.explainWaterHazardRisk(metrics.waterHazardRisk))
    explanations.push(this.explainSandHazardRisk(metrics.sandHazardRisk))
    explanations.push(this.explainTreeRisk(metrics.treeRisk))
    explanations.push(this.explainOutOfBoundsRisk(metrics.outOfBoundsRisk))
    explanations.push(this.explainHazardImpact(metrics.hazardImpact))

    // Characteristics
    explanations.push(this.explainElevationImpact(metrics.elevationImpact))
    explanations.push(this.explainWeatherFactor(metrics.weatherFactor))
    explanations.push(this.explainPlayability(metrics.playability))
    explanations.push(this.explainUniqueness(metrics.uniqueness))

    return explanations
  }

  private static explainDifficulty(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "difficulty",
      title: "Overall Course Difficulty",
      summary: `This course presents a ${["very easy", "easy", "moderate", "hard", "very hard"][Math.ceil((metric.score / 100) * 5) - 1]} overall challenge based on par distribution, length variance, and yardage.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainScoringDifficulty(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "scoringDifficulty",
      title: "Scoring Difficulty",
      summary: `Scoring well on this course is ${["very easy", "easy", "moderate", "hard", "very hard"][Math.ceil((metric.score / 100) * 5) - 1]}. The slope rating indicates how difficult it is to score relative to par.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainBogeyRisk(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "bogeyRisk",
      title: "Bogey Risk",
      summary: `This course has ${["very low", "low", "moderate", "high", "very high"][Math.ceil((metric.score / 100) * 5) - 1]} risk of scoring bogey or worse. A higher percentage of difficult holes increases the likelihood of bogeys.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainVariance(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "variance",
      title: "Difficulty Variance",
      summary: `The course difficulty varies ${["minimally", "slightly", "moderately", "significantly", "dramatically"][Math.ceil((metric.score / 100) * 5) - 1]} from hole to hole, requiring players to adjust strategy frequently.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainFairwayWidth(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "fairwayWidth",
      title: "Fairway Width",
      summary: `Fairways are estimated to be ${["very wide", "wide", "moderate", "narrow", "very narrow"][Math.ceil((metric.score / 100) * 5) - 1]}, based on hole length and handicap distribution. Longer holes typically have narrower fairways for difficulty balance.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainIronDifficulty(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "ironDifficulty",
      title: "Iron Difficulty",
      summary: `Approach shots require ${["minimal", "low", "moderate", "high", "very high"][Math.ceil((metric.score / 100) * 5) - 1]} accuracy. More par 3s and varied approach distances increase the difficulty of iron shots.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainPuttingDifficulty(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "puttingDifficulty",
      title: "Putting Difficulty",
      summary: `Green complexity creates ${["minimal", "low", "moderate", "high", "very high"][Math.ceil((metric.score / 100) * 5) - 1]} putting challenges. Variance in handicap ratings on par 3s and par 4s indicates complex green layouts.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainWaterHazardRisk(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "waterHazardRisk",
      title: "Water Hazard Risk",
      summary: `Water features create ${["minimal", "low", "moderate", "significant", "severe"][Math.ceil((metric.score / 100) * 5) - 1]} risk. Water hazards can result in lost balls and penalty strokes.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainSandHazardRisk(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "sandHazardRisk",
      title: "Sand Hazard Risk",
      summary: `Bunkers present ${["minimal", "low", "moderate", "high", "very high"][Math.ceil((metric.score / 100) * 5) - 1]} difficulty. More bunkers mean more opportunities to miss fairways or greens into sand.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainTreeRisk(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "treeRisk",
      title: "Tree/Vegetation Risk",
      summary: `Trees and vegetation create {{minimal", "light", "moderate", "heavy", "very heavy"][Math.ceil((metric.score / 100) * 5) - 1]} difficulty. Dense tree lines punish off-line shots more severely.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainOutOfBoundsRisk(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "outOfBoundsRisk",
      title: "Out of Bounds Risk",
      summary: `Out of bounds hazards create {{minimal", "low", "moderate", "high", "very high"][Math.ceil((metric.score / 100) * 5) - 1]} risk. OOB results in 2-stroke penalties and is more severe than water or sand.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainHazardImpact(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "hazardImpact",
      title: "Overall Hazard Impact",
      summary: `Combined hazard challenges create {{minimal", "low", "moderate", "significant", "severe"][Math.ceil((metric.score / 100) * 5) - 1]} impact on scoring. Multiple hazard types increase course difficulty substantially.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainElevationImpact(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "elevationImpact",
      title: "Elevation Impact",
      summary: `Elevation changes have {{negligible", "low", "moderate", "significant", "very significant"][Math.ceil((metric.score / 100) * 5) - 1]} impact. High-altitude courses have thinner air affecting shot distance and ball behavior.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainWeatherFactor(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "weatherFactor",
      title: "Weather/Climate Factor",
      summary: `Weather and climate create {{minimal", "low", "moderate", "significant", "extreme"][Math.ceil((metric.score / 100) * 5) - 1]} difficulty variance. Courses in windy or extreme weather regions see more variability in scoring.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainPlayability(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "playability",
      title: "Overall Playability",
      summary: `Overall playability is {{poor", "fair", "good", "very good", "excellent"][Math.ceil((metric.score / 100) * 5) - 1]}. Balanced par distribution and consistent nine-hole structure improve playability and flow.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainUniqueness(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "uniqueness",
      title: "Course Uniqueness",
      summary: `This course is {{generic", "fairly typical", "somewhat unique", "quite unique", "very distinctive"][Math.ceil((metric.score / 100) * 5) - 1]}. Wide yardage ranges and unusual par distributions contribute to memorable design.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }
}
