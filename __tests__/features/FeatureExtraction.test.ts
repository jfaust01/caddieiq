/**
 * Feature Extraction Tests
 * 
 * Comprehensive test suite for feature extraction layer.
 * Tests:
 * - Player feature extraction
 * - Course feature extraction
 * - Derived feature calculation
 * - Metadata tracking (version, source, timestamp, lineage)
 * - Validation and error handling
 * - Caching behavior
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractPlayerFeatures } from '../../lib/features/extractors/PlayerFeatureExtractor';
import { extractCourseFeatures } from '../../lib/features/extractors/CourseFeatureExtractor';
import { calculateDerivedFeatures } from '../../lib/features/calculators/DerivedFeatureCalculator';
import { FeatureCache } from '../../lib/features/cache/FeatureCache';
import { FeatureExtractionError } from '../../lib/features/core/FeatureTypes';

// Test data fixtures
const mockPlayerStats = {
  playerId: 'player-123',
  playerName: 'Test Player',
  avgDrivingDistance: 290,
  drivingAccuracyPct: 65,
  sgApproach: 0.5,
  sgAroundGreen: 0.3,
  sgOffTee: 0.2,
  sgPutting: -0.1,
  last10ScoringAvg: 70.2,
  careerScoringAvg: 71.5,
  last10ScoreStdDev: 2.1,
  roundsIncluded: 25,
  dataAsOf: new Date(),
  venueScoreAvg: 70.5,
  careersVenueScoreAvg: 71.2,
};

const mockCourseData = {
  courseId: 'course-456',
  courseName: 'Test Course',
  totalYardage: 7200,
  par: 71,
  courseRating: 74.5,
  slopeRating: 138,
  handicapIndex: 50,
  par3Count: 4,
  par4Count: 10,
  par5Count: 4,
  dataAsOf: new Date(),
  greenSpeed: 12.5,
  greenFirmness: 7,
  roughHeight: 2.5,
  fairwayWidth: 40,
  greenSize: 5200,
  greenComplexity: 3,
  hazardDensity: 25,
  elevationChange: 80,
  treeCoverage: 60,
};

describe('Feature Extraction System', () => {
  let cache: FeatureCache;
  
  beforeEach(() => {
    cache = new FeatureCache();
  });
  
  // =========================================================================
  // PLAYER FEATURE EXTRACTION TESTS
  // =========================================================================
  
  describe('Player Feature Extraction', () => {
    it('should extract all 9 core player features', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      
      expect(features).toBeDefined();
      expect(features.drivingDistance).toBeDefined();
      expect(features.drivingAccuracy).toBeDefined();
      expect(features.approachPlay).toBeDefined();
      expect(features.shortGame).toBeDefined();
      expect(features.putting).toBeDefined();
      expect(features.recovery).toBeDefined();
      expect(features.recentForm).toBeDefined();
      expect(features.venueHistory).toBeDefined();
      expect(features.volatility).toBeDefined();
    });
    
    it('should validate feature value ranges', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      
      // Driving distance should be 250-350
      expect(features.drivingDistance.value).toBeGreaterThanOrEqual(250);
      expect(features.drivingDistance.value).toBeLessThanOrEqual(350);
      
      // Form bonus should be -15 to 15
      expect(features.recentForm.value).toBeGreaterThanOrEqual(-15);
      expect(features.recentForm.value).toBeLessThanOrEqual(15);
      
      // Volatility should be 0-10
      expect(features.volatility.value).toBeGreaterThanOrEqual(0);
      expect(features.volatility.value).toBeLessThanOrEqual(10);
    });
    
    it('should track feature metadata (version, source, timestamp)', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      
      const metadata = features.drivingDistance.metadata;
      expect(metadata.featureName).toBe('drivingDistance');
      expect(metadata.featureVersion).toBe('1.0.0');
      expect(metadata.source).toBe('PGA_TOUR_STATS');
      expect(metadata.extractedAt).toBeInstanceOf(Date);
      expect(metadata.sourceTimestamp).toBeInstanceOf(Date);
    });
    
    it('should track feature lineage (derived features)', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      
      const recoveryMetadata = features.recovery.metadata;
      expect(recoveryMetadata.isDerived).toBe(true);
      expect(recoveryMetadata.derivedFrom).toBeDefined();
      expect(recoveryMetadata.derivedFrom?.features).toContain('sgOffTee');
      expect(recoveryMetadata.derivedFrom?.features).toContain('sgAroundGreen');
      expect(recoveryMetadata.derivedFrom?.formula).toBeDefined();
    });
    
    it('should calculate confidence based on sample size', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      
      const confidence = features.drivingDistance.metadata.confidenceScore;
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
  
  // =========================================================================
  // COURSE FEATURE EXTRACTION TESTS
  // =========================================================================
  
  describe('Course Feature Extraction', () => {
    it('should extract all automatic course features', async () => {
      const features = await extractCourseFeatures(mockCourseData);
      
      // All 9 automatic features should be present
      expect(features.totalYardage).toBeDefined();
      expect(features.par).toBeDefined();
      expect(features.courseRating).toBeDefined();
      expect(features.slopeRating).toBeDefined();
      expect(features.handicapIndex).toBeDefined();
      expect(features.averageHoleLength).toBeDefined();
      expect(features.par3Count).toBeDefined();
      expect(features.par4Count).toBeDefined();
      expect(features.par5Count).toBeDefined();
    });
    
    it('should extract semi-automatic features when available', async () => {
      const features = await extractCourseFeatures(mockCourseData);
      
      expect(features.greenSpeed).toBeDefined();
      expect(features.greenFirmness).toBeDefined();
      expect(features.roughHeight).toBeDefined();
      expect(features.fairwayWidth).toBeDefined();
    });
    
    it('should extract manual research features when available', async () => {
      const features = await extractCourseFeatures(mockCourseData);
      
      expect(features.greenSize).toBeDefined();
      expect(features.greenComplexity).toBeDefined();
      expect(features.hazardDensity).toBeDefined();
      expect(features.elevationChange).toBeDefined();
      expect(features.treeCoverage).toBeDefined();
    });
    
    it('should handle missing manual features gracefully', async () => {
      const courseDataNoManual = {
        ...mockCourseData,
        greenSize: undefined,
        greenComplexity: undefined,
        hazardDensity: undefined,
      };
      
      const features = await extractCourseFeatures(courseDataNoManual);
      
      // Should not throw, manual features just won't be present
      expect(features.greenSize).toBeUndefined();
      expect(features.totalYardage).toBeDefined();
    });
    
    it('should calculate derived features (averageHoleLength)', async () => {
      const features = await extractCourseFeatures(mockCourseData);
      
      // averageHoleLength should be totalYardage / 18
      const expected = mockCourseData.totalYardage / 18;
      expect(features.averageHoleLength.value).toBeCloseTo(expected, 0);
      expect(features.averageHoleLength.metadata.isDerived).toBe(true);
    });
    
    it('should track source and automation level', async () => {
      const features = await extractCourseFeatures(mockCourseData);
      
      expect(features.totalYardage.metadata.source).toBe('USGA_HANDICAP');
      expect(features.totalYardage.metadata.confidenceScore).toBe(1.0); // Automatic
      
      if (features.greenSize) {
        expect(features.greenSize.metadata.source).toBe('MANUAL_ENTRY');
        expect(features.greenSize.metadata.confidenceScore).toBeLessThan(1.0); // Manual
      }
    });
  });
  
  // =========================================================================
  // DERIVED FEATURES TESTS
  // =========================================================================
  
  describe('Derived Features Calculation', () => {
    it('should calculate all 5 derived features', async () => {
      const playerFeatures = await extractPlayerFeatures(mockPlayerStats);
      const courseFeatures = await extractCourseFeatures(mockCourseData);
      const derived = calculateDerivedFeatures(playerFeatures, courseFeatures);
      
      expect(derived.skillFit).toBeDefined();
      expect(derived.formBonus).toBeDefined();
      expect(derived.venueHistoryBonus).toBeDefined();
      expect(derived.confidence).toBeDefined();
      expect(derived.volatility).toBeDefined();
    });
    
    it('should validate derived feature ranges', async () => {
      const playerFeatures = await extractPlayerFeatures(mockPlayerStats);
      const courseFeatures = await extractCourseFeatures(mockCourseData);
      const derived = calculateDerivedFeatures(playerFeatures, courseFeatures);
      
      // Skill fit: 0-100
      expect(derived.skillFit.value).toBeGreaterThanOrEqual(0);
      expect(derived.skillFit.value).toBeLessThanOrEqual(100);
      
      // Form bonus: -15 to 15
      expect(derived.formBonus.value).toBeGreaterThanOrEqual(-15);
      expect(derived.formBonus.value).toBeLessThanOrEqual(15);
      
      // Confidence: 0-100
      expect(derived.confidence.value).toBeGreaterThanOrEqual(0);
      expect(derived.confidence.value).toBeLessThanOrEqual(100);
    });
    
    it('should track derivation lineage', async () => {
      const playerFeatures = await extractPlayerFeatures(mockPlayerStats);
      const courseFeatures = await extractCourseFeatures(mockCourseData);
      const derived = calculateDerivedFeatures(playerFeatures, courseFeatures);
      
      expect(derived.skillFit.metadata.isDerived).toBe(true);
      expect(derived.skillFit.metadata.derivedFrom).toBeDefined();
      expect(derived.skillFit.metadata.derivedFrom?.features).toContain('drivingDistance');
    });
  });
  
  // =========================================================================
  // METADATA TRACKING TESTS
  // =========================================================================
  
  describe('Feature Metadata Tracking', () => {
    it('should preserve feature version', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      
      // All features should have version 1.0.0
      Object.values(features).forEach((feature: any) => {
        expect(feature.metadata.featureVersion).toBe('1.0.0');
      });
    });
    
    it('should track extraction timestamp', async () => {
      const beforeExtraction = new Date();
      const features = await extractPlayerFeatures(mockPlayerStats);
      const afterExtraction = new Date();
      
      Object.values(features).forEach((feature: any) => {
        expect(feature.metadata.extractedAt.getTime()).toBeGreaterThanOrEqual(beforeExtraction.getTime());
        expect(feature.metadata.extractedAt.getTime()).toBeLessThanOrEqual(afterExtraction.getTime());
      });
    });
    
    it('should track data quality issues', async () => {
      const stats = {
        ...mockPlayerStats,
        avgDrivingDistance: 400, // Out of normal range
      };
      
      const features = await extractPlayerFeatures(stats);
      
      // Should have a quality issue warning
      const drivingMetadata = features.drivingDistance.metadata;
      expect(drivingMetadata.dataQualityIssues?.length).toBeGreaterThan(0);
      expect(drivingMetadata.confidenceScore).toBeLessThan(1.0);
    });
  });
  
  // =========================================================================
  // CACHING TESTS
  // =========================================================================
  
  describe('Feature Caching', () => {
    it('should cache and retrieve player features', async () => {
      const features1 = await extractPlayerFeatures(mockPlayerStats);
      cache.setPlayerFeatures(mockPlayerStats.playerId, features1);
      
      const cachedFeatures = cache.getPlayerFeatures(mockPlayerStats.playerId);
      
      expect(cachedFeatures).toBeDefined();
      expect(cachedFeatures?.drivingDistance.value).toBe(features1.drivingDistance.value);
    });
    
    it('should mark cached features with metadata', async () => {
      const features = await extractPlayerFeatures(mockPlayerStats);
      cache.setPlayerFeatures(mockPlayerStats.playerId, features);
      
      const cachedFeatures = cache.getPlayerFeatures(mockPlayerStats.playerId);
      
      expect(cachedFeatures?.drivingDistance.metadata.isCached).toBe(true);
    });
    
    it('should track cache hit/miss statistics', () => {
      const stats1 = cache.getStats();
      
      cache.getPlayerFeatures('nonexistent');
      const stats2 = cache.getStats();
      
      expect(stats2.player.misses).toBe(stats1.player.misses + 1);
    });
  });
  
  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  
  describe('Error Handling', () => {
    it('should throw FeatureExtractionError on critical failures', async () => {
      const invalidStats = {
        ...mockPlayerStats,
        playerId: undefined, // Invalid
      } as any;
      
      await expect(extractPlayerFeatures(invalidStats)).rejects.toThrow(FeatureExtractionError);
    });
  });
  
  // =========================================================================
  // PERFORMANCE BENCHMARKS
  // =========================================================================
  
  describe('Performance', () => {
    it('should extract player features < 100ms', async () => {
      const start = performance.now();
      await extractPlayerFeatures(mockPlayerStats);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
    
    it('should extract course features < 100ms', async () => {
      const start = performance.now();
      await extractCourseFeatures(mockCourseData);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
    
    it('should calculate derived features < 50ms', async () => {
      const playerFeatures = await extractPlayerFeatures(mockPlayerStats);
      const courseFeatures = await extractCourseFeatures(mockCourseData);
      
      const start = performance.now();
      calculateDerivedFeatures(playerFeatures, courseFeatures);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });
});
