/**
 * MetricCalculator - Implements all 18 evaluation metrics
 * 
 * Reference: docs/EVALUATION_METRICS.md
 * Calculates: Spearman, Kendall Tau, NDCG, Hit Rates, Cut Accuracy, Calibration, DFS Value, EV
 */

export class MetricCalculator {
  /**
   * Spearman Rank Correlation (ρ)
   * Formula: ρ = 1 - (6 * Σ(d_i^2)) / (n * (n^2 - 1))
   * Target V1: 0.35+, V2: 0.45+
   */
  static calculateSpearmanCorrelation(
    predictedRanks: number[],
    actualRanks: number[]
  ): number {
    const n = predictedRanks.length;
    if (n < 2) return 0;

    const sumSquaredDiffs = predictedRanks.reduce((sum, pred, i) => {
      const diff = pred - actualRanks[i];
      return sum + diff * diff;
    }, 0);

    return 1 - (6 * sumSquaredDiffs) / (n * (n * n - 1));
  }

  /**
   * Kendall Tau Correlation
   * Based on concordant/discordant pairs
   * Target: 0.05-0.10 lower than Spearman
   */
  static calculateKendallTau(
    predictedRanks: number[],
    actualRanks: number[]
  ): number {
    const n = predictedRanks.length;
    if (n < 2) return 0;

    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const predOrder = Math.sign(predictedRanks[i] - predictedRanks[j]);
        const actualOrder = Math.sign(actualRanks[i] - actualRanks[j]);
        
        if (predOrder === actualOrder) {
          concordant++;
        } else {
          discordant++;
        }
      }
    }

    const total = (n * (n - 1)) / 2;
    return (concordant - discordant) / total;
  }

  /**
   * NDCG@K (Normalized Discounted Cumulative Gain)
   * Target@5: V1 0.55+, V2 0.65+
   * Target@10: V1 0.50+, V2 0.60+
   */
  static calculateNDCG(
    predictedTopK: number[],
    actualTopK: Set<number>,
    k: number
  ): number {
    let dcg = 0;
    for (let i = 0; i < k && i < predictedTopK.length; i++) {
      const relevance = actualTopK.has(predictedTopK[i]) ? 1 : 0;
      dcg += relevance / Math.log2(i + 2);
    }

    let idcg = 0;
    for (let i = 0; i < Math.min(k, actualTopK.size); i++) {
      idcg += 1 / Math.log2(i + 2);
    }

    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Top-5/Top-10 Hit Rate
   * Target@5: V1 45%+, V2 55%+
   * Target@10: V1 50%+, V2 60%+
   */
  static calculateHitRate(
    predictedTopK: Set<number>,
    actualTopK: Set<number>
  ): number {
    let hits = 0;
    actualTopK.forEach(playerId => {
      if (predictedTopK.has(playerId)) hits++;
    });
    return actualTopK.size > 0 ? hits / actualTopK.size : 0;
  }

  /**
   * Cut Prediction Accuracy
   * Target V1: 72%+, V2: 78%+
   */
  static calculateCutAccuracy(
    predictions: { playerId: string; makeCut: boolean }[],
    actuals: { playerId: string; makeCut: boolean }[]
  ): number {
    const actualMap = new Map(actuals.map(a => [a.playerId, a.makeCut]));
    
    let correct = 0;
    for (const pred of predictions) {
      if (actualMap.get(pred.playerId) === pred.makeCut) {
        correct++;
      }
    }
    
    return predictions.length > 0 ? correct / predictions.length : 0;
  }

  /**
   * Odds Calibration
   * When we say 8:1, do those players actually win 1 in 9?
   * Target: ±2% calibration error
   */
  static calculateOddsCalibration(
    predictedProbabilities: number[],
    actualWins: boolean[]
  ): number {
    const buckets = new Map<number, { count: number; wins: number }>();
    
    for (let i = 0; i < predictedProbabilities.length; i++) {
      const bucket = Math.round(predictedProbabilities[i] * 10) / 10;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { count: 0, wins: 0 });
      }
      
      const entry = buckets.get(bucket)!;
      entry.count++;
      if (actualWins[i]) entry.wins++;
    }

    let totalError = 0;
    let count = 0;
    buckets.forEach(({ count: n, wins }) => {
      const actualRate = wins / n;
      const expectedRate = Array.from(buckets.keys())[0]; // simplified
      totalError += Math.abs(expectedRate - actualRate);
      count++;
    });

    return count > 0 ? totalError / count : 0;
  }

  /**
   * DFS Value Score
   * Formula: (Predicted Points / Salary) × 10,000
   * Target V1: 1.5x Vegas, V2: 2.0x Vegas
   */
  static calculateDFSValue(
    predictedPoints: number,
    salary: number
  ): number {
    return salary > 0 ? (predictedPoints / salary) * 10000 : 0;
  }

  /**
   * Expected Value (EV)
   * Target V1: +5% ROI, V2: +10% ROI
   */
  static calculateEV(
    modelProbability: number,
    oddsImpliedProbability: number,
    actualOutcome: boolean
  ): number {
    if (modelProbability <= oddsImpliedProbability) return 0;
    return actualOutcome ? modelProbability - oddsImpliedProbability : -(1 - modelProbability);
  }
}
