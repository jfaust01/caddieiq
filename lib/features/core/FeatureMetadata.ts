/**
 * Feature Metadata System
 * 
 * Tracks feature version, source, timestamp, and lineage for every extracted feature.
 * Ensures reproducibility and explainability per Phase 16B.2 requirements.
 * 
 * Reference: docs/MATCHING_ENGINE_COMPLETE_ARCHITECTURE.md
 * Reference: docs/BUILD_REPRODUCIBILITY.md
 */

/**
 * Source type indicates where a feature came from.
 * Enables tracing and validation of feature lineage.
 */
export type FeatureSource = 
  | "PGA_TOUR_STATS"      // Official PGA Tour Statistics
  | "SHOTLINK"            // ShotLink tracking data
  | "USGA_HANDICAP"       // USGA Handicap Index
  | "TOURNAMENT_RESULTS"  // Tournament scoring data
  | "DERIVED"             // Calculated from other features
  | "MANUAL_ENTRY"        // Manually entered (e.g., course setup)
  | "CACHE"               // Retrieved from cache
  | "API";                // External API

/**
 * Metadata attached to every feature value.
 * Enables complete reproducibility and auditability.
 */
export interface FeatureMetadata {
  // Identification
  featureName: string;
  featureVersion: string;        // e.g., "1.0.0" (semantic versioning)
  
  // Source tracking
  source: FeatureSource;
  sourceTimestamp: Date;         // When the source data was generated
  sourceId?: string;             // ID for tracing back to source system
  
  // Extraction timing
  extractedAt: Date;             // When this feature was extracted
  validatedAt?: Date;            // When this feature was validated
  expiresAt?: Date;              // When this feature becomes stale
  
  // Lineage and derivation
  isDerived: boolean;
  derivedFrom?: {
    features: string[];          // Names of parent features
    formula?: string;            // How it was derived
    calculationTime?: number;    // ms to calculate
  };
  
  // Confidence and quality
  confidenceScore: number;       // 0-1, how confident are we in this value?
  dataQualityIssues?: string[]; // Any warnings during extraction
  
  // Caching
  isCached: boolean;
  cacheExpiryTime?: number;      // TTL in seconds
  
  // Audit trail
  extractedBy: string;           // System/user that extracted
  validationErrors?: string[];   // Any validation issues
}

/**
 * Feature value with attached metadata.
 */
export interface FeatureValue<T = number> {
  value: T;
  metadata: FeatureMetadata;
}

/**
 * Extended metadata for numeric features.
 */
export interface NumericFeatureMetadata extends FeatureMetadata {
  // Range constraints
  min: number;
  max: number;
  expectedRange?: { min: number; max: number };
  
  // Statistical info
  sampleSize?: number;           // e.g., "based on 20 rounds"
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidence: number;          // 0.95 for 95%
  };
  
  // Normalization
  isNormalized: boolean;
  normalizationMethod?: string;  // e.g., "percentile", "z-score"
  normalizationBasis?: string;   // e.g., "2024_PGA_TOUR"
}

/**
 * Create feature metadata with all required fields.
 */
export function createFeatureMetadata(
  featureName: string,
  source: FeatureSource,
  isDerived: boolean = false,
  options?: Partial<FeatureMetadata>
): FeatureMetadata {
  const now = new Date();
  
  return {
    featureName,
    featureVersion: "1.0.0",
    source,
    sourceTimestamp: now,
    extractedAt: now,
    isDerived,
    confidenceScore: 0.8,
    isCached: false,
    extractedBy: "FeatureExtractor",
    ...options,
  };
}

/**
 * Create numeric feature metadata with range validation.
 */
export function createNumericFeatureMetadata(
  featureName: string,
  source: FeatureSource,
  min: number,
  max: number,
  isDerived: boolean = false,
  options?: Partial<NumericFeatureMetadata>
): NumericFeatureMetadata {
  const baseMetadata = createFeatureMetadata(featureName, source, isDerived);
  
  return {
    ...baseMetadata,
    min,
    max,
    isNormalized: false,
    ...options,
  } as NumericFeatureMetadata;
}

/**
 * Validate that a feature value is within metadata constraints.
 */
export function validateFeatureValue(
  value: number,
  metadata: NumericFeatureMetadata
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (value < metadata.min || value > metadata.max) {
    errors.push(
      `Value ${value} outside valid range [${metadata.min}, ${metadata.max}]`
    );
  }
  
  if (metadata.expectedRange) {
    if (value < metadata.expectedRange.min || value > metadata.expectedRange.max) {
      errors.push(
        `Value ${value} outside expected range [${metadata.expectedRange.min}, ${metadata.expectedRange.max}]`
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Update metadata to indicate a feature has been retrieved from cache.
 */
export function markAsCached(
  metadata: FeatureMetadata,
  cacheExpiry: number
): FeatureMetadata {
  return {
    ...metadata,
    isCached: true,
    cacheExpiryTime: cacheExpiry,
  };
}
