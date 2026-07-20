/**
 * Course Feature Extractor
 * 
 * Extracts course features in three tiers:
 * - Automatic (9 features from USGA/public data)
 * - Semi-Automatic (4 features from tournament setup sheet, 1 week before)
 * - Manual (5 features requiring research, one-time per course)
 * 
 * Handles missing data gracefully with confidence adjustments.
 */

import { FeatureValue, createNumericFeatureMetadata, validateFeatureValue } from '../core/FeatureMetadata';
import { CourseFeatures, FeatureExtractionError, FeatureValidationError } from '../core/FeatureTypes';

/**
 * Raw course data from USGA and tournament setup sources.
 */
interface CourseDataRaw {
  courseId: string;
  courseName: string;
  
  // AUTOMATIC (from public USGA data)
  totalYardage: number;
  par: number;
  courseRating: number;
  slopeRating: number;
  handicapIndex: number;
  par3Count: number;
  par4Count: number;
  par5Count: number;
  
  // SEMI-AUTOMATIC (from setup sheet, optional)
  greenSpeed?: number;  // Stimp rating
  greenFirmness?: number; // 1-10 scale
  roughHeight?: number;  // inches
  fairwayWidth?: number;  // yards
  
  // MANUAL (optional, from research)
  greenSize?: number;  // sq ft
  greenComplexity?: number; // 1-5
  hazardDensity?: number; // 0-100%
  elevationChange?: number; // feet
  treeCoverage?: number; // 0-100%
  
  // Metadata
  dataAsOf: Date;
  setupSheetDate?: Date;
  manualCurationDate?: Date;
}

/**
 * Extract all available course features.
 */
export async function extractCourseFeatures(
  rawData: CourseDataRaw
): Promise<CourseFeatures> {
  const extractedAt = new Date();
  const features: CourseFeatures = {} as CourseFeatures;
  
  try {
    // AUTOMATIC FEATURES (always present)
    features.totalYardage = extractTotalYardage(rawData, extractedAt);
    features.par = extractPar(rawData, extractedAt);
    features.courseRating = extractCourseRating(rawData, extractedAt);
    features.slopeRating = extractSlopeRating(rawData, extractedAt);
    features.handicapIndex = extractHandicapIndex(rawData, extractedAt);
    features.averageHoleLength = extractAverageHoleLength(rawData, extractedAt);
    features.par3Count = extractPar3Count(rawData, extractedAt);
    features.par4Count = extractPar4Count(rawData, extractedAt);
    features.par5Count = extractPar5Count(rawData, extractedAt);
    
    // SEMI-AUTOMATIC FEATURES (if available from setup sheet)
    if (rawData.greenSpeed !== undefined) {
      features.greenSpeed = extractGreenSpeed(rawData, extractedAt);
    }
    if (rawData.greenFirmness !== undefined) {
      features.greenFirmness = extractGreenFirmness(rawData, extractedAt);
    }
    if (rawData.roughHeight !== undefined) {
      features.roughHeight = extractRoughHeight(rawData, extractedAt);
    }
    if (rawData.fairwayWidth !== undefined) {
      features.fairwayWidth = extractFairwayWidth(rawData, extractedAt);
    }
    
    // MANUAL FEATURES (if available from research)
    if (rawData.greenSize !== undefined) {
      features.greenSize = extractGreenSize(rawData, extractedAt);
    }
    if (rawData.greenComplexity !== undefined) {
      features.greenComplexity = extractGreenComplexity(rawData, extractedAt);
    }
    if (rawData.hazardDensity !== undefined) {
      features.hazardDensity = extractHazardDensity(rawData, extractedAt);
    }
    if (rawData.elevationChange !== undefined) {
      features.elevationChange = extractElevationChange(rawData, extractedAt);
    }
    if (rawData.treeCoverage !== undefined) {
      features.treeCoverage = extractTreeCoverage(rawData, extractedAt);
    }
    
    return features;
  } catch (error) {
    throw new FeatureExtractionError(
      'CourseFeatures',
      rawData.courseId,
      'USGA_HANDICAP',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// AUTOMATIC FEATURES (from public USGA data)
// ============================================================================

function extractTotalYardage(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.totalYardage;
  const metadata = createNumericFeatureMetadata(
    'totalYardage',
    'USGA_HANDICAP',
    6000,
    8000,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

function extractPar(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.par;
  const metadata = createNumericFeatureMetadata(
    'par',
    'USGA_HANDICAP',
    69,
    73,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

function extractCourseRating(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.courseRating;
  const metadata = createNumericFeatureMetadata(
    'courseRating',
    'USGA_HANDICAP',
    69,
    77,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

function extractSlopeRating(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.slopeRating;
  const metadata = createNumericFeatureMetadata(
    'slopeRating',
    'USGA_HANDICAP',
    110,
    155,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

function extractHandicapIndex(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.handicapIndex;
  const metadata = createNumericFeatureMetadata(
    'handicapIndex',
    'USGA_HANDICAP',
    0,
    100,
    true,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
      derivedFrom: {
        features: ['courseRating', 'par', 'slopeRating'],
        formula: '(courseRating - par) * 113 / slopeRating',
        calculationTime: 1,
      },
    }
  );
  
  return { value, metadata };
}

function extractAverageHoleLength(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.totalYardage / 18;
  const metadata = createNumericFeatureMetadata(
    'averageHoleLength',
    'USGA_HANDICAP',
    350,
    450,
    true,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
      derivedFrom: {
        features: ['totalYardage'],
        formula: 'totalYardage / 18',
        calculationTime: 1,
      },
    }
  );
  
  return { value, metadata };
}

function extractPar3Count(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.par3Count;
  const metadata = createNumericFeatureMetadata(
    'par3Count',
    'USGA_HANDICAP',
    3,
    5,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

function extractPar4Count(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.par4Count;
  const metadata = createNumericFeatureMetadata(
    'par4Count',
    'USGA_HANDICAP',
    8,
    12,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

function extractPar5Count(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.par5Count;
  const metadata = createNumericFeatureMetadata(
    'par5Count',
    'USGA_HANDICAP',
    2,
    6,
    false,
    {
      sourceTimestamp: data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 1.0,
    }
  );
  
  return { value, metadata };
}

// ============================================================================
// SEMI-AUTOMATIC FEATURES (from tournament setup sheet)
// ============================================================================

function extractGreenSpeed(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.greenSpeed!;
  const metadata = createNumericFeatureMetadata(
    'greenSpeed',
    'TOURNAMENT_RESULTS', // Setup sheet from tournament
    10,
    14,
    false,
    {
      sourceTimestamp: data.setupSheetDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 0.95,
    }
  );
  
  return { value, metadata };
}

function extractGreenFirmness(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.greenFirmness!;
  const metadata = createNumericFeatureMetadata(
    'greenFirmness',
    'TOURNAMENT_RESULTS',
    1,
    10,
    false,
    {
      sourceTimestamp: data.setupSheetDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 0.90,
    }
  );
  
  return { value, metadata };
}

function extractRoughHeight(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.roughHeight!;
  const metadata = createNumericFeatureMetadata(
    'roughHeight',
    'TOURNAMENT_RESULTS',
    1.5,
    3.5,
    false,
    {
      sourceTimestamp: data.setupSheetDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 0.90,
    }
  );
  
  return { value, metadata };
}

function extractFairwayWidth(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.fairwayWidth!;
  const metadata = createNumericFeatureMetadata(
    'fairwayWidth',
    'TOURNAMENT_RESULTS',
    30,
    60,
    false,
    {
      sourceTimestamp: data.setupSheetDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseFeatureExtractor',
      confidenceScore: 0.85,
    }
  );
  
  return { value, metadata };
}

// ============================================================================
// MANUAL FEATURES (from research/curation)
// ============================================================================

function extractGreenSize(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.greenSize!;
  const metadata = createNumericFeatureMetadata(
    'greenSize',
    'MANUAL_ENTRY',
    4000,
    6500,
    false,
    {
      sourceTimestamp: data.manualCurationDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseResearch',
      confidenceScore: 0.75,
      dataQualityIssues: ['Manually researched - subject to variance'],
    }
  );
  
  return { value, metadata };
}

function extractGreenComplexity(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.greenComplexity!;
  const metadata = createNumericFeatureMetadata(
    'greenComplexity',
    'MANUAL_ENTRY',
    1,
    5,
    false,
    {
      sourceTimestamp: data.manualCurationDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseResearch',
      confidenceScore: 0.70,
      dataQualityIssues: ['Manually researched - subjective rating'],
    }
  );
  
  return { value, metadata };
}

function extractHazardDensity(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.hazardDensity!;
  const metadata = createNumericFeatureMetadata(
    'hazardDensity',
    'MANUAL_ENTRY',
    0,
    100,
    false,
    {
      sourceTimestamp: data.manualCurationDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseResearch',
      confidenceScore: 0.75,
      dataQualityIssues: ['Manually estimated percentage'],
    }
  );
  
  return { value, metadata };
}

function extractElevationChange(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.elevationChange!;
  const metadata = createNumericFeatureMetadata(
    'elevationChange',
    'MANUAL_ENTRY',
    0,
    300,
    false,
    {
      sourceTimestamp: data.manualCurationDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseResearch',
      confidenceScore: 0.75,
      dataQualityIssues: ['Manually estimated from course maps'],
    }
  );
  
  return { value, metadata };
}

function extractTreeCoverage(
  data: CourseDataRaw,
  extractedAt: Date
): FeatureValue<number> {
  const value = data.treeCoverage!;
  const metadata = createNumericFeatureMetadata(
    'treeCoverage',
    'MANUAL_ENTRY',
    0,
    100,
    false,
    {
      sourceTimestamp: data.manualCurationDate || data.dataAsOf,
      extractedAt,
      extractedBy: 'CourseResearch',
      confidenceScore: 0.70,
      dataQualityIssues: ['Manually estimated percentage'],
    }
  );
  
  return { value, metadata };
}
