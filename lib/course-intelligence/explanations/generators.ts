/**
 * Individual explanation generators for each metric.
 * Each generator identifies key contributing factors and generates deterministic explanations.
 */

import type { RawExplanation, ExplanationGenerationInput } from './types'
import { formatFactorsForStorage } from './utils'

/**
 * Generate explanation for Overall Difficulty metric.
 */
export function generateDifficultyExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.overallDifficultyScore

  // Course length factor
  if (input.yardage) {
    if (input.yardage >= 7200) factors.push('Championship yardage (7,200+ yards)')
    else if (input.yardage >= 6800) factors.push('Substantial yardage (6,800+ yards)')
    else if (input.yardage <= 5500) factors.push('Moderate yardage (under 5,500 yards)')
  }

  // Slope rating factor
  if (input.slope) {
    if (input.slope >= 140) factors.push('Very high slope rating (140+)')
    else if (input.slope >= 130) factors.push('Elevated slope rating (130+)')
    else if (input.slope <= 110) factors.push('Moderate slope rating (110 or less)')
  }

  // Course rating factor
  if (input.courseRating) {
    if (input.courseRating >= 74) factors.push('High course rating (74+)')
    else if (input.courseRating >= 72) factors.push('Above-average course rating')
    else if (input.courseRating <= 69) factors.push('Below-average course rating')
  }

  // Handicap spread
  if (input.handicapSpread && input.handicapSpread >= 18) {
    factors.push('Significant handicap variation in layout')
  }

  // Par 5 count
  if (input.parDistribution?.par5Count && input.parDistribution.par5Count >= 4) {
    factors.push('Multiple demanding par 5s')
  }

  let title = 'Course Difficulty Assessment'
  let summary = ''

  if (score >= 80) {
    title = 'Extreme Championship Test'
    summary =
      'One of the most demanding courses imaginable. Substantial yardage, elevated slope, and strategic design create an elite test. Only the best golfers will score well.'
  } else if (score >= 65) {
    title = 'Demanding Test'
    summary =
      'Long yardage and elevated slope rating reward complete golfers. Consistent execution required throughout the round.'
  } else if (score >= 50) {
    title = 'Moderately Challenging'
    summary =
      'A balanced test that requires solid golf but offers scoring opportunities for capable players.'
  } else if (score >= 35) {
    title = 'Accessible Challenge'
    summary = 'Relatively manageable layout with some challenging elements. Most golfers can find success.'
  } else {
    title = 'Accommodating Layout'
    summary =
      'A player-friendly course that does not impose severe difficulty. Good opportunity for scoring.'
  }

  return {
    metric: 'overallDifficulty',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard course specifications'],
  }
}

/**
 * Generate explanation for Driving Importance metric.
 */
export function generateDrivingExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.drivingImportanceScore

  // Fairway width
  if (input.fairwayWidth === 'Narrow') {
    factors.push('Narrow fairways penalize inaccuracy')
  } else if (input.fairwayWidth === 'Wide') {
    factors.push('Wide fairways reduce driving emphasis')
  }

  // Par 4/5 count
  const longHoles = (input.parDistribution?.par4Count || 0) + (input.parDistribution?.par5Count || 0)
  if (longHoles >= 13) factors.push('High ratio of par 4s and 5s')
  else if (longHoles <= 10) factors.push('Significant par 3 content')

  // Average hole length
  if (input.averageHoleLength) {
    if (input.averageHoleLength >= 400) factors.push('Long average hole length')
    else if (input.averageHoleLength <= 350) factors.push('Short average hole length')
  }

  // Hazard presence
  if (input.waterHazards && input.waterHazards >= 3) {
    factors.push('Water hazards influence tee shots')
  }

  let title = 'Driving Assessment'
  let summary = ''

  if (score >= 80) {
    title = 'Precision Driving Essential'
    summary =
      'Accurate tee shots are critical for success. Narrow fairways and strategic hazards place a premium on consistent driving.'
  } else if (score >= 65) {
    title = 'Accuracy Matters'
    summary =
      'Players consistently finding fairways should gain an advantage. Poor tee shots create challenging recovery situations.'
  } else if (score >= 50) {
    title = 'Moderate Driving Emphasis'
    summary =
      'Driving accuracy is important but not dominant. Multiple strategic factors influence scoring.'
  } else if (score >= 35) {
    title = 'Forgiving Off Tee'
    summary =
      'Wider fairways and open design reduce driving pressure. Focus shifts to approach shots and putting.'
  } else {
    title = 'Very Forgiving Off Tee'
    summary = 'Abundant par 3s and forgiving layout mean driving is less critical to the scorecard.'
  }

  return {
    metric: 'drivingImportance',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Balanced driving demands'],
  }
}

/**
 * Generate explanation for Approach Importance metric.
 */
export function generateApproachExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.approachImportanceScore

  // Green size
  if (input.greenSize === 'Small') {
    factors.push('Small greens increase approach difficulty')
  } else if (input.greenSize === 'Large') {
    factors.push('Large greens reduce approach emphasis')
  }

  // Par 4 count
  if (input.parDistribution?.par4Count && input.parDistribution.par4Count >= 10) {
    factors.push('Abundant par 4s emphasize approach shots')
  }

  // Course length
  if (input.yardage && input.yardage >= 7000) {
    factors.push('Long yardage means longer approaches from fairway')
  }

  // Bunker/hazard count
  if (input.bunkerCount && input.bunkerCount >= 60) {
    factors.push('Significant bunker strategy around greens')
  }

  let title = 'Approach Shot Importance'
  let summary = ''

  if (score >= 75) {
    title = 'Elite Iron Play Required'
    summary =
      'Small greens and demanding approach angles require exceptional iron play. Precise distance control is essential.'
  } else if (score >= 60) {
    title = 'Precise Approach Shots Valued'
    summary =
      'Accurate approach play should provide a clear advantage. Green size and positioning reward solid ball-striking.'
  } else if (score >= 40) {
    title = 'Moderate Approach Demands'
    summary =
      'Approach shots are important but other elements (driving, putting) are equally critical to scoring.'
  } else {
    title = 'Accessible Approach Play'
    summary =
      'Larger greens and open design mean approach shots are relatively forgiving. Putting becomes more decisive.'
  }

  return {
    metric: 'approachImportance',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard approach demands'],
  }
}

/**
 * Generate explanation for Short Game Importance metric.
 */
export function generateShortGameExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.shortGameImportanceScore

  // Green size
  if (input.greenSize === 'Small') {
    factors.push('Small greens increase missed-green probability')
  }

  // Par 3 count
  if (input.parDistribution?.par3Count && input.parDistribution.par3Count >= 5) {
    factors.push('Many par 3s create short-game opportunities')
  } else if (input.parDistribution?.par3Count === 4) {
    factors.push('Standard par 3 count')
  }

  // Bunker density
  if (input.bunkerCount && input.bunkerCount >= 70) {
    factors.push('High bunker density around greens')
  }

  let title = 'Short Game Importance'
  let summary = ''

  if (score >= 75) {
    title = 'Scrambling Impossible'
    summary =
      'Severe short-game penalties. Missed greens result in difficult recovery situations. Elite chipping and pitching required.'
  } else if (score >= 60) {
    title = 'Short Game Critical'
    summary =
      'Strong chipping and pitching skills provide significant advantage. Misses are penalized but recoverable.'
  } else if (score >= 40) {
    title = 'Moderate Short Game Demands'
    summary =
      'Short-game play is important but not dominant. Balance of driving, approach, and short game.'
  } else {
    title = 'Very Forgiving Short Game'
    summary =
      'Generous greens and open design mean missed greens are manageable. Focus shifts to putting.'
  }

  return {
    metric: 'shortGameImportance',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard short-game demands'],
  }
}

/**
 * Generate explanation for Putting Importance metric.
 */
export function generatePuttingExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.puttingImportanceScore

  // Green size
  if (input.greenSize === 'Large') {
    factors.push('Large greens emphasize lag putting')
  } else if (input.greenSize === 'Small') {
    factors.push('Small greens create one-putt opportunities')
  }

  // Par 3 count
  if (input.parDistribution?.par3Count && input.parDistribution.par3Count >= 5) {
    factors.push('Many par 3s create single-putt chances')
  }

  // Course rating
  if (input.courseRating && input.courseRating >= 73) {
    factors.push('Elevated course rating suggests challenging greens')
  }

  // Birdie potential affects putting importance
  if (input.birdiePotentialScore >= 70) {
    factors.push('Reachable par 5s create eagle putts')
  }

  let title = 'Putting Importance'
  let summary = ''

  if (score >= 75) {
    title = 'Elite Putting Required'
    summary =
      'Fast greens and severe slopes demand exceptional putting. Small margins separate good scores from great scores.'
  } else if (score >= 60) {
    title = 'Bentgrass Specialists Thrive'
    summary =
      'Putting will be decisive. Fast surfaces reward confident, accurate stroke. Poor putting is severely penalized.'
  } else if (score >= 45) {
    title = 'Putting Important'
    summary =
      'Solid putting helps but does not dominate. Balanced test across all areas of the game.'
  } else {
    title = 'Forgiving on Greens'
    summary =
      'Slower greens and generous size mean putting is less critical. Approach shots more important to final score.'
  }

  return {
    metric: 'puttingImportance',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard putting demands'],
  }
}

/**
 * Generate explanation for Wind Sensitivity metric.
 */
export function generateWindExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.windSensitivityScore

  // Links style
  if (input.linksStyle) {
    factors.push('Links-style design increases wind exposure')
  }

  // Elevation
  if (input.elevation === 'High') {
    factors.push('Elevated terrain increases wind impact')
  }

  // Fairway width
  if (input.fairwayWidth === 'Open') {
    factors.push('Open fairways provide no wind shelter')
  }

  // Course length (wind affects longer holes more)
  if (input.averageHoleLength && input.averageHoleLength >= 390) {
    factors.push('Long holes more susceptible to wind')
  }

  let title = 'Wind Sensitivity'
  let summary = ''

  if (score >= 70) {
    title = 'Wind Dominates Play'
    summary =
      'Wind will be the primary variable affecting scoring. Exposed terrain and open design amplify wind effects dramatically.'
  } else if (score >= 50) {
    title = 'Wind Significantly Impacts Play'
    summary =
      'Wind direction and speed will influence strategy throughout the round. Factor in wind conditions when club selection.'
  } else if (score >= 35) {
    title = 'Moderate Wind Sensitivity'
    summary =
      'Wind matters but does not control the round. Other factors remain equally important.'
  } else {
    title = 'Wind Shielded'
    summary =
      'Trees, topography, or design shelter the course. Wind has minimal impact on play.'
  }

  return {
    metric: 'windSensitivity',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard wind exposure'],
  }
}

/**
 * Generate explanation for Penalty Severity metric.
 */
export function generatePenaltyExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.penaltySeverityScore

  // Water hazards
  if (input.waterHazards && input.waterHazards >= 4) {
    factors.push('Significant water hazards throughout')
  }

  // Out of bounds
  if (input.bunkerCount && input.bunkerCount >= 70) {
    factors.push('Dense bunker placement creates recovery difficulty')
  }

  // Handicap spread (indicates shot-value variation)
  if (input.handicapSpread && input.handicapSpread >= 18) {
    factors.push('Strategic handicap variation increases penalty impact')
  }

  // High slope suggests steep hazards
  if (input.slope && input.slope >= 135) {
    factors.push('Elevated slope indicates demanding hazard layout')
  }

  let title = 'Penalty Severity'
  let summary = ''

  if (score >= 75) {
    title = 'Severe Penalty Hazards'
    summary =
      'Water and bunkers create extreme penalties for misses. Missing fairways or greens often results in bogey or worse.'
  } else if (score >= 60) {
    title = 'Hazards Demand Respect'
    summary =
      'Strategic hazard placement rewards accurate shots. Poor decisions lead to significant penalties.'
  } else if (score >= 40) {
    title = 'Moderate Hazard Challenge'
    summary =
      'Hazards present but forgiving. Manageable recovery options available from most positions.'
  } else {
    title = 'Minimal Penalties'
    summary =
      'Forgiving layout with few severe hazards. Mistakes are recoverable. Open design encourages aggressive play.'
  }

  return {
    metric: 'penaltySeverity',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard penalty structure'],
  }
}

/**
 * Generate explanation for Birdie Potential metric.
 */
export function generateBirdieExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.birdiePotentialScore

  // Par 5 count
  if (input.parDistribution?.par5Count) {
    if (input.parDistribution.par5Count >= 4) {
      factors.push('Multiple reachable par 5s')
    } else if (input.parDistribution.par5Count <= 3) {
      factors.push('Limited par 5 scoring opportunities')
    }
  }

  // Short yardage
  if (input.yardage && input.yardage <= 6300) {
    factors.push('Moderate yardage favors scoring')
  }

  // Overall difficulty inverse relationship
  if (input.overallDifficultyScore <= 40) {
    factors.push('Accessible layout promotes birdies')
  }

  // Green size (larger = easier birdie)
  if (input.greenSize === 'Large') {
    factors.push('Large greens offer birdie opportunities')
  }

  let title = 'Birdie Potential'
  let summary = ''

  if (score >= 70) {
    title = 'Scoring Opportunities Plentiful'
    summary =
      'Reachable par 5s and accessible design create numerous birdie chances. Low scores are achievable.'
  } else if (score >= 55) {
    title = 'Reasonable Scoring Opportunity'
    summary =
      'Par 5s offer birdie possibilities. Shorter par 4s present opportunities for capable golfers.'
  } else if (score >= 40) {
    title = 'Limited Birdie Opportunity'
    summary =
      'Birdies available but require good shots. Solid play needed to reach them.'
  } else {
    title = 'Few Scoring Opportunities'
    summary =
      'Par is a strong score. Birdie opportunities rare. Excellent shot-making required for low numbers.'
  }

  return {
    metric: 'birdiePotential',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard scoring difficulty'],
  }
}

/**
 * Generate explanation for Scoring Volatility metric.
 */
export function generateVolatilityExplanation(input: ExplanationGenerationInput): RawExplanation {
  const factors: string[] = []
  const score = input.scoringVolatilityScore

  // Par distribution variance
  if (input.parDistribution) {
    const { par3Count = 0, par4Count = 0, par5Count = 0 } = input.parDistribution
    const total = par3Count + par4Count + par5Count
    const avgPar3 = par3Count / total
    const avgPar4 = par4Count / total
    const avgPar5 = par5Count / total

    // High variance in par distribution
    if ((par3Count >= 5 || par5Count >= 4) && avgPar4 < 0.55) {
      factors.push('Varied par distribution increases unpredictability')
    }
  }

  // Reachable par 5s
  if (input.reachablePar5s && input.reachablePar5s >= 3) {
    factors.push('Multiple eagle opportunities increase variance')
  } else if (input.reachablePar5s === 0) {
    factors.push('No reachable par 5s limits score range')
  }

  // Handicap spread
  if (input.handicapSpread && input.handicapSpread >= 18) {
    factors.push('Strategic difficulty variation increases volatility')
  }

  let title = 'Scoring Volatility'
  let summary = ''

  if (score >= 70) {
    title = 'High Scoring Variance'
    summary =
      'Wide gap between good and bad scores possible. Strategic par 5s and varied layout create score unpredictability.'
  } else if (score >= 55) {
    title = 'Moderate Scoring Variance'
    summary =
      'Score outcomes vary based on execution and strategic decisions. Balance of skill factors involved.'
  } else if (score >= 40) {
    title = 'Relatively Stable Scoring'
    summary =
      'Consistent layout produces relatively predictable scores. Good play usually results in similar outcomes.'
  } else {
    title = 'Very Consistent Scoring'
    summary =
      'Uniform hole design produces consistent scores. Little variance between good and exceptional rounds.'
  }

  return {
    metric: 'scoringVolatility',
    title,
    summary,
    contributingFactors: factors.length > 0 ? factors : ['Standard scoring variance'],
  }
}
