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

    // Strategy Metrics
    explanations.push(this.explainDrivingImportance(metrics.drivingImportance))
    explanations.push(this.explainApproachImportance(metrics.approachImportance))
    explanations.push(this.explainShortGameImportance(metrics.shortGameImportance))
    explanations.push(this.explainPuttingImportance(metrics.puttingImportance))

    // Environmental & Scoring
    explanations.push(this.explainWindSensitivity(metrics.windSensitivity))
    explanations.push(this.explainPenaltySeverity(metrics.penaltySeverity))
    explanations.push(this.explainBirdiePotential(metrics.birdiePotential))
    explanations.push(this.explainScoringVolatility(metrics.scoringVolatility))

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
      summary: `Trees and vegetation create ${ ["minimal", "light", "moderate", "heavy", "very heavy"][Math.ceil((metric.score / 100) * 5) - 1]} difficulty. Dense tree lines punish off-line shots more severely.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainOutOfBoundsRisk(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "outOfBoundsRisk",
      title: "Out of Bounds Risk",
      summary: `Out of bounds hazards create ${ ["minimal", "low", "moderate", "high", "very high"][Math.ceil((metric.score / 100) * 5) - 1]} risk. OOB results in 2-stroke penalties and is more severe than water or sand.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainHazardImpact(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "hazardImpact",
      title: "Overall Hazard Impact",
      summary: `Combined hazard challenges create ${ ["minimal", "low", "moderate", "significant", "severe"][Math.ceil((metric.score / 100) * 5) - 1]} impact on scoring. Multiple hazard types increase course difficulty substantially.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainElevationImpact(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "elevationImpact",
      title: "Elevation Impact",
      summary: `Elevation changes have ${ ["negligible", "low", "moderate", "significant", "very significant"][Math.ceil((metric.score / 100) * 5) - 1]} impact. High-altitude courses have thinner air affecting shot distance and ball behavior.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainWeatherFactor(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "weatherFactor",
      title: "Weather/Climate Factor",
      summary: `Weather and climate create ${ ["minimal", "low", "moderate", "significant", "extreme"][Math.ceil((metric.score / 100) * 5) - 1]} difficulty variance. Courses in windy or extreme weather regions see more variability in scoring.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainPlayability(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "playability",
      title: "Overall Playability",
      summary: `Overall playability is ${ ["poor", "fair", "good", "very good", "excellent"][Math.ceil((metric.score / 100) * 5) - 1]}. Balanced par distribution and consistent nine-hole structure improve playability and flow.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainUniqueness(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "uniqueness",
      title: "Course Uniqueness",
      summary: `This course is ${ ["generic", "fairly typical", "somewhat unique", "quite unique", "very distinctive"][Math.ceil((metric.score / 100) * 5) - 1]}. Wide yardage ranges and unusual par distributions contribute to memorable design.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainDrivingImportance(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "drivingImportance",
      title: "Driving Importance",
      summary: `Driving is ${ ["not emphasized", "minimally important", "moderately important", "very important", "critical"][Math.ceil((metric.score / 100) * 5) - 1]} at this course. Higher emphasis courses have more Par 4s/5s and reward long, accurate drives.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainApproachImportance(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "approachImportance",
      title: "Approach Shot Importance",
      summary: `Approach shots are ${ ["not emphasized", "minimally important", "moderately important", "very important", "critical"][Math.ceil((metric.score / 100) * 5) - 1]} at this course. Difficult approaches stem from small greens, guarding hazards, and challenging green complexes.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainShortGameImportance(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "shortGameImportance",
      title: "Short Game Importance",
      summary: `Short game skills are ${ ["not emphasized", "minimally important", "moderately important", "very important", "critical"][Math.ceil((metric.score / 100) * 5) - 1]} at this course. More Par 3s and challenging greens make up-and-down recovery shots crucial.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainPuttingImportance(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "puttingImportance",
      title: "Putting Importance",
      summary: `Putting is ${ ["not emphasized", "minimally important", "moderately important", "very important", "critical"][Math.ceil((metric.score / 100) * 5) - 1]} at this course. Large greens, fast surfaces, and many short holes increase putting's impact on scores.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainWindSensitivity(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "windSensitivity",
      title: "Wind Sensitivity",
      summary: `Wind has ${ ["minimal", "light", "moderate", "significant", "major"][Math.ceil((metric.score / 100) * 5) - 1]} impact on play. High-elevation and exposed courses see more scoring variability from wind.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainPenaltySeverity(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "penaltySeverity",
      title: "Penalty Severity",
      summary: `Missed shots are ${ ["lightly", "mildly", "moderately", "severely", "very severely"][Math.ceil((metric.score / 100) * 5) - 1]} penalized. More hazards and narrow fairways increase the cost of errant shots.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainBirdiePotential(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "birdiePotential",
      title: "Birdie Potential",
      summary: `Birdie opportunities are ${ ["very rare", "limited", "moderate", "abundant", "very abundant"][Math.ceil((metric.score / 100) * 5) - 1]}. Reachable Par 5s and short Par 4s provide birdie chances for skilled players.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }

  private static explainScoringVolatility(metric: { score: number; dataPoints: string[] }): ExplanationRecord {
    return {
      metric: "scoringVolatility",
      title: "Scoring Volatility",
      summary: `Scoring volatility is ${ ["very consistent", "consistent", "moderate", "volatile", "very volatile"][Math.ceil((metric.score / 100) * 5) - 1]}. High variance in hole difficulty and environmental factors increase day-to-day scoring variance.`,
      contributingFactors: metric.dataPoints.join("\n"),
    }
  }
}
