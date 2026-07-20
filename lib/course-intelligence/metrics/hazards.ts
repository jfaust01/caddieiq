import { CourseData, MetricResult } from "./types"

/**
 * Calculate Water Hazard Risk
 * Impact of water features on scoring
 */
export function calculateWaterHazardRisk(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  const waterCount = course.hazardCounts?.water || 0

  let score = 0
  let confidence = 50

  if (waterCount > 0) {
    // Water on average per hole
    const waterPerHole = waterCount / Math.max(1, course.holes.length)

    // Heavy water presence (1+ per hole) = high risk
    if (waterPerHole >= 1) {
      score = 80
      dataPoints.push(`Heavy water presence: ${waterCount} hazards across ${course.holes.length} holes`)
    } else if (waterPerHole >= 0.5) {
      score = 60
      dataPoints.push(`Moderate water presence: ${waterCount} hazards`)
    } else {
      score = 40
      dataPoints.push(`Light water presence: ${waterCount} hazards`)
    }

    confidence = Math.min(100, 50 + waterCount * 5)
  } else {
    score = 20
    dataPoints.push("Water hazards data not available - estimating low risk")
    confidence = 30
  }

  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Water hazard risk is ${["minimal", "low", "moderate", "significant", "severe"][stars - 1]} on this course.`,
    dataPoints,
  }
}

/**
 * Calculate Sand Hazard (Bunker) Risk
 */
export function calculateSandHazardRisk(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  const sandCount = course.hazardCounts?.sand || 0

  let score = 0
  let confidence = 50

  if (sandCount > 0) {
    const sandPerHole = sandCount / Math.max(1, course.holes.length)

    if (sandPerHole >= 1.5) {
      score = 75
      dataPoints.push(`Very heavy bunker presence: ${sandCount} bunkers`)
    } else if (sandPerHole >= 1) {
      score = 60
      dataPoints.push(`Heavy bunker presence: ${sandCount} bunkers`)
    } else if (sandPerHole >= 0.5) {
      score = 45
      dataPoints.push(`Moderate bunker presence: ${sandCount} bunkers`)
    } else {
      score = 30
      dataPoints.push(`Light bunker presence: ${sandCount} bunkers`)
    }

    confidence = Math.min(100, 50 + sandCount * 3)
  } else {
    score = 25
    dataPoints.push("Bunker data not available - estimating moderate risk")
    confidence = 35
  }

  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Sand hazard difficulty is ${["minimal", "low", "moderate", "high", "very high"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Tree/Vegetation Risk
 * Tighter courses with trees are harder
 */
export function calculateTreeRisk(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  const treeCount = course.hazardCounts?.trees || 0

  let score = 0
  let confidence = 40

  if (treeCount > 0) {
    const treePerHole = treeCount / Math.max(1, course.holes.length)

    // Heavy tree presence = more errant shots penalized
    if (treePerHole >= 2) {
      score = 85
      dataPoints.push(`Dense tree coverage: ${treeCount} obstructions`)
    } else if (treePerHole >= 1) {
      score = 65
      dataPoints.push(`Moderate tree coverage: ${treeCount} obstructions`)
    } else if (treePerHole >= 0.5) {
      score = 45
      dataPoints.push(`Light tree coverage: ${treeCount} obstructions`)
    } else {
      score = 30
      dataPoints.push(`Minimal tree coverage: ${treeCount} obstructions`)
    }

    confidence = 45
  } else {
    // Estimate based on geography if available
    if (course.address?.country && ["United States", "Canada", "Japan"].includes(course.address.country)) {
      score = 50
      dataPoints.push("Estimated tree coverage based on typical course for region")
      confidence = 40
    } else {
      score = 30
      dataPoints.push("Tree data not available")
      confidence = 20
    }
  }

  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Tree/vegetation difficulty is ${["minimal", "light", "moderate", "heavy", "very heavy"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Out of Bounds Risk
 * Penalty strokes from OOB hazards
 */
export function calculateOutOfBoundsRisk(course: CourseData): MetricResult {
  const dataPoints: string[] = []
  const oobCount = course.hazardCounts?.outOfBounds || 0

  let score = 0
  let confidence = 40

  if (oobCount > 0) {
    // OOB is severe (2-stroke penalty)
    const oobPerHole = oobCount / Math.max(1, course.holes.length)

    if (oobPerHole >= 1) {
      score = 80
      dataPoints.push(`Frequent OOB danger: ${oobCount} areas`)
    } else if (oobPerHole >= 0.5) {
      score = 60
      dataPoints.push(`Moderate OOB danger: ${oobCount} areas`)
    } else {
      score = 40
      dataPoints.push(`Light OOB danger: ${oobCount} areas`)
    }

    confidence = 55
  } else {
    score = 30
    dataPoints.push("OOB hazard data not available")
    confidence = 25
  }

  const stars = Math.ceil((score / 100) * 5)

  return {
    score: Math.round(score),
    stars,
    confidence,
    explanation: `Out of bounds risk is ${["minimal", "low", "moderate", "high", "very high"][stars - 1]}.`,
    dataPoints,
  }
}

/**
 * Calculate Total Hazard Impact
 * Aggregate risk from all hazard types
 */
export function calculateHazardImpact(course: CourseData): MetricResult {
  const waterRisk = calculateWaterHazardRisk(course)
  const sandRisk = calculateSandHazardRisk(course)
  const treeRisk = calculateTreeRisk(course)
  const oobRisk = calculateOutOfBoundsRisk(course)

  // Weighted average (water and OOB more severe)
  const score = Math.round(waterRisk.score * 0.3 + sandRisk.score * 0.25 + treeRisk.score * 0.25 + oobRisk.score * 0.2)

  const avgConfidence = (waterRisk.confidence + sandRisk.confidence + treeRisk.confidence + oobRisk.confidence) / 4
  const stars = Math.ceil((score / 100) * 5)

  const dataPoints = [
    `Water: ${waterRisk.score}/100`,
    `Sand: ${sandRisk.score}/100`,
    `Trees: ${treeRisk.score}/100`,
    `OOB: ${oobRisk.score}/100`,
  ]

  return {
    score,
    stars,
    confidence: Math.round(avgConfidence),
    explanation: `Overall hazard impact is ${["minimal", "low", "moderate", "significant", "severe"][stars - 1]} when considering all hazard types.`,
    dataPoints,
  }
}
