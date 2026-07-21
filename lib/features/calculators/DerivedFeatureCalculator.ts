/**
 * Derived Feature Calculator
 * 
 * Calculates the 5 derived features used in the matching engine:
 * 1. Skill Fit (0-100): player skill vs course demand
 * 2. Form Bonus (-15 to +15): recent performance adjustment
 * 3. Venue History (-10 to +10): venue-specific adjustment
 * 4. Confidence (0-100): data quality indicator
 * 5. Volatility (0-10): ceiling/floor spread
 * 
 * Reference: docs/MATCH_SCORE_ARCHITECTURE.md (Step 2)
 */

import { FeatureValue, createNumericFeatureMetadata } from '../core/FeatureMetadata';
import { PlayerFeatures, CourseFeatures, DerivedFeatures } from '../core/FeatureTypes';

/**
 * Calculate all derived features from player and course features.
 */
export function calculateDerivedFeatures(
  playerFeatures: PlayerFeatures,
  courseFeatures: CourseFeatures
): DerivedFeatures {
  return {
    skillFit: calculateSkillFit(playerFeatures, courseFeatures),
    formBonus: calculateFormBonus(playerFeatures),
    venueHistoryBonus: calculateVenueHistoryBonus(playerFeatures),
    confidence: calculateConfidence(playerFeatures, courseFeatures),
    volatility: calculateVolatility(playerFeatures, courseFeatures),
  };
}

// ============================================================================
// 1. SKILL FIT (0-100): Player skill vs course demand
// ============================================================================

/**
 * Skill Fit measures how well the player's skill profile matches the course's demands.
 * 
 * Formula:
 *   Skill Fit = Σ (player_skill[i] * course_demand_weight[i]) / Σ (weights[i])
 * 
 * Scale:
 *   80-100: Excellent structural fit
 *   65-79:  Good fit
 *   50-64:  Moderate fit
 *   35-49:  Poor fit
 *   0-34:   Terrible fit
 */
function calculateSkillFit(
  playerFeatures: PlayerFeatures,
  courseFeatures: CourseFeatures
): FeatureValue<number> {
  // Determine course demand profile from course features
  const courseDemands = getCourseDemandProfile(courseFeatures);
  
  // Extract player skills (0-100 scale)
  const playerSkills = {
    driving: (playerFeatures.drivingDistance.value + playerFeatures.drivingAccuracy.value) / 2,
    approach: playerFeatures.approachPlay.value,
    shortGame: playerFeatures.shortGame.value,
    putting: playerFeatures.putting.value,
    recovery: playerFeatures.recovery.value,
  };
  
  // Calculate weighted skill fit
  let totalScore = 0;
  let totalWeight = 0;
  
  totalScore += playerSkills.driving * courseDemands.drivingDemand;
  totalWeight += courseDemands.drivingDemand;
  
  totalScore += playerSkills.approach * courseDemands.approachDemand;
  totalWeight += courseDemands.approachDemand;
  
  totalScore += playerSkills.shortGame * courseDemands.shortGameDemand;
  totalWeight += courseDemands.shortGameDemand;
  
  totalScore += playerSkills.putting * courseDemands.puttingDemand;
  totalWeight += courseDemands.puttingDemand;
  
  totalScore += playerSkills.recovery * courseDemands.recoveryDemand;
  totalWeight += courseDemands.recoveryDemand;
  
  const skillFit = totalScore / totalWeight;
  
  const metadata = createNumericFeatureMetadata(
    'skillFit',
    'DERIVED',
    0,
    100,
    true,
    {
      extractedAt: new Date(),
      extractedBy: 'DerivedFeatureCalculator',
      confidenceScore: 0.95,
      sampleSize: 5,
      derivedFrom: {
        features: [
          'drivingDistance',
          'drivingAccuracy',
          'approachPlay',
          'shortGame',
          'putting',
          'recovery',
          'totalYardage',
          'par',
          'courseRating',
          'slopeRating',
          'greenSpeed',
        ],
        formula: 'weighted average of player skills vs course demands',
        calculationTime: 5,
      },
    }
  );
  
  return { value: Math.round(skillFit * 100) / 100, metadata };
}

/**
 * Determine course demand profile from course features.
 * Allocates weights across 5 skill dimensions based on course characteristics.
 */
function getCourseDemandProfile(courseFeatures: CourseFeatures) {
  // Baseline weights (must sum to 1.0)
  let driving = 0.25;
  let approach = 0.25;
  let shortGame = 0.20;
  let putting = 0.15;
  let recovery = 0.15;
  
  // Adjust based on course characteristics
  
  // If long course, increase driving demand
  if (courseFeatures.totalYardage.value > 7300) {
    driving += 0.10;
    approach -= 0.05;
    shortGame -= 0.05;
  }
  
  // If short course, decrease driving demand
  if (courseFeatures.totalYardage.value < 6700) {
    driving -= 0.05;
    approach += 0.05;
  }
  
  // If high course rating, increase overall difficulty
  if (courseFeatures.courseRating.value > 75) {
    approach += 0.05;
    putting += 0.05;
    shortGame += 0.05;
    driving -= 0.05;
    recovery -= 0.05;
  }
  
  // If many par-5s, increase driving demand
  const par5Ratio = (courseFeatures.par5Count.value || 4) / 18;
  if (par5Ratio > 0.22) {
    driving += 0.05;
    recovery -= 0.05;
  }
  
  // If many par-3s, increase putting demand
  const par3Ratio = (courseFeatures.par3Count.value || 4) / 18;
  if (par3Ratio > 0.22) {
    putting += 0.05;
    approach -= 0.05;
  }
  
  // Normalize to 1.0
  const total = driving + approach + shortGame + putting + recovery;
  
  return {
    drivingDemand: driving / total,
    approachDemand: approach / total,
    shortGameDemand: shortGame / total,
    puttingDemand: putting / total,
    recoveryDemand: recovery / total,
  };
}

// ============================================================================
// 2. FORM BONUS (-15 to +15): Recent performance adjustment
// ============================================================================

/**
 * Form bonus reflects current trajectory vs career baseline.
 * Already calculated in playerFeatures.recentForm, just pass through.
 */
function calculateFormBonus(playerFeatures: PlayerFeatures): FeatureValue<number> {
  const formValue = playerFeatures.recentForm.value;
  
  const metadata = createNumericFeatureMetadata(
    'formBonus',
    'DERIVED',
    -15,
    15,
    true,
    {
      extractedAt: new Date(),
      extractedBy: 'DerivedFeatureCalculator',
      confidenceScore: 0.85,
      derivedFrom: {
        features: ['recentForm'],
        formula: 'passthrough(recentForm)',
        calculationTime: 1,
      },
    }
  );
  
  return { value: formValue, metadata };
}

// ============================================================================
// 3. VENUE HISTORY BONUS (-10 to +10): Venue-specific adjustment
// ============================================================================

/**
 * Venue history bonus reflects how player has performed at this specific venue.
 * Already calculated in playerFeatures.venueHistory, just pass through.
 */
function calculateVenueHistoryBonus(playerFeatures: PlayerFeatures): FeatureValue<number> {
  const venueValue = playerFeatures.venueHistory.value;
  
  const metadata = createNumericFeatureMetadata(
    'venueHistoryBonus',
    'DERIVED',
    -10,
    10,
    true,
    {
      extractedAt: new Date(),
      extractedBy: 'DerivedFeatureCalculator',
      confidenceScore: 0.75,
      derivedFrom: {
        features: ['venueHistory'],
        formula: 'passthrough(venueHistory)',
        calculationTime: 1,
      },
    }
  );
  
  return { value: venueValue, metadata };
}

// ============================================================================
// 4. CONFIDENCE (0-100): Data quality indicator
// ============================================================================

/**
 * Confidence measures data quality and completeness.
 * Higher confidence = more data available = more reliable prediction.
 * 
 * Factors:
 * - Player: sample size, data freshness, venue history availability
 * - Course: automatic vs manual features, setup sheet availability
 */
function calculateConfidence(
  playerFeatures: PlayerFeatures,
  courseFeatures: CourseFeatures
): FeatureValue<number> {
  let confidenceScore = 0.5; // Start at baseline
  
  // Player-side confidence factors
  const playerConfidences = [
    playerFeatures.drivingDistance.metadata.confidenceScore,
    playerFeatures.drivingAccuracy.metadata.confidenceScore,
    playerFeatures.approachPlay.metadata.confidenceScore,
    playerFeatures.shortGame.metadata.confidenceScore,
    playerFeatures.putting.metadata.confidenceScore,
    playerFeatures.recovery.metadata.confidenceScore,
    playerFeatures.recentForm.metadata.confidenceScore,
    playerFeatures.volatility.metadata.confidenceScore,
  ];
  
  const playerAvgConfidence = playerConfidences.reduce((a, b) => a + b, 0) / playerConfidences.length;
  
  // Bonus if venue history is available
  let venueHistoryBonus = 0;
  if (playerFeatures.venueHistory && playerFeatures.venueHistory.metadata.confidenceScore > 0.5) {
    venueHistoryBonus = 0.15;
  }
  
  // Course-side confidence factors
  let courseConfidenceScore = 0.6; // Automatic features already available
  
  // Bonus if setup sheet features available
  let setupSheetBonus = 0;
  if (courseFeatures.greenSpeed && courseFeatures.fairwayWidth) {
    setupSheetBonus = 0.15;
  }
  
  // Penalty if manual features missing
  let manualFeaturePenalty = 0;
  const manualFeaturesCount = [
    courseFeatures.greenSize,
    courseFeatures.greenComplexity,
    courseFeatures.hazardDensity,
    courseFeatures.elevationChange,
    courseFeatures.treeCoverage,
  ].filter(f => f !== undefined).length;
  
  if (manualFeaturesCount < 3) {
    manualFeaturePenalty = -0.10;
  }
  
  const courseConfidence = Math.max(0, courseConfidenceScore + setupSheetBonus + manualFeaturePenalty);
  
  // Combine player and course confidence
  confidenceScore = (playerAvgConfidence * 0.6 + courseConfidence * 0.4) + venueHistoryBonus;
  
  // Clamp to 0-1 range then scale to 0-100
  confidenceScore = Math.max(0, Math.min(1, confidenceScore)) * 100;
  
  const metadata = createNumericFeatureMetadata(
    'confidence',
    'DERIVED',
    0,
    100,
    true,
    {
      extractedAt: new Date(),
      extractedBy: 'DerivedFeatureCalculator',
      confidenceScore: 0.90,
      derivedFrom: {
        features: [
          'playerConfidences',
          'courseFeatureCompleteness',
          'venueHistoryAvailability',
        ],
        formula: '(player_avg * 0.6 + course * 0.4 + bonuses) * 100',
        calculationTime: 3,
      },
    }
  );
  
  return { value: Math.round(confidenceScore * 100) / 100, metadata };
}

// ============================================================================
// 5. VOLATILITY (0-10): Ceiling/floor spread
// ============================================================================

/**
 * Volatility measures prediction uncertainty.
 * Higher volatility = wider ceiling/floor range = more variable outcome.
 * 
 * Components:
 * - Player volatility: inherent score variability
 * - Course volatility: how setup affects scoring
 * - Confidence impact: lower confidence = higher volatility
 */
function calculateVolatility(
  playerFeatures: PlayerFeatures,
  courseFeatures: CourseFeatures
): FeatureValue<number> {
  // Player volatility (directly from extracted feature)
  const playerVolatility = playerFeatures.volatility.value; // 0-10
  
  // Course volatility (derived from features if available)
  let courseVolatility = 2.0; // Baseline
  
  if (courseFeatures.slopeRating) {
    // Higher slope = more variable scoring
    courseVolatility += (courseFeatures.slopeRating.value - 130) / 10;
  }
  
  if (courseFeatures.greenSpeed && courseFeatures.greenSpeed.value > 12) {
    // Fast greens increase volatility
    courseVolatility += 1.5;
  }
  
  if (courseFeatures.hazardDensity && courseFeatures.hazardDensity.value > 30) {
    // High hazard density increases volatility
    courseVolatility += 1.0;
  }
  
  // Combined volatility
  let combinedVolatility = (playerVolatility + courseVolatility) / 2;
  
  // Clamp to 0-10 range
  combinedVolatility = Math.max(0, Math.min(10, combinedVolatility));
  
  const metadata = createNumericFeatureMetadata(
    'volatility',
    'DERIVED',
    0,
    10,
    true,
    {
      extractedAt: new Date(),
      extractedBy: 'DerivedFeatureCalculator',
      confidenceScore: 0.85,
      derivedFrom: {
        features: [
          'playerVolatility',
          'slopeRating',
          'greenSpeed',
          'hazardDensity',
        ],
        formula: 'clamp((playerVolatility + courseVolatility) / 2, 0, 10)',
        calculationTime: 4,
      },
    }
  );
  
  return { value: Math.round(combinedVolatility * 100) / 100, metadata };
}
