import type { CourseProfile, CourseSignal } from "@/lib/domain/course"

export interface SkillImportance {
  skill: string
  importance: "Low" | "Medium" | "High" | "Critical"
  explanation: string
  icon: string
}

export interface PlayerArchetype {
  name: string
  description: string
  recommended: boolean
  reasoning: string
}

export interface FantasyAnalysis {
  skillImportances: SkillImportance[]
  favoredArchetypes: PlayerArchetype[]
  fadedArchetypes: PlayerArchetype[]
  coursePersonality: string
}

/**
 * Extract the band from a CourseSignal (handling both rating and unknown types).
 * Safely handles null/undefined signals.
 */
function extractBand(signal: CourseSignal | undefined | null): "low" | "medium" | "high" | null {
  if (!signal) return null
  if (signal.status === "unknown") return null
  if (signal.kind === "rating") {
    return signal.band
  }
  return null
}

/**
 * Generate fantasy golf analysis from course profile characteristics.
 * Transforms GolfCourseAPI data into actionable player archetype insights.
 */
export function generateFantasyAnalysis(profile: CourseProfile): FantasyAnalysis {
  // Extract key characteristics from profile
  const drivingImportance = extractBand(profile.characteristics.drivingImportance)
  const approachImportance = extractBand(profile.characteristics.approachImportance)
  const shortGameImportance = extractBand(profile.characteristics.shortGameImportance)
  const puttingImportance = extractBand(profile.characteristics.puttingImportance)
  const windExposure = extractBand(profile.characteristics.windExposure)
  const waterDifficulty = extractBand(profile.characteristics.waterDifficulty)
  const aroundGreenDifficulty = extractBand(profile.characteristics.aroundGreenDifficulty)

  // Generate skill importance rankings
  const skillImportances: SkillImportance[] = []

  if (drivingImportance) {
    skillImportances.push({
      skill: "Driving Accuracy",
      importance: drivingImportance === "high" ? "Critical" : drivingImportance === "medium" ? "High" : "Medium",
      explanation:
        drivingImportance === "high"
          ? "Tight fairways and aggressive doglegs make accurate driving essential for scoring"
          : "Fairway position matters, but not as critical as other skills",
      icon: "🎯",
    })
  }

  if (approachImportance) {
    skillImportances.push({
      skill: "Approach Shots",
      importance: approachImportance === "high" ? "Critical" : approachImportance === "medium" ? "High" : "Medium",
      explanation:
        approachImportance === "high"
          ? "Precise approach play to small, well-guarded greens is key to scoring"
          : "Approach play is important but players have room for error",
      icon: "🏌️",
    })
  }

  if (shortGameImportance || aroundGreenDifficulty) {
    const band = shortGameImportance || aroundGreenDifficulty
    skillImportances.push({
      skill: "Short Game",
      importance: band === "high" ? "Critical" : band === "medium" ? "High" : "Medium",
      explanation:
        band === "high"
          ? "Exceptional chipping and pitching separates winners—tough around the green"
          : "Short game is a differentiator but not as demanding",
      icon: "⛳",
    })
  }

  if (puttingImportance) {
    skillImportances.push({
      skill: "Putting",
      importance: puttingImportance === "high" ? "Critical" : puttingImportance === "medium" ? "High" : "Medium",
      explanation:
        puttingImportance === "high"
          ? "Greens are fast or difficult—putting becomes the tournament differentiator"
          : "Putting matters but isn't the primary variable",
      icon: "🚩",
    })
  }

  // Determine wind sensitivity
  let windSensitivity = "Moderate"
  if (windExposure === "high") windSensitivity = "High—wind exposure favors players with strong ball-striking"
  else if (windExposure === "low") windSensitivity = "Low—sheltered course limits wind impact"

  // Generate player archetypes
  const favoredArchetypes: PlayerArchetype[] = []
  const fadedArchetypes: PlayerArchetype[] = []

  // Long hitters - favored on long courses or high driving importance
  if (drivingImportance === "high" || waterDifficulty === "high") {
    favoredArchetypes.push({
      name: "Long Hitter with Accuracy",
      description: "Players combining distance off the tee with controlled accuracy",
      recommended: true,
      reasoning:
        "This course rewards aggressive, accurate driving. Long hitters who can find fairways will have significant scoring advantage.",
    })
  } else {
    fadedArchetypes.push({
      name: "Pure Bombers",
      description: "Players focused primarily on distance without accuracy",
      recommended: false,
      reasoning: "Greens are more forgiving or fairway accuracy less critical—pure distance alone won't create value.",
    })
  }

  // Short game specialists
  if (shortGameImportance === "high" || aroundGreenDifficulty === "high") {
    favoredArchetypes.push({
      name: "Short Game Specialist",
      description: "Players with elite chipping, pitching, and recovery skills",
      recommended: true,
      reasoning:
        "Difficult conditions around the green create huge separation. Specialists in recovery and touch will excel.",
    })
  }

  // Putting experts
  if (puttingImportance === "high") {
    favoredArchetypes.push({
      name: "Elite Putter",
      description: "Players with exceptional putting consistency and touch",
      recommended: true,
      reasoning: "Fast or difficult greens create massive opportunities for elite putters to distance themselves.",
    })
  }

  // Ball strikers - high approach importance
  if (approachImportance === "high") {
    favoredArchetypes.push({
      name: "Precision Ball Striker",
      description: "Players with elite iron play and greens in regulation",
      recommended: true,
      reasoning: "Approach shot precision is critical for scoring. Elite strikers will have consistent scoring advantage.",
    })
  }

  // Wind players
  if (windExposure === "high") {
    favoredArchetypes.push({
      name: "Wind Manager",
      description: "Players with excellent ball control in variable wind conditions",
      recommended: true,
      reasoning: "Open, exposed course means wind will play a significant role. Ball-strikers comfortable in wind excel.",
    })
  } else {
    fadedArchetypes.push({
      name: "Wind-Sensitive Players",
      description: "Players who struggle with inconsistent or strong wind conditions",
      recommended: false,
      reasoning: "Sheltered or calm course layout minimizes wind as a factor—no advantage for wind specialists.",
    })
  }

  // Determine course personality
  let coursePersonality = "Balanced"
  if (drivingImportance === "high" && approachImportance === "high") {
    coursePersonality = "Demanding"
  } else if (shortGameImportance === "high" && puttingImportance === "high") {
    coursePersonality = "Precision-based"
  } else if (drivingImportance === "high") {
    coursePersonality = "Power-oriented"
  } else if (puttingImportance === "high") {
    coursePersonality = "Putting-reliant"
  }

  return {
    skillImportances,
    favoredArchetypes: favoredArchetypes.slice(0, 3),
    fadedArchetypes: fadedArchetypes.slice(0, 2),
    coursePersonality,
  }
}
