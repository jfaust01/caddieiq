/**
 * LivePerformanceValidator — Phase 17.2 Live Tournament Validation Metrics
 * 
 * Calculates 12 validation metrics against live tournament results.
 * 
 * Metrics:
 * 1. Spearman Rank Correlation
 * 2. Kendall Tau
 * 3. NDCG@5, @10, @20
 * 4. Top-5/10/20 Hit Rate
 * 5. Cut Prediction Accuracy
 * 6. MAE/RMSE
 * 7. DK/FD Correlation
 * 8. Confidence Calibration
 */

export interface LiveMetrics {
  spearmanCorrelation: number;
  kendallTau: number;
  ndcg5: number;
  ndcg10: number;
  ndcg20: number;
  topFiveHitRate: number;
  topTenHitRate: number;
  topTwentyHitRate: number;
  cutPredictionAccuracy: number;
  meanAbsoluteError: number;
  rootMeanSquaredError: number;
  dkCorrelation: number;
  fdCorrelation: number;
  confidenceCalibration: number;
}

export interface ConfidenceBucket {
  range: string;
  predictedConfidence: number;
  actualSuccessRate: number;
  calibrationError: number;
}

export class LivePerformanceValidator {
  /**
   * Calculate all 14 live metrics
   */
  calculateMetrics(
    predictions: Array<{
      playerId: string;
      predictedRank: number;
      matchScore: number;
      confidence: number;
      dkValue: number;
      fdValue: number;
    }>,
    actuals: Array<{
      playerId: string;
      actualRank: number;
      scoreRelativePar: number;
      dkPoints: number;
      fdPoints: number;
      cutMade: boolean;
    }>
  ): LiveMetrics {
    // Sort by prediction
    const sortedPreds = [...predictions].sort(
      (a, b) => a.predictedRank - b.predictedRank
    );
    const sortedActuals = actuals.sort((a, b) => a.actualRank - b.actualRank);

    return {
      spearmanCorrelation: this.spearmanCorrelation(sortedPreds, sortedActuals),
      kendallTau: this.kendallTau(sortedPreds, sortedActuals),
      ndcg5: this.ndcg(sortedPreds, sortedActuals, 5),
      ndcg10: this.ndcg(sortedPreds, sortedActuals, 10),
      ndcg20: this.ndcg(sortedPreds, sortedActuals, 20),
      topFiveHitRate: this.topNHitRate(sortedPreds, sortedActuals, 5),
      topTenHitRate: this.topNHitRate(sortedPreds, sortedActuals, 10),
      topTwentyHitRate: this.topNHitRate(sortedPreds, sortedActuals, 20),
      cutPredictionAccuracy: this.cutPredictionAccuracy(
        predictions,
        actuals
      ),
      meanAbsoluteError: this.mae(sortedPreds, sortedActuals),
      rootMeanSquaredError: this.rmse(sortedPreds, sortedActuals),
      dkCorrelation: this.correlation(
        predictions.map((p) => p.dkValue),
        actuals.map((a) => a.dkPoints)
      ),
      fdCorrelation: this.correlation(
        predictions.map((p) => p.fdValue),
        actuals.map((a) => a.fdPoints)
      ),
      confidenceCalibration: this.confidenceCalibration(
        predictions,
        actuals
      ),
    };
  }

  /**
   * Validate confidence calibration by bucket
   */
  validateConfidenceBuckets(
    predictions: Array<{ confidence: number; actualRank: number }>,
    actuals: Array<{ actualRank: number }>
  ): ConfidenceBucket[] {
    const buckets: ConfidenceBucket[] = [
      { range: '90-100%', predictedConfidence: 0.95, actualSuccessRate: 0, calibrationError: 0 },
      { range: '80-90%', predictedConfidence: 0.85, actualSuccessRate: 0, calibrationError: 0 },
      { range: '70-80%', predictedConfidence: 0.75, actualSuccessRate: 0, calibrationError: 0 },
      { range: '60-70%', predictedConfidence: 0.65, actualSuccessRate: 0, calibrationError: 0 },
      { range: '50-60%', predictedConfidence: 0.55, actualSuccessRate: 0, calibrationError: 0 },
    ];

    for (const bucket of buckets) {
      const lower = parseFloat(bucket.range.split('-')[0]) / 100;
      const upper = parseFloat(bucket.range.split('-')[1]) / 100;

      const inBucket = predictions.filter(
        (p) => p.confidence >= lower && p.confidence < upper
      );

      if (inBucket.length > 0) {
        const successful = inBucket.filter(
          (p) => actuals.find((a) => a.actualRank === p.actualRank)?.actualRank <= 10
        ).length;

        bucket.actualSuccessRate = successful / inBucket.length;
        bucket.calibrationError = Math.abs(
          bucket.predictedConfidence - bucket.actualSuccessRate
        );
      }
    }

    return buckets;
  }

  // Metric implementations
  private spearmanCorrelation(
    preds: Array<{ predictedRank: number }>,
    actuals: Array<{ actualRank: number }>
  ): number {
    const n = Math.min(preds.length, actuals.length);
    let sumDSquared = 0;

    for (let i = 0; i < n; i++) {
      const d = preds[i].predictedRank - actuals[i].actualRank;
      sumDSquared += d * d;
    }

    return 1 - (6 * sumDSquared) / (n * (n * n - 1));
  }

  private kendallTau(
    preds: Array<{ predictedRank: number }>,
    actuals: Array<{ actualRank: number }>
  ): number {
    const n = preds.length;
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const predDiff =
          (preds[i].predictedRank - preds[j].predictedRank) *
          (actuals[i].actualRank - actuals[j].actualRank);

        if (predDiff > 0) concordant++;
        else if (predDiff < 0) discordant++;
      }
    }

    return (concordant - discordant) / ((n * (n - 1)) / 2);
  }

  private ndcg(
    preds: Array<{ predictedRank: number }>,
    actuals: Array<{ actualRank: number }>,
    k: number
  ): number {
    const topK = preds.slice(0, k);
    let dcg = 0;
    let idcg = 0;

    for (let i = 0; i < topK.length; i++) {
      const relevance = topK[i].predictedRank <= 10 ? 1 : 0;
      dcg += relevance / Math.log2(i + 2);
    }

    for (let i = 0; i < Math.min(k, actuals.length); i++) {
      const relevance = i < 10 ? 1 : 0;
      idcg += relevance / Math.log2(i + 2);
    }

    return dcg / Math.max(idcg, 1);
  }

  private topNHitRate(
    preds: Array<{ predictedRank: number; playerId: string }>,
    actuals: Array<{ playerId: string; actualRank: number }>,
    n: number
  ): number {
    const topNPreds = preds.slice(0, n);
    const topNActuals = actuals.filter((a) => a.actualRank <= n);

    const hits = topNPreds.filter((p) =>
      topNActuals.some((a) => a.playerId === p.playerId)
    ).length;

    return hits / n;
  }

  private cutPredictionAccuracy(
    predictions: Array<{ playerId: string; predictedRank: number }>,
    actuals: Array<{ playerId: string; cutMade: boolean }>
  ): number {
    const cutLine = 70;
    const correct = predictions.filter((p) => {
      const actual = actuals.find((a) => a.playerId === p.playerId);
      if (!actual) return false;

      const predictedCutMake = p.predictedRank <= cutLine;
      return predictedCutMake === actual.cutMade;
    }).length;

    return correct / predictions.length;
  }

  private mae(
    preds: Array<{ predictedRank: number }>,
    actuals: Array<{ actualRank: number }>
  ): number {
    const n = Math.min(preds.length, actuals.length);
    let sum = 0;

    for (let i = 0; i < n; i++) {
      sum += Math.abs(preds[i].predictedRank - actuals[i].actualRank);
    }

    return sum / n;
  }

  private rmse(
    preds: Array<{ predictedRank: number }>,
    actuals: Array<{ actualRank: number }>
  ): number {
    const n = Math.min(preds.length, actuals.length);
    let sum = 0;

    for (let i = 0; i < n; i++) {
      const diff = preds[i].predictedRank - actuals[i].actualRank;
      sum += diff * diff;
    }

    return Math.sqrt(sum / n);
  }

  private correlation(arr1: number[], arr2: number[]): number {
    const n = Math.min(arr1.length, arr2.length);
    const mean1 = arr1.slice(0, n).reduce((a, b) => a + b) / n;
    const mean2 = arr2.slice(0, n).reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = arr1[i] - mean1;
      const diff2 = arr2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denom1 * denom2);
  }

  private confidenceCalibration(
    predictions: Array<{ confidence: number; predictedRank: number }>,
    actuals: Array<{ actualRank: number }>
  ): number {
    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    const successRate =
      predictions.filter((p) => p.predictedRank <= 10).length / predictions.length;

    return 1 - Math.abs(avgConfidence - successRate);
  }
}
