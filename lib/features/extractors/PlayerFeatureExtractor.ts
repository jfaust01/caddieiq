/**
 * Player Feature Extractor
 * 
 * Extracts all 9 V1 core player features from PGA Tour statistics and ShotLink data.
 * Handles data validation, edge cases, and comprehensive error handling.
 * 
 * V1 Features:
 * - Driving Distance
 * - Driving Accuracy
 * - Approach Play (SG:APP)
 * - Short Game (SG:Short)
 * - Putting (SG:Putting)
 * - Recovery (SG:OTT + SG:ARG)
 * - Recent Form (10-round average vs baseline)
 * - Venue History (score differential at this venue)
 * - Score Volatility (standard deviation)
 */

import { FeatureValue, createNumericFeatureMetadata, validateFeatureValue } from '../core/FeatureMetadata';
import { PlayerFeatures, FeatureExtractionError, FeatureValidationError } from '../core/FeatureTypes';

/**
 * Raw player statistics from PGA Tour data source.
 */
interface PlayerStatsRaw {
  playerId: string;
  playerName: string;
  
  // Driving stats (last 2 seasons)
  avgDrivingDistance: number;
  drivingAccuracyPct: number;
  
  // Strokes gained stats (cumulative)
  sgApproach: number;
  sgAroundGreen: number;
  sgOffTee: number;
  sgPutting: number;
  
  // Recent performance (last 10 rounds)
  last10ScoringAvg: number;
  careerScoringAvg: number;
  
  // Venue-specific (optional)
  venueScoreAvg?: number;
  careersVenueScoreAvg?: number;
  
  // Volatility
  last10ScoreStdDev: number;
  
  // Metadata
  roundsIncluded: number;
  dataAsOf: Date;
}

/**
 * Extract all player features from raw statistics.
 */
export async function extractPlayerFeatures(
  rawStats: PlayerStatsRaw
): Promise<PlayerFeatures> {
  const extractedAt = new Date();
  const errors: FeatureExtractionError[] = [];
  
  try {
    // 1. Driving Distance (0-350 yards)
    const drivingDistance = extractDrivingDistance(rawStats, extractedAt, errors);
    
    // 2. Driving Accuracy (0-100%)
    const drivingAccuracy = extractDrivingAccuracy(rawStats, extractedAt, errors);
    
    // 3. Approach Play (SG:APP, -3 to +3)
    const approachPlay = extractApproachPlay(rawStats, extractedAt, errors);
    
    // 4. Short Game (SG:Short Game, -3 to +3)
    const shortGame = extractShortGame(rawStats, extractedAt, errors);
    
    // 5. Putting (SG:Putting, -3 to +3)
    const putting = extractPutting(rawStats, extractedAt, errors);
    
    // 6. Recovery (SG:OTT + SG:ARG, -3 to +3)
    const recovery = extractRecovery(rawStats, extractedAt, errors);
    
    // 7. Recent Form (-15 to +15)
    const recentForm = extractRecentForm(rawStats, extractedAt, errors);
    
    // 8. Venue History (-10 to +10)
    const venueHistory = extractVenueHistory(rawStats, extractedAt, errors);
    
    // 9. Score Volatility (0-10)
    const volatility = extractVolatility(rawStats, extractedAt, errors);
    
    // Report any non-critical errors
    if (errors.length > 0) {
      console.warn(`[Feature Extraction] ${errors.length} warnings for player ${rawStats.playerId}`);
      errors.forEach(e => console.warn(`  - ${e.message}`));
    }
    
    return {
      drivingDistance,
      drivingAccuracy,
      approachPlay,
      shortGame,
      putting,
      recovery,
      recentForm,
      venueHistory,
      volatility,
    };
  } catch (error) {
    throw new FeatureExtractionError(
      'PlayerFeatures',
      rawStats.playerId,
      'PGA_TOUR_STATS',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// Individual Feature Extractors
// ============================================================================

function extractDrivingDistance(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  const value = stats.avgDrivingDistance;
  const metadata = createNumericFeatureMetadata(
    'drivingDistance',
    'PGA_TOUR_STATS',
    250,
    350,
    false,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: stats.roundsIncluded,
      confidenceScore: calculateConfidence(stats.roundsIncluded, 20, 40),
      normalizationMethod: 'percentile',
      normalizationBasis: '2024_PGA_TOUR',
    }
  );
  
  const validation = validateFeatureValue(value, metadata);
  if (!validation.valid) {
    // Log but don't throw - use raw value with warning
    metadata.dataQualityIssues = validation.errors;
    metadata.confidenceScore *= 0.8;
  }
  
  return { value, metadata };
}

function extractDrivingAccuracy(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  const value = stats.drivingAccuracyPct;
  const metadata = createNumericFeatureMetadata(
    'drivingAccuracy',
    'PGA_TOUR_STATS',
    40,
    75,
    false,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: stats.roundsIncluded,
      confidenceScore: calculateConfidence(stats.roundsIncluded, 25, 50),
      normalizationMethod: 'percentile',
      normalizationBasis: '2024_PGA_TOUR',
    }
  );
  
  const validation = validateFeatureValue(value, metadata);
  if (!validation.valid) {
    metadata.dataQualityIssues = validation.errors;
    metadata.confidenceScore *= 0.8;
  }
  
  return { value, metadata };
}

function extractApproachPlay(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  // SG:Approach is measured in strokes gained, convert to 0-100 scale
  // Typical range: -3 to +3, normalize to 0-100 (50 = average)
  const value = normalizeStrokesGained(stats.sgApproach);
  const metadata = createNumericFeatureMetadata(
    'approachPlay',
    'SHOTLINK',
    0,
    100,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: stats.roundsIncluded,
      confidenceScore: calculateConfidence(stats.roundsIncluded, 30, 60),
      derivedFrom: {
        features: ['sgApproach'],
        formula: 'normalizeStrokesGained(sgApproach)',
        calculationTime: 1,
      },
      normalizationMethod: 'sigmoid',
      normalizationBasis: '2024_PGA_TOUR',
    }
  );
  
  return { value, metadata };
}

function extractShortGame(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  const value = normalizeStrokesGained(stats.sgAroundGreen);
  const metadata = createNumericFeatureMetadata(
    'shortGame',
    'SHOTLINK',
    0,
    100,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: stats.roundsIncluded,
      confidenceScore: calculateConfidence(stats.roundsIncluded, 30, 60),
      derivedFrom: {
        features: ['sgAroundGreen'],
        formula: 'normalizeStrokesGained(sgAroundGreen)',
        calculationTime: 1,
      },
      normalizationMethod: 'sigmoid',
      normalizationBasis: '2024_PGA_TOUR',
    }
  );
  
  return { value, metadata };
}

function extractPutting(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  const value = normalizeStrokesGained(stats.sgPutting);
  const metadata = createNumericFeatureMetadata(
    'putting',
    'SHOTLINK',
    0,
    100,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: stats.roundsIncluded,
      confidenceScore: calculateConfidence(stats.roundsIncluded, 30, 60),
      derivedFrom: {
        features: ['sgPutting'],
        formula: 'normalizeStrokesGained(sgPutting)',
        calculationTime: 1,
      },
      normalizationMethod: 'sigmoid',
      normalizationBasis: '2024_PGA_TOUR',
    }
  );
  
  return { value, metadata };
}

function extractRecovery(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  const combined = stats.sgOffTee + stats.sgAroundGreen;
  const value = normalizeStrokesGained(combined / 2);
  const metadata = createNumericFeatureMetadata(
    'recovery',
    'SHOTLINK',
    0,
    100,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: stats.roundsIncluded,
      confidenceScore: calculateConfidence(stats.roundsIncluded, 30, 60),
      derivedFrom: {
        features: ['sgOffTee', 'sgAroundGreen'],
        formula: 'normalizeStrokesGained(average(sgOffTee, sgAroundGreen))',
        calculationTime: 2,
      },
      normalizationMethod: 'sigmoid',
      normalizationBasis: '2024_PGA_TOUR',
    }
  );
  
  return { value, metadata };
}

function extractRecentForm(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  // Form is differential: recent avg vs career avg
  // Clamp to -15 to +15 range
  const differential = stats.last10ScoringAvg - stats.careerScoringAvg;
  const value = Math.max(-15, Math.min(15, differential * 3)); // Amplify for visibility
  
  const metadata = createNumericFeatureMetadata(
    'recentForm',
    'TOURNAMENT_RESULTS',
    -15,
    15,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: 10,
      confidenceScore: Math.min(1.0, 10 / Math.max(10, stats.roundsIncluded)) * 0.9,
      derivedFrom: {
        features: ['last10ScoringAvg', 'careerScoringAvg'],
        formula: 'clamp(last10Avg - careerAvg, -15, 15)',
        calculationTime: 1,
      },
    }
  );
  
  return { value, metadata };
}

function extractVenueHistory(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  if (!stats.venueScoreAvg || !stats.careersVenueScoreAvg) {
    // No venue history available
    return {
      value: 0,
      metadata: createNumericFeatureMetadata(
        'venueHistory',
        'TOURNAMENT_RESULTS',
        -10,
        10,
        true,
        {
          sourceTimestamp: stats.dataAsOf,
          extractedAt,
          extractedBy: 'PlayerFeatureExtractor',
          sampleSize: 0,
          confidenceScore: 0.1,
          dataQualityIssues: ['No venue history available for this player'],
        }
      ),
    };
  }
  
  const differential = stats.venueScoreAvg - stats.careersVenueScoreAvg;
  const value = Math.max(-10, Math.min(10, differential * 2));
  
  const metadata = createNumericFeatureMetadata(
    'venueHistory',
    'TOURNAMENT_RESULTS',
    -10,
    10,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: 3,
      confidenceScore: 0.6,
      derivedFrom: {
        features: ['venueScoreAvg', 'careersVenueScoreAvg'],
        formula: 'clamp(venueAvg - careerAvg, -10, 10)',
        calculationTime: 1,
      },
    }
  );
  
  return { value, metadata };
}

function extractVolatility(
  stats: PlayerStatsRaw,
  extractedAt: Date,
  errors: FeatureExtractionError[]
): FeatureValue<number> {
  // Standard deviation, normalized to 0-10 range
  const value = Math.min(10, stats.last10ScoreStdDev);
  
  const metadata = createNumericFeatureMetadata(
    'volatility',
    'TOURNAMENT_RESULTS',
    0,
    10,
    true,
    {
      sourceTimestamp: stats.dataAsOf,
      extractedAt,
      extractedBy: 'PlayerFeatureExtractor',
      sampleSize: 10,
      confidenceScore: 0.85,
      derivedFrom: {
        features: ['last10Scores'],
        formula: 'min(stdDev(last10Scores), 10)',
        calculationTime: 1,
      },
    }
  );
  
  return { value, metadata };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize strokes gained (-3 to +3) to 0-100 scale using sigmoid.
 * -3 → ~0, 0 → 50, +3 → ~100
 */
function normalizeStrokesGained(sgValue: number): number {
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  const normalized = sigmoid((sgValue / 1.5) * 4) * 100;
  return Math.round(normalized * 100) / 100;
}

/**
 * Calculate confidence score based on sample size.
 * Higher sample size = higher confidence.
 */
function calculateConfidence(
  actual: number,
  minSample: number,
  optimalSample: number
): number {
  if (actual < minSample) return 0.5;
  if (actual >= optimalSample) return 1.0;
  return 0.5 + ((actual - minSample) / (optimalSample - minSample)) * 0.5;
}
