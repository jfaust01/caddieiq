/**
 * Core Feature Type Definitions
 * 
 * Defines all player and course features extracted from data sources.
 * Based on Phase 16A architecture decision matrices.
 */

import { FeatureValue, NumericFeatureMetadata } from './FeatureMetadata';

// ============================================================================
// PLAYER FEATURES (V1 CORE + SUPPORTING)
// ============================================================================

/**
 * Player feature set extracted from PGA Tour statistics and historical data.
 * V1 Core: 9 primary features
 * V1 Supporting: 5 optional features
 * 
 * Reference: docs/PLAYER_ATTRIBUTE_DECISION_MATRIX.md
 */
export interface PlayerFeatures {
  // V1 CORE FEATURES (Always required)
  
  /** Driving distance: average yards off tee (0-350) */
  drivingDistance: FeatureValue<number>;
  
  /** Driving accuracy: fairway hit percentage (0-100) */
  drivingAccuracy: FeatureValue<number>;
  
  /** Approach play: SG:APP (strokes gained approach) (-3 to +3) */
  approachPlay: FeatureValue<number>;
  
  /** Short game: SG:Short Game (-3 to +3) */
  shortGame: FeatureValue<number>;
  
  /** Putting: SG:Putting (-3 to +3) */
  putting: FeatureValue<number>;
  
  /** Recovery shots: SG:OTT + SG:ARG combined (-3 to +3) */
  recovery: FeatureValue<number>;
  
  /** Recent form: 10-round scoring average vs baseline (-15 to +15) */
  recentForm: FeatureValue<number>;
  
  /** Venue history: average score differential at this venue (-10 to +10) */
  venueHistory: FeatureValue<number>;
  
  /** Score volatility: standard deviation of recent scores (0-10 strokes) */
  volatility: FeatureValue<number>;
  
  // V1 SUPPORTING FEATURES (Optional, extracted if available)
  
  /** Long course performance: scoring average on 7200+ yard courses */
  longCoursePerformance?: FeatureValue<number>;
  
  /** Tight fairway performance: scoring avg on courses with <65% fairway width */
  tightFairwayPerformance?: FeatureValue<number>;
  
  /** Fast green performance: scoring avg on Stimp 12+ greens */
  fastGreenPerformance?: FeatureValue<number>;
  
  /** Windy conditions performance: scoring avg in high wind events */
  windyConditionsPerformance?: FeatureValue<number>;
  
  /** Majors experience: number of major championships played */
  majorsExperience?: FeatureValue<number>;
}

/**
 * Player feature metadata: tracking how features were extracted.
 */
export interface PlayerFeatureLineage {
  playerId: string;
  playerName: string;
  extractionDate: Date;
  dataSource: 'PGA_TOUR_STATS' | 'SHOTLINK' | 'TOURNAMENT_RESULTS';
  roundsIncluded: number;
  venueId?: string;  // For venue-specific features
  featureVersions: {
    [key: string]: string; // featureName -> versionString
  };
}

// ============================================================================
// COURSE FEATURES (V1 CORE + SEMI-AUTOMATIC)
// ============================================================================

/**
 * Course feature set extracted from USGA, setup sheets, and design data.
 * V1 Core Automatic: 9 features
 * V1 Core Semi-Automatic: 4 features (available 1 week before tournament)
 * V1 Manual Research: 5 features (one-time curation per course)
 * 
 * Reference: docs/COURSE_ATTRIBUTE_DECISION_MATRIX.md
 */
export interface CourseFeatures {
  // V1 CORE AUTOMATIC (100% automatic, always available)
  
  /** Total yardage: from USGA course database (6000-8000) */
  totalYardage: FeatureValue<number>;
  
  /** Par: from course design (69-73) */
  par: FeatureValue<number>;
  
  /** Course rating: USGA rating (69-77) */
  courseRating: FeatureValue<number>;
  
  /** Slope rating: USGA slope (110-155) */
  slopeRating: FeatureValue<number>;
  
  /** Handicap index: difficulty score (0-100) */
  handicapIndex: FeatureValue<number>;
  
  /** Average hole length: total yardage / 18 (350-450 yards) */
  averageHoleLength: FeatureValue<number>;
  
  /** Par-3 count: number of par-3 holes (3-5) */
  par3Count: FeatureValue<number>;
  
  /** Par-4 count: number of par-4 holes (8-12) */
  par4Count: FeatureValue<number>;
  
  /** Par-5 count: number of par-5 holes (2-6) */
  par5Count: FeatureValue<number>;
  
  // V1 CORE SEMI-AUTOMATIC (Available ~1 week before tournament from setup sheet)
  
  /** Green speed: Stimp rating (10-14 ft) */
  greenSpeed?: FeatureValue<number>;
  
  /** Green firmness: scale 1-10 (1=soft, 10=hard) */
  greenFirmness?: FeatureValue<number>;
  
  /** Rough height: length of rough in inches (1.5-3.5) */
  roughHeight?: FeatureValue<number>;
  
  /** Fairway width: average fairway width in yards (30-60) */
  fairwayWidth?: FeatureValue<number>;
  
  // V1 MANUAL RESEARCH (One-time per course, requires research)
  
  /** Green size: average green size in sq ft (4000-6500) */
  greenSize?: FeatureValue<number>;
  
  /** Green complexity: scale 1-5 (1=simple, 5=complex) */
  greenComplexity?: FeatureValue<number>;
  
  /** Hazard density: water hazard percentage (0-50%) */
  hazardDensity?: FeatureValue<number>;
  
  /** Elevation change: total elevation gain in feet (0-300) */
  elevationChange?: FeatureValue<number>;
  
  /** Tree coverage: forest/tree percentage (0-100%) */
  treeCoverage?: FeatureValue<number>;
}

/**
 * Course feature metadata: tracking how features were extracted.
 */
export interface CourseFeatureLineage {
  courseId: string;
  courseName: string;
  extractionDate: Date;
  tournamentId?: string;
  setupDate?: Date;  // When setup sheet was released
  manualResearchDate?: Date;  // When manual features were curated
  automationLevel: 'FULLY_AUTOMATIC' | 'SEMI_AUTOMATIC' | 'MANUAL';
  featureVersions: {
    [key: string]: string; // featureName -> versionString
  };
}

// ============================================================================
// DERIVED FEATURES (Calculated from player + course features)
// ============================================================================

/**
 * Derived features calculated from player and course features.
 * These represent the core dimensions used in the matching engine.
 */
export interface DerivedFeatures {
  // Five components of match score
  
  /** Skill fit: 0-100 scale indicating player-course alignment */
  skillFit: FeatureValue<number>;
  
  /** Form bonus: -15 to +15 adjustment based on recent performance */
  formBonus: FeatureValue<number>;
  
  /** Venue history: -10 to +10 adjustment for this specific venue */
  venueHistoryBonus: FeatureValue<number>;
  
  /** Confidence: 0-100 indicating data quality and prediction certainty */
  confidence: FeatureValue<number>;
  
  /** Volatility: 0-10 ceiling/floor spread for uncertainty quantification */
  volatility: FeatureValue<number>;
}

/**
 * Complete feature set for a player-course combination.
 */
export interface CompleteFeatureSet {
  playerId: string;
  courseId: string;
  tournamentId?: string;
  playerFeatures: PlayerFeatures;
  courseFeatures: CourseFeatures;
  derivedFeatures: DerivedFeatures;
  extractedAt: Date;
  validatedAt?: Date;
  extractionVersion: string; // e.g., "1.0.0"
}

// ============================================================================
// FEATURE EXTRACTION ERRORS
// ============================================================================

export class FeatureExtractionError extends Error {
  constructor(
    public readonly featureName: string,
    public readonly entityId: string,
    public readonly source: string,
    message: string
  ) {
    super(`Feature extraction failed for ${featureName} (${entityId}): ${message}`);
    this.name = 'FeatureExtractionError';
  }
}

export class FeatureValidationError extends Error {
  constructor(
    public readonly featureName: string,
    public readonly value: number,
    public readonly validRange: { min: number; max: number },
    message: string
  ) {
    super(`Feature validation failed for ${featureName}: ${message}`);
    this.name = 'FeatureValidationError';
  }
}
