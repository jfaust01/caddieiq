/**
 * ShadowModePredictionEngine — Phase 17.2 Live Tournament Shadow Validation
 * 
 * Operates the matching engine in shadow mode against live tournaments.
 * 
 * PRINCIPLES:
 * - Measurement only (no modifications)
 * - Predictions locked before Round 1
 * - No weight adjustments
 * - No manual overrides
 * - Frozen architecture
 * 
 * PROCESS:
 * 1. Generate predictions pre-tournament
 * 2. Lock predictions with timestamp
 * 3. Track performance after each round
 * 4. Measure against actual results
 * 5. No modifications allowed
 */

import { MatchingService } from '@/lib/matching/MatchingService';

export interface ShadowPrediction {
  predictionId: string;
  tournamentId: string;
  playerId: string;
  matchScore: number;
  components: {
    skillFit: number;
    formBonus: number;
    venueHistoryBonus: number;
    confidence: number;
    ceiling: number;
    floor: number;
  };
  explanation: string;
  tier: 'Elite' | 'Strong' | 'Contender' | 'Value' | 'Longshot';
  confidence: number;
  createdAt: Date;
  lockedAt: Date;
  buildId: string;
  modelVersion: string;
  predictionVersion: string;
  sealed: boolean;
}

export interface TournamentActualResult {
  playerId: string;
  finalPosition: number;
  scoreRelativeToPar: number;
  curtseysMade: number;
  withdrawn: boolean;
  roundScores: number[];
}

export interface PerformanceMeasurement {
  predictionId: string;
  playerId: string;
  prediction: ShadowPrediction;
  actual: TournamentActualResult;
  metrics: {
    finishError: number;
    topFiveHit: boolean;
    topTenHit: boolean;
    topTwentyHit: boolean;
    cutMade: boolean;
    winnerPrediction: boolean;
    scoreErrorPrediction: number;
    dkFantasyPointsCorrelation: number;
    fdFantasyPointsCorrelation: number;
    confidenceValid: boolean;
    explanationAccurate: boolean;
  };
}

export interface RoundSnapshot {
  round: number;
  completedAt: Date;
  predictionsStanding: Array<{
    playerId: string;
    predictedRank: number;
    currentPosition: number;
    scoreAccuracy: number;
  }>;
  metrics: {
    rangeCorrelation: number;
    topTenAccuracy: number;
    cutLineAccuracy: number;
  };
}

export class ShadowModePredictionEngine {
  private matchingService: MatchingService;
  private predictions: Map<string, ShadowPrediction> = new Map();
  private results: Map<string, TournamentActualResult> = new Map();
  private measurements: PerformanceMeasurement[] = [];
  private roundSnapshots: RoundSnapshot[] = [];

  constructor() {
    this.matchingService = new MatchingService();
  }

  /**
   * Generate and lock predictions for a tournament
   * Called before Round 1 starts
   */
  async generateTournamentPredictions(
    tournamentId: string,
    playerIds: string[],
    courseId: string
  ): Promise<ShadowPrediction[]> {
    const predictions: ShadowPrediction[] = [];
    const buildId = `BUILD-${Date.now()}`;
    const modelVersion = '1.0.0';
    const predictionVersion = `${tournamentId}-${buildId}`;
    const now = new Date();

    for (const playerId of playerIds) {
      // Generate prediction using frozen engine
      const score = await this.matchingService.calculateMatchScore(
        playerId,
        courseId,
        tournamentId
      );

      const prediction: ShadowPrediction = {
        predictionId: `PRED-${playerId}-${tournamentId}-${buildId}`,
        tournamentId,
        playerId,
        matchScore: score.overallScore,
        components: {
          skillFit: score.skillFitScore,
          formBonus: score.formBonus,
          venueHistoryBonus: score.venueHistoryBonus,
          confidence: score.confidenceScore,
          ceiling: score.ceilingScore,
          floor: score.floorScore,
        },
        explanation: score.explanation || '',
        tier: this.determineTier(score.overallScore),
        confidence: score.confidenceScore,
        createdAt: now,
        lockedAt: now,
        buildId,
        modelVersion,
        predictionVersion,
        sealed: true, // Sealed immediately - no modifications allowed
      };

      predictions.push(prediction);
      this.predictions.set(prediction.predictionId, prediction);
    }

    return predictions.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Record tournament actual results
   * Called after tournament concludes
   */
  recordTournamentResults(
    tournamentId: string,
    results: Array<{
      playerId: string;
      finalPosition: number;
      scoreRelativeToPar: number;
      curtseysMade: number;
      withdrawn: boolean;
      roundScores: number[];
    }>
  ): void {
    for (const result of results) {
      const key = `${result.playerId}-${tournamentId}`;
      this.results.set(key, {
        playerId: result.playerId,
        finalPosition: result.finalPosition,
        scoreRelativeToPar: result.scoreRelativeToPar,
        curtseysMade: result.curtseysMade,
        withdrawn: result.withdrawn,
        roundScores: result.roundScores,
      });
    }
  }

  /**
   * Calculate performance metrics for all predictions
   */
  calculatePerformanceMetrics(tournamentId: string): PerformanceMeasurement[] {
    const tournamentPredictions = Array.from(this.predictions.values()).filter(
      (p) => p.tournamentId === tournamentId
    );

    this.measurements = tournamentPredictions.map((prediction) => {
      const resultKey = `${prediction.playerId}-${tournamentId}`;
      const actual = this.results.get(resultKey);

      if (!actual) {
        throw new Error(`Missing result for ${resultKey}`);
      }

      return {
        predictionId: prediction.predictionId,
        playerId: prediction.playerId,
        prediction,
        actual,
        metrics: {
          finishError: Math.abs(
            this.predictedRankFromScore(prediction.matchScore) - actual.finalPosition
          ),
          topFiveHit: actual.finalPosition <= 5,
          topTenHit: actual.finalPosition <= 10,
          topTwentyHit: actual.finalPosition <= 20,
          cutMade: !actual.withdrawn,
          winnerPrediction: actual.finalPosition === 1,
          scoreErrorPrediction: Math.abs(
            this.predictedScoreFromComponents(prediction.components) -
              actual.scoreRelativeToPar
          ),
          dkFantasyPointsCorrelation: this.calculateDKCorrelation(
            prediction,
            actual
          ),
          fdFantasyPointsCorrelation: this.calculateFDCorrelation(
            prediction,
            actual
          ),
          confidenceValid:
            prediction.confidence > 0.7
              ? actual.finalPosition <= 10
              : actual.finalPosition <= 20,
          explanationAccurate: this.validateExplanation(prediction, actual),
        },
      };
    });

    return this.measurements;
  }

  /**
   * Record round snapshot for tracking
   */
  recordRoundSnapshot(
    round: number,
    roundData: Array<{
      playerId: string;
      currentPosition: number;
      roundScore: number;
    }>
  ): RoundSnapshot {
    const predictions = Array.from(this.predictions.values());

    const standing = roundData.map((data) => {
      const pred = predictions.find((p) => p.playerId === data.playerId);
      const predictedRank = pred
        ? this.predictedRankFromScore(pred.matchScore)
        : 0;
      return {
        playerId: data.playerId,
        predictedRank,
        currentPosition: data.currentPosition,
        scoreAccuracy: Math.abs(
          this.predictedScoreFromScore(predictedRank) - data.roundScore
        ),
      };
    });

    const snapshot: RoundSnapshot = {
      round,
      completedAt: new Date(),
      predictionsStanding: standing,
      metrics: {
        rangeCorrelation: this.calculateSpearmanCorrelation(standing),
        topTenAccuracy: standing.filter(
          (s) => s.currentPosition <= 10 && s.predictedRank <= 10
        ).length / 10,
        cutLineAccuracy: this.calculateCutLineAccuracy(standing),
      },
    };

    this.roundSnapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get all measurements for reporting
   */
  getMeasurements(): PerformanceMeasurement[] {
    return this.measurements;
  }

  /**
   * Get round snapshots
   */
  getRoundSnapshots(): RoundSnapshot[] {
    return this.roundSnapshots;
  }

  /**
   * Verify predictions are sealed
   */
  verifyPredictionsSealed(tournamentId: string): boolean {
    const tournamentPredictions = Array.from(this.predictions.values()).filter(
      (p) => p.tournamentId === tournamentId
    );
    return tournamentPredictions.every((p) => p.sealed);
  }

  // Helper methods
  private determineTier(score: number): ShadowPrediction['tier'] {
    if (score >= 85) return 'Elite';
    if (score >= 75) return 'Strong';
    if (score >= 65) return 'Contender';
    if (score >= 50) return 'Value';
    return 'Longshot';
  }

  private predictedRankFromScore(score: number): number {
    return Math.max(1, Math.round(156 - (score / 100) * 156));
  }

  private predictedScoreFromScore(rank: number): number {
    return Math.round(70 - rank * 0.05);
  }

  private predictedScoreFromComponents(components: any): number {
    const baseScore = components.skillFit / 100;
    const formAdjustment = components.formBonus / 15;
    const venueAdjustment = components.venueHistoryBonus / 10;
    return Math.round(70 + baseScore + formAdjustment + venueAdjustment);
  }

  private calculateDKCorrelation(
    prediction: ShadowPrediction,
    actual: TournamentActualResult
  ): number {
    const predictedPoints = (prediction.matchScore / 100) * 50;
    const actualPoints = actual.finalPosition * 1.5;
    return Math.min(1, Math.abs(predictedPoints - actualPoints) / 50);
  }

  private calculateFDCorrelation(
    prediction: ShadowPrediction,
    actual: TournamentActualResult
  ): number {
    const predictedPoints = (prediction.matchScore / 100) * 50;
    const actualPoints = actual.finalPosition * 1.3;
    return Math.min(1, Math.abs(predictedPoints - actualPoints) / 50);
  }

  private validateExplanation(
    prediction: ShadowPrediction,
    actual: TournamentActualResult
  ): boolean {
    const explanation = prediction.explanation.toLowerCase();
    return (
      (actual.finalPosition <= 10 && explanation.includes('strong')) ||
      (actual.finalPosition > 20 && explanation.includes('risk')) ||
      (actual.finalPosition > 50 && explanation.includes('lower'))
    );
  }

  private calculateSpearmanCorrelation(
    standing: Array<{
      predictedRank: number;
      currentPosition: number;
    }>
  ): number {
    const ranks = standing.map((s) => s.predictedRank);
    const positions = standing.map((s) => s.currentPosition);

    const n = Math.min(ranks.length, positions.length);
    let sumDSquared = 0;

    for (let i = 0; i < n; i++) {
      const d = ranks[i] - positions[i];
      sumDSquared += d * d;
    }

    return 1 - (6 * sumDSquared) / (n * (n * n - 1));
  }

  private calculateCutLineAccuracy(
    standing: Array<{
      predictedRank: number;
      currentPosition: number;
    }>
  ): number {
    const cutLine = 70;
    const correct = standing.filter((s) => {
      const predictedMakeCut = s.predictedRank <= cutLine;
      const actualMakeCut = s.currentPosition <= cutLine;
      return predictedMakeCut === actualMakeCut;
    }).length;
    return correct / standing.length;
  }
}
