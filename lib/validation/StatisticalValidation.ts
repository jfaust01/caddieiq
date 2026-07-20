/**
 * StatisticalValidation — Statistical Significance Testing
 * 
 * Determines whether Version 1 performance differences are statistically significant.
 * Uses appropriate statistical tests with confidence intervals.
 */

export interface SignificanceTest {
  metric: string;
  v1Value: number;
  baselineValue: number;
  difference: number;
  percentageDifference: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
  confidenceInterval: { lower: number; upper: number };
}

export interface StatisticalSummary {
  significantImprovements: SignificanceTest[];
  insignificantDifferences: SignificanceTest[];
  overallConclusion: string;
}

export class StatisticalValidation {
  /**
   * T-test for comparing means
   * Assumes independent samples
   */
  static tTest(
    group1: number[],
    group2: number[],
    metric: string,
    baselineName: string
  ): SignificanceTest {
    const mean1 = this.mean(group1);
    const mean2 = this.mean(group2);
    const difference = mean1 - mean2;
    const percentageDifference = (difference / mean2) * 100;

    const n1 = group1.length;
    const n2 = group2.length;
    const var1 = this.variance(group1);
    const var2 = this.variance(group2);

    // Pooled standard error
    const se = Math.sqrt(var1 / n1 + var2 / n2);
    const tStatistic = se > 0 ? difference / se : 0;

    // Degrees of freedom (Welch's approximation)
    const df = Math.pow(var1 / n1 + var2 / n2, 2) / 
               (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

    // P-value (two-tailed)
    const pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), df));

    // 95% confidence interval
    const criticalValue = this.tCritical(df, 0.05);
    const marginOfError = criticalValue * se;

    return {
      metric,
      v1Value: mean1,
      baselineValue: mean2,
      difference,
      percentageDifference,
      tStatistic,
      pValue,
      significant: pValue < 0.05,
      confidenceInterval: {
        lower: difference - marginOfError,
        upper: difference + marginOfError,
      },
    };
  }

  /**
   * Chi-square test for categorical data
   * (e.g., winner prediction accuracy)
   */
  static chiSquareTest(
    observed: number[],
    expected: number[]
  ): { chiSquare: number; pValue: number; significant: boolean } {
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] > 0) {
        chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
      }
    }

    const df = observed.length - 1;
    const pValue = 1 - this.chiSquareCDF(chiSquare, df);

    return {
      chiSquare,
      pValue,
      significant: pValue < 0.05,
    };
  }

  /**
   * Bootstrap confidence interval
   * Non-parametric method for robust estimates
   */
  static bootstrapCI(
    data: number[],
    iterations: number = 10000,
    alpha: number = 0.05
  ): { mean: number; lower: number; upper: number } {
    const n = data.length;
    const means: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const sample: number[] = [];
      for (let j = 0; j < n; j++) {
        sample.push(data[Math.floor(Math.random() * n)]);
      }
      means.push(this.mean(sample));
    }

    means.sort((a, b) => a - b);
    const lowerIdx = Math.floor((alpha / 2) * iterations);
    const upperIdx = Math.ceil((1 - alpha / 2) * iterations);

    return {
      mean: this.mean(data),
      lower: means[lowerIdx],
      upper: means[upperIdx],
    };
  }

  /**
   * Effect size (Cohen's d)
   * Measure practical significance
   */
  static cohensD(group1: number[], group2: number[]): number {
    const mean1 = this.mean(group1);
    const mean2 = this.mean(group2);
    const var1 = this.variance(group1);
    const var2 = this.variance(group2);
    const n1 = group1.length;
    const n2 = group2.length;

    // Pooled standard deviation
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const pooledSd = Math.sqrt(pooledVar);

    return (mean1 - mean2) / pooledSd;
  }

  /**
   * Correlation significance test
   * Test if correlation is significantly different from 0
   */
  static correlationSignificance(
    correlation: number,
    n: number
  ): {
    tStatistic: number;
    pValue: number;
    significant: boolean;
  } {
    const tStatistic = correlation * Math.sqrt(n - 2) / 
                       Math.sqrt(1 - correlation * correlation);
    const pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), n - 2));

    return {
      tStatistic,
      pValue,
      significant: pValue < 0.05,
    };
  }

  /**
   * Multiple comparison correction (Bonferroni)
   * Adjusts p-value for multiple tests
   */
  static bonferroniCorrection(pValue: number, numTests: number): number {
    return Math.min(1, pValue * numTests);
  }

  /**
   * Helper: Calculate mean
   */
  private static mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Helper: Calculate variance
   */
  private static variance(values: number[]): number {
    const m = this.mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - m, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  }

  /**
   * Helper: T-distribution CDF (simplified)
   */
  private static tCDF(t: number, df: number): number {
    // Approximation of t-distribution CDF
    const absT = Math.abs(t);
    if (df === Infinity) {
      return this.normalCDF(t);
    }
    // Simplified approximation
    return 0.5 + 0.5 * Math.sign(t) * Math.sqrt(1 - 1 / (1 + (absT * absT) / df));
  }

  /**
   * Helper: Normal distribution CDF
   */
  private static normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Helper: Error function
   */
  private static erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Helper: T critical value
   */
  private static tCritical(df: number, alpha: number): number {
    // Approximation for t critical value
    // For alpha=0.05 (two-tailed), critical value ≈ 1.96 for large df
    if (df >= 30) return 1.96;
    if (df === 1) return 12.706;
    if (df === 2) return 4.303;
    if (df === 3) return 3.182;
    if (df === 4) return 2.776;
    if (df === 5) return 2.571;
    if (df === 10) return 2.228;
    if (df === 20) return 2.086;
    return 2.086; // Default for higher df
  }

  /**
   * Helper: Chi-square CDF (simplified)
   */
  private static chiSquareCDF(x: number, df: number): number {
    // Simplified approximation
    if (x <= 0) return 0;
    if (df === 1) return 2 * this.normalCDF(Math.sqrt(x)) - 1;
    // For larger df, chi-square approaches normal
    const mean = df;
    const variance = 2 * df;
    return this.normalCDF((x - mean) / Math.sqrt(variance));
  }
}
