/**
 * SystemHealthMonitor — Phase 17.2 System Health & Operational Validation
 * 
 * Monitors:
 * 1. API latency
 * 2. Database performance
 * 3. Cache efficiency
 * 4. Memory usage
 * 5. CPU usage
 * 6. Prediction generation time
 * 7. Storage growth
 * 8. Logging completeness
 * 9. Alerting functionality
 */

export interface LatencyMetrics {
  apiLatency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  databaseLatency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  cacheLatency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
}

export interface ResourceMetrics {
  memory: {
    used: number; // MB
    available: number; // MB
    utilization: number; // %
  };
  cpu: {
    utilization: number; // %
    cores: number;
  };
  disk: {
    used: number; // GB
    available: number; // GB
    utilization: number; // %
    growthRate: number; // GB/day
  };
}

export interface CacheMetrics {
  hitRate: number; // %
  missRate: number; // %
  evictionRate: number; // %
  entriesStored: number;
  memoryUsed: number; // MB
}

export interface SystemHealthSnapshot {
  timestamp: Date;
  latency: LatencyMetrics;
  resources: ResourceMetrics;
  cache: CacheMetrics;
  predictions: {
    generationTimeAvg: number; // ms
    successRate: number; // %
    failureCount: number;
    totalGenerated: number;
  };
  logging: {
    logsGenerated: number;
    logsProcessed: number;
    averageLatency: number; // ms
    errors: number;
  };
  alerting: {
    alertsTriggered: number;
    alertsAcknowledged: number;
    falsePositives: number;
    averageResponseTime: number; // minutes
  };
  health: {
    overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    issues: string[];
  };
}

export class SystemHealthMonitor {
  private snapshots: SystemHealthSnapshot[] = [];
  private latencyHistory: number[] = [];
  private resourceHistory: ResourceMetrics[] = [];

  /**
   * Record system health snapshot
   */
  recordSnapshot(
    latency: LatencyMetrics,
    resources: ResourceMetrics,
    cache: CacheMetrics,
    predictions: {
      generationTimeAvg: number;
      successRate: number;
      failureCount: number;
      totalGenerated: number;
    },
    logging: {
      logsGenerated: number;
      logsProcessed: number;
      averageLatency: number;
      errors: number;
    },
    alerting: {
      alertsTriggered: number;
      alertsAcknowledged: number;
      falsePositives: number;
      averageResponseTime: number;
    }
  ): SystemHealthSnapshot {
    const issues = this.identifyIssues(
      latency,
      resources,
      cache,
      predictions,
      logging,
      alerting
    );

    const overallStatus = this.determineStatus(issues);

    const snapshot: SystemHealthSnapshot = {
      timestamp: new Date(),
      latency,
      resources,
      cache,
      predictions,
      logging,
      alerting,
      health: {
        overallStatus,
        issues,
      },
    };

    this.snapshots.push(snapshot);
    this.latencyHistory.push(latency.apiLatency.avg);
    this.resourceHistory.push(resources);

    return snapshot;
  }

  /**
   * Get health trend
   */
  getHealthTrend(hours: number = 24): {
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    latencyTrend: number; // percentage change
    resourceTrend: number; // percentage change
    stability: number; // 0-100
  } {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const recentSnapshots = this.snapshots.filter(
      (s) => s.timestamp.getTime() > cutoff
    );

    if (recentSnapshots.length < 2) {
      return {
        trend: 'STABLE',
        latencyTrend: 0,
        resourceTrend: 0,
        stability: 100,
      };
    }

    const firstLatency =
      recentSnapshots[0].latency.apiLatency.avg;
    const lastLatency =
      recentSnapshots[recentSnapshots.length - 1].latency.apiLatency.avg;
    const latencyTrend = ((lastLatency - firstLatency) / firstLatency) * 100;

    const firstResource =
      recentSnapshots[0].resources.memory.utilization;
    const lastResource =
      recentSnapshots[recentSnapshots.length - 1].resources.memory.utilization;
    const resourceTrend = ((lastResource - firstResource) / firstResource) * 100;

    const trend =
      latencyTrend < -5 || resourceTrend < -5
        ? 'IMPROVING'
        : latencyTrend > 5 || resourceTrend > 5
          ? 'DEGRADING'
          : 'STABLE';

    const stability = 100 - Math.abs(latencyTrend) - Math.abs(resourceTrend);

    return {
      trend,
      latencyTrend: Math.round(latencyTrend * 100) / 100,
      resourceTrend: Math.round(resourceTrend * 100) / 100,
      stability: Math.max(0, Math.min(100, stability)),
    };
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(): SystemHealthSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): SystemHealthSnapshot[] {
    return this.snapshots;
  }

  /**
   * Check SLA compliance
   */
  checkSLACompliance(targetUptime: number = 99.5): {
    compliant: boolean;
    uptime: number;
    violations: number;
  } {
    const healthy = this.snapshots.filter(
      (s) => s.health.overallStatus === 'HEALTHY'
    ).length;
    const uptime = (healthy / this.snapshots.length) * 100;
    const violations = this.snapshots.filter(
      (s) => s.health.overallStatus === 'CRITICAL'
    ).length;

    return {
      compliant: uptime >= targetUptime,
      uptime: Math.round(uptime * 100) / 100,
      violations,
    };
  }

  // Private methods

  private identifyIssues(
    latency: LatencyMetrics,
    resources: ResourceMetrics,
    cache: CacheMetrics,
    predictions: any,
    logging: any,
    alerting: any
  ): string[] {
    const issues: string[] = [];

    // Latency issues
    if (latency.apiLatency.p99 > 500) {
      issues.push('API latency P99 > 500ms');
    }
    if (latency.databaseLatency.p95 > 200) {
      issues.push('Database latency P95 > 200ms');
    }

    // Resource issues
    if (resources.memory.utilization > 85) {
      issues.push('Memory utilization > 85%');
    }
    if (resources.cpu.utilization > 80) {
      issues.push('CPU utilization > 80%');
    }
    if (resources.disk.utilization > 85) {
      issues.push('Disk utilization > 85%');
    }
    if (resources.disk.growthRate > 1) {
      issues.push(`Disk growth rate high: ${resources.disk.growthRate.toFixed(2)} GB/day`);
    }

    // Cache issues
    if (cache.hitRate < 60) {
      issues.push(`Cache hit rate low: ${cache.hitRate}%`);
    }
    if (cache.evictionRate > 15) {
      issues.push(`Cache eviction rate high: ${cache.evictionRate}%`);
    }

    // Prediction issues
    if (predictions.successRate < 95) {
      issues.push(`Prediction success rate: ${predictions.successRate}%`);
    }
    if (predictions.failureCount > 5) {
      issues.push(`Prediction failures: ${predictions.failureCount}`);
    }
    if (predictions.generationTimeAvg > 1000) {
      issues.push(`Prediction generation slow: ${predictions.generationTimeAvg}ms`);
    }

    // Logging issues
    if (logging.errors > 10) {
      issues.push(`Logging errors: ${logging.errors}`);
    }
    if (logging.averageLatency > 100) {
      issues.push(`Logging latency high: ${logging.averageLatency}ms`);
    }

    // Alerting issues
    if (alerting.falsePositives > 5) {
      issues.push(`Alert false positives: ${alerting.falsePositives}`);
    }
    if (alerting.averageResponseTime > 15) {
      issues.push(`Alert response time slow: ${alerting.averageResponseTime} minutes`);
    }

    return issues;
  }

  private determineStatus(issues: string[]): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    const criticalKeywords = ['failure', 'error', 'unavailable', 'exceeded'];
    const hasCritical = issues.some((i) =>
      criticalKeywords.some((k) => i.toLowerCase().includes(k))
    );

    if (hasCritical) return 'CRITICAL';
    if (issues.length > 2) return 'WARNING';
    return 'HEALTHY';
  }
}
