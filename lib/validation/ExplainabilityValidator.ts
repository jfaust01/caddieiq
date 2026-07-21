/**
 * ExplainabilityValidator — Phase 17.2 Explanation Quality Validation
 * 
 * Validates all predictions' explanations against actual outcomes.
 * 
 * Checks:
 * 1. Truthfulness (did stated reasons match actual data?)
 * 2. Accuracy (did explanations predict outcomes correctly?)
 * 3. Completeness (did explanations omit important factors?)
 * 4. Usefulness (were explanations actionable?)
 * 5. Bias (were explanations misleading or biased?)
 */

export interface ExplanationValidation {
  predictionId: string;
  playerId: string;
  explanation: string;
  predicted: {
    score: number;
    tier: string;
    confidence: number;
  };
  actual: {
    finalPosition: number;
    scoreRelativePar: number;
    cutMade: boolean;
  };
  validation: {
    truthful: boolean;
    truthfulnessScore: number; // 0-100
    accurate: boolean;
    accuracyScore: number; // 0-100
    complete: boolean;
    completenessScore: number; // 0-100
    useful: boolean;
    usefulnessScore: number; // 0-100
    biased: boolean;
    biasScore: number; // 0-100 (lower is better)
    overallScore: number; // 0-100
  };
  issues: string[];
}

export class ExplainabilityValidator {
  /**
   * Validate explanation against actual outcome
   */
  validateExplanation(
    prediction: {
      predictionId: string;
      playerId: string;
      explanation: string;
      matchScore: number;
      tier: string;
      confidence: number;
      components: {
        skillFit: number;
        formBonus: number;
        venueHistoryBonus: number;
      };
    },
    actual: {
      finalPosition: number;
      scoreRelativePar: number;
      cutMade: boolean;
      roundScores: number[];
    }
  ): ExplanationValidation {
    const issues: string[] = [];

    // 1. Truthfulness check
    const truthfulnessScore = this.checkTruthfulness(
      prediction,
      issues
    );

    // 2. Accuracy check
    const accuracyScore = this.checkAccuracy(
      prediction,
      actual,
      issues
    );

    // 3. Completeness check
    const completenessScore = this.checkCompleteness(
      prediction,
      issues
    );

    // 4. Usefulness check
    const usefulnessScore = this.checkUsefulness(
      prediction,
      issues
    );

    // 5. Bias check
    const biasScore = this.checkBias(prediction, actual, issues);

    const overallScore =
      (truthfulnessScore +
        accuracyScore +
        completenessScore +
        usefulnessScore +
        (100 - biasScore)) /
      5;

    return {
      predictionId: prediction.predictionId,
      playerId: prediction.playerId,
      explanation: prediction.explanation,
      predicted: {
        score: prediction.matchScore,
        tier: prediction.tier,
        confidence: prediction.confidence,
      },
      actual,
      validation: {
        truthful: truthfulnessScore >= 80,
        truthfulnessScore,
        accurate: accuracyScore >= 70,
        accuracyScore,
        complete: completenessScore >= 75,
        completenessScore,
        useful: usefulnessScore >= 70,
        usefulnessScore,
        biased: biasScore > 30,
        biasScore,
        overallScore: Math.round(overallScore),
      },
      issues,
    };
  }

  /**
   * Validate batch of explanations
   */
  validateBatch(
    predictions: any[],
    actuals: any[]
  ): ExplanationValidation[] {
    return predictions.map((pred) => {
      const actual = actuals.find((a) => a.playerId === pred.playerId);
      if (!actual) throw new Error(`Missing actual result for ${pred.playerId}`);
      return this.validateExplanation(pred, actual);
    });
  }

  /**
   * Generate summary report
   */
  generateSummary(
    validations: ExplanationValidation[]
  ): {
    totalValidated: number;
    avgTruthfulness: number;
    avgAccuracy: number;
    avgCompleteness: number;
    avgUsefulness: number;
    avgBias: number;
    overallScore: number;
    issueCount: number;
    criticalIssueCount: number;
  } {
    const totalValidated = validations.length;

    if (totalValidated === 0) {
      return {
        totalValidated: 0,
        avgTruthfulness: 0,
        avgAccuracy: 0,
        avgCompleteness: 0,
        avgUsefulness: 0,
        avgBias: 0,
        overallScore: 0,
        issueCount: 0,
        criticalIssueCount: 0,
      };
    }

    const avgTruthfulness =
      validations.reduce((sum, v) => sum + v.validation.truthfulnessScore, 0) /
      totalValidated;
    const avgAccuracy =
      validations.reduce((sum, v) => sum + v.validation.accuracyScore, 0) /
      totalValidated;
    const avgCompleteness =
      validations.reduce((sum, v) => sum + v.validation.completenessScore, 0) /
      totalValidated;
    const avgUsefulness =
      validations.reduce((sum, v) => sum + v.validation.usefulnessScore, 0) /
      totalValidated;
    const avgBias =
      validations.reduce((sum, v) => sum + v.validation.biasScore, 0) /
      totalValidated;
    const overallScore =
      validations.reduce((sum, v) => sum + v.validation.overallScore, 0) /
      totalValidated;

    const issueCount = validations.reduce(
      (sum, v) => sum + v.issues.length,
      0
    );
    const criticalIssueCount = validations.filter((v) =>
      v.issues.some((i) => i.includes('CRITICAL'))
    ).length;

    return {
      totalValidated,
      avgTruthfulness: Math.round(avgTruthfulness),
      avgAccuracy: Math.round(avgAccuracy),
      avgCompleteness: Math.round(avgCompleteness),
      avgUsefulness: Math.round(avgUsefulness),
      avgBias: Math.round(avgBias),
      overallScore: Math.round(overallScore),
      issueCount,
      criticalIssueCount,
    };
  }

  // Private validation methods

  private checkTruthfulness(
    prediction: any,
    issues: string[]
  ): number {
    const explanation = prediction.explanation.toLowerCase();
    let score = 100;

    // Check if explanation matches components
    if (prediction.components.skillFit > 75) {
      if (!explanation.includes('strong') && !explanation.includes('elite')) {
        issues.push('TRUTHFULNESS: Explanation does not mention strong skill fit');
        score -= 20;
      }
    }

    if (prediction.components.formBonus > 5) {
      if (!explanation.includes('form') && !explanation.includes('recent')) {
        issues.push('TRUTHFULNESS: Explanation omits recent form bonus');
        score -= 15;
      }
    }

    if (prediction.components.venueHistoryBonus > 3) {
      if (!explanation.includes('venue') && !explanation.includes('history')) {
        issues.push('TRUTHFULNESS: Explanation omits venue history');
        score -= 10;
      }
    }

    return Math.max(0, score);
  }

  private checkAccuracy(
    prediction: any,
    actual: any,
    issues: string[]
  ): number {
    let score = 100;

    // If high confidence, check if result matches expectation
    if (prediction.confidence > 0.8) {
      if (actual.finalPosition > 20) {
        issues.push(
          `ACCURACY: High confidence prediction (${(prediction.confidence * 100).toFixed(0)}%) finished ${actual.finalPosition}th`
        );
        score -= 40;
      }
    }

    // If explanation said "strong contender", check if finished in top 15
    if (
      (prediction.explanation.includes('strong') ||
        prediction.explanation.includes('contender')) &&
      actual.finalPosition > 15
    ) {
      issues.push(`ACCURACY: Labeled contender finished ${actual.finalPosition}th`);
      score -= 25;
    }

    // If explanation said "value play", check if had decent result
    if (
      (prediction.explanation.includes('value') ||
        prediction.explanation.includes('upside')) &&
      actual.finalPosition < 20
    ) {
      score += 15; // Correct call
    }

    return Math.max(0, Math.min(100, score));
  }

  private checkCompleteness(
    prediction: any,
    issues: string[]
  ): number {
    const explanation = prediction.explanation;
    let score = 100;
    const sections = [
      { keyword: 'skill', penalty: 15 },
      { keyword: 'form', penalty: 10 },
      { keyword: 'history', penalty: 8 },
      { keyword: 'confidence', penalty: 10 },
      { keyword: 'risk', penalty: 12 },
    ];

    for (const section of sections) {
      if (!explanation.toLowerCase().includes(section.keyword)) {
        issues.push(`COMPLETENESS: Explanation missing ${section.keyword}`);
        score -= section.penalty;
      }
    }

    return Math.max(0, score);
  }

  private checkUsefulness(
    prediction: any,
    issues: string[]
  ): number {
    let score = 100;

    // Check if explanation is specific or generic
    if (prediction.explanation.length < 50) {
      issues.push('USEFULNESS: Explanation too brief to be useful');
      score -= 30;
    }

    // Check for actionable insights
    if (
      !prediction.explanation.includes('because') &&
      !prediction.explanation.includes('due to')
    ) {
      issues.push('USEFULNESS: Explanation lacks causal reasoning');
      score -= 20;
    }

    // Check for specificity
    if (
      !prediction.explanation.includes('skill') &&
      !prediction.explanation.includes('course') &&
      !prediction.explanation.includes('condition')
    ) {
      issues.push('USEFULNESS: Explanation too generic');
      score -= 25;
    }

    return Math.max(0, score);
  }

  private checkBias(
    prediction: any,
    actual: any,
    issues: string[]
  ): number {
    let score = 0; // Lower is better for bias

    // Check for recency bias
    if (prediction.components.formBonus > 8 && actual.finalPosition > 30) {
      issues.push('BIAS: Potential recency bias (over-weighted recent form)');
      score += 25;
    }

    // Check for home course bias
    if (
      prediction.components.venueHistoryBonus > 5 &&
      actual.finalPosition > 50
    ) {
      issues.push('BIAS: Potential venue history over-weighting');
      score += 20;
    }

    // Check for confidence bias
    if (
      prediction.confidence > 0.9 &&
      Math.abs(actual.finalPosition - 78) < 20
    ) {
      issues.push('BIAS: Over-confidence (predicted outlier finish with high confidence)');
      score += 35;
    }

    return score;
  }
}
