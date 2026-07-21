/**
 * MatchingCacheService - Performance Caching Layer
 * Phase 16B.5: Efficient caching of match scores and features
 * 
 * Strategy:
 * - Player features: 7-day TTL
 * - Course features: 30-day TTL (static)
 * - Match scores: 1-day TTL
 * - Tournament rankings: 1-day TTL
 * - User preferences: Session TTL
 */

export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
}

export class MatchingCacheService {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private metrics: CacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
  };

  /**
   * Get value from cache with TTL enforcement
   */
  get<T>(key: string): T | null {
    this.metrics.totalRequests++;
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.cacheMisses++;
      this.updateHitRate();
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      this.updateHitRate();
      return null;
    }

    this.metrics.cacheHits++;
    this.updateHitRate();
    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  private updateHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate =
        this.metrics.cacheHits / this.metrics.totalRequests;
    }
  }
}
