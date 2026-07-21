/**
 * Feature Cache Layer
 * 
 * Implements in-memory caching with TTL for extracted features.
 * Reduces database load for repeated feature extractions.
 * Maintains feature metadata including cache status.
 */

import { FeatureValue, NumericFeatureMetadata, markAsCached } from '../core/FeatureMetadata';
import { PlayerFeatures, CourseFeatures, CompleteFeatureSet } from '../core/FeatureTypes';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export class FeatureCache {
  private playerCache = new Map<string, CacheEntry<PlayerFeatures>>();
  private courseCache = new Map<string, CacheEntry<CourseFeatures>>();
  private completeCache = new Map<string, CacheEntry<CompleteFeatureSet>>();
  
  // Default TTLs
  private readonly PLAYER_FEATURES_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly COURSE_FEATURES_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (static)
  private readonly COMPLETE_FEATURES_TTL = 24 * 60 * 60 * 1000; // 1 day (dynamic)
  
  // Statistics
  private stats = {
    playerHits: 0,
    playerMisses: 0,
    courseHits: 0,
    courseMisses: 0,
    completeMisses: 0,
    completeHits: 0,
  };
  
  /**
   * Get player features from cache, or return null if not found/expired.
   */
  getPlayerFeatures(playerId: string): PlayerFeatures | null {
    const entry = this.playerCache.get(playerId);
    
    if (!entry) {
      this.stats.playerMisses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.playerCache.delete(playerId);
      this.stats.playerMisses++;
      return null;
    }
    
    this.stats.playerHits++;
    // Mark features as cached
    this.markFeaturesAsCached(entry.value);
    return entry.value;
  }
  
  /**
   * Cache player features.
   */
  setPlayerFeatures(playerId: string, features: PlayerFeatures, ttl?: number): void {
    this.playerCache.set(playerId, {
      value: features,
      timestamp: Date.now(),
      ttl: ttl || this.PLAYER_FEATURES_TTL,
    });
  }
  
  /**
   * Get course features from cache.
   */
  getCourseFeatures(courseId: string): CourseFeatures | null {
    const entry = this.courseCache.get(courseId);
    
    if (!entry) {
      this.stats.courseMisses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.courseCache.delete(courseId);
      this.stats.courseMisses++;
      return null;
    }
    
    this.stats.courseHits++;
    this.markFeaturesAsCached(entry.value);
    return entry.value;
  }
  
  /**
   * Cache course features.
   */
  setCourseFeatures(courseId: string, features: CourseFeatures, ttl?: number): void {
    this.courseCache.set(courseId, {
      value: features,
      timestamp: Date.now(),
      ttl: ttl || this.COURSE_FEATURES_TTL,
    });
  }
  
  /**
   * Get complete feature set from cache.
   */
  getCompleteFeatures(key: string): CompleteFeatureSet | null {
    const entry = this.completeCache.get(key);
    
    if (!entry) {
      this.stats.completeMisses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.completeCache.delete(key);
      this.stats.completeMisses++;
      return null;
    }
    
    this.stats.completeHits++;
    return entry.value;
  }
  
  /**
   * Cache complete feature set.
   */
  setCompleteFeatures(key: string, features: CompleteFeatureSet, ttl?: number): void {
    this.completeCache.set(key, {
      value: features,
      timestamp: Date.now(),
      ttl: ttl || this.COMPLETE_FEATURES_TTL,
    });
  }
  
  /**
   * Clear all caches.
   */
  clear(): void {
    this.playerCache.clear();
    this.courseCache.clear();
    this.completeCache.clear();
    this.stats = {
      playerHits: 0,
      playerMisses: 0,
      courseHits: 0,
      courseMisses: 0,
      completeMisses: 0,
      completeHits: 0,
    };
  }
  
  /**
   * Get cache statistics.
   */
  getStats() {
    return {
      player: {
        hits: this.stats.playerHits,
        misses: this.stats.playerMisses,
        hitRate: this.stats.playerHits / (this.stats.playerHits + this.stats.playerMisses) || 0,
      },
      course: {
        hits: this.stats.courseHits,
        misses: this.stats.courseMisses,
        hitRate: this.stats.courseHits / (this.stats.courseHits + this.stats.courseMisses) || 0,
      },
      complete: {
        hits: this.stats.completeHits,
        misses: this.stats.completeMisses,
        hitRate: this.stats.completeHits / (this.stats.completeHits + this.stats.completeMisses) || 0,
      },
    };
  }
  
  /**
   * Check if cache entry has expired.
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  /**
   * Mark all features in a set as cached.
   */
  private markFeaturesAsCached(features: PlayerFeatures | CourseFeatures): void {
    Object.values(features).forEach((feature: any) => {
      if (feature && feature.metadata) {
        feature.metadata = markAsCached(feature.metadata, 3600); // 1 hour expiry
      }
    });
  }
}

// Global cache instance
export const globalFeatureCache = new FeatureCache();
