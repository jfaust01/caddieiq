/**
 * HistoricalReplayEngine — Phase 17.1 Historical Validation
 * 
 * Replays historical tournaments to measure Version 1 performance.
 * 
 * KEY PRINCIPLE: MEASUREMENT ONLY
 * - No modifications to engine
 * - No parameter tuning
 * - No architecture changes
 * - Frozen formulas only
 * 
 * Data Rules:
 * - No look-ahead bias (only pre-tournament data)
 * - No future information leakage
 * - Only information available before Round 1
 * - All predictions generated identically to live
 */

import { Tournament, Player, PlayerRound } from '@prisma/client';
import { MatchingService } from '@/lib/matching/MatchingService';

export interface HistoricalTournament {
  tournamentId: string;
  year: number;
  tournamentName: string;
  courseName: string;
  courseType: 'links' | 'parkland' | 'desert' | 'hybrid';
  fieldStrength: 'weak' | 'medium' | 'strong' | 'elite';
  weatherConditions: string;
  actualResults: {
    playerId: string;
    playerName: string;
    finish: number;
    score: number;
    madecut: boolean;
    earnings: number;
  }[];
}

export interface PredictionResult {
  tournamentId: string;
  playerId: string;
  predictedRank: number;
  predictedScore: number;
  predictedMakeCut: boolean;
  matchScore: number;
  confidence: number;
  explanation: string;
}

export interface ValidationMetrics {
  spearmanCorrelation: number;
  kendallTau: number;
  ndcg5: number;
  ndcg10: number;
  ndcg20: number;
  top5Accuracy: number;
  top10Accuracy: number;
  top20Accuracy: number;
  cutAccuracy: number;
  winnerAccuracy: boolean;
  topDKScorerAccuracy: boolean;
  avgFinishError: number;
  rmse: number;
  mae: number;
  confidenceCalibration: number;
}

export class HistoricalReplayEngine {
  private matchingService: MatchingService;

  constructor() {
    this.matchingService = new MatchingService();
  }

  /**
   * Replay a single historical tournament
   * 
   * Key: Use ONLY pre-tournament data
   * - Player stats up to tournament start
   * - Course history up to tournament start
   * - Recent form up to tournament start
   * - Do NOT use any data from the tournament itself
   */
  async replayTournament(
    tournament: HistoricalTournament
  ): Promise<{
    predictions: PredictionResult[];
    metrics: ValidationMetrics;
  }> {
    // Generate predictions for all players
    const predictions: PredictionResult[] = [];

    for (const actualResult of tournament.actualResults) {
      try {
        const matchScore = await this.matchingService.calculateMatchScore(
          actualResult.playerId,
          tournament.tournamentId
        );

        predictions.push({
          tournamentId: tournament.tournamentId,
          playerId: actualResult.playerId,
          predictedRank: 0, // Will be sorted
          predictedScore: matchScore.overallScore,
          predictedMakeCut: this.predictMakeCut(matchScore),
          matchScore: matchScore.overallScore,
          confidence: matchScore.confidenceScore,
          explanation: matchScore.explanation || '',
        });
      } catch (error) {
        console.error(
          `[v0-validation] Error predicting for player ${actualResult.playerId}:`,
          error
        );
      }
    }

    // Sort predictions by score (descending)
    predictions.sort((a, b) => b.predictedScore - a.predictedScore);
    predictions.forEach((p, i) => {
      p.predictedRank = i + 1;
    });

    // Calculate metrics
    const metrics = this.calculateMetrics(
      predictions,
      tournament.actualResults
    );

    return { predictions, metrics };
  }

  /**
   * Replay all historical tournaments (2021-2025)
   */
  async replayAllTournaments(
    tournaments: HistoricalTournament[]
  ): Promise<{
    results: Array<{
      tournament: HistoricalTournament;
      predictions: PredictionResult[];
      metrics: ValidationMetrics;
    }>;
    aggregateMetrics: ValidationMetrics;
  }> {
    const results = [];

    for (const tournament of tournaments) {
      const { predictions, metrics } = await this.replayTournament(
        tournament
      );
      results.push({ tournament, predictions, metrics });
    }

    // Calculate aggregate metrics
    const aggregateMetrics = this.aggregateMetrics(
      results.map(r => r.metrics)
    );

    return { results, aggregateMetrics };
  }

  /**
   * Calculate all validation metrics
   */
  private calculateMetrics(
    predictions: PredictionResult[],
    actualResults: HistoricalTournament['actualResults']
  ): ValidationMetrics {
    // Build actual ranks (sorted by finish position)
    const actualRanks = new Map<string, number>();
    const sortedByFinish = [...actualResults].sort(
      (a, b) => a.finish - b.finish
    );
    sortedByFinish.forEach((result, i) => {
      actualRanks.set(result.playerId, i + 1);
    });

    // Get predicted ranks
    const predictedRanks = new Map<string, number>();
    predictions.forEach(p => {
      predictedRanks.set(p.playerId, p.predictedRank);
    });

    return {
      spearmanCorrelation: this.calculateSpearman(
        actualRanks,
        predictedRanks
      ),
      kendallTau: this.calculateKendallTau(actualRanks, predictedRanks),
      ndcg5: this.calculateNDCG(
        predictions.slice(0, 5),
        actualResults.slice(0, 5),
        5
      ),
      ndcg10: this.calculateNDCG(
        predictions.slice(0, 10),
        actualResults.slice(0, 10),
        10
      ),
      ndcg20: this.calculateNDCG(
        predictions.slice(0, 20),
        actualResults.slice(0, 20),
        20
      ),
      top5Accuracy: this.calculateHitRate(
        new Set(predictions.slice(0, 5).map(p => p.playerId)),
        new Set(actualResults.slice(0, 5).map(r => r.playerId))
      ),
      top10Accuracy: this.calculateHitRate(
        new Set(predictions.slice(0, 10).map(p => p.playerId)),
        new Set(actualResults.slice(0, 10).map(r => r.playerId))
      ),
      top20Accuracy: this.calculateHitRate(
        new Set(predictions.slice(0, 20).map(p => p.playerId)),
        new Set(actualResults.slice(0, 20).map(r => r.playerId))
      ),
      cutAccuracy: this.calculateCutAccuracy(predictions, actualResults),
      winnerAccuracy:
        predictions[0]?.playerId === actualResults[0]?.playerId,
      topDKScorerAccuracy: false, // Would require DK scoring rules
      avgFinishError: this.calculateAvgFinishError(
        predictions,
        actualResults
      ),
      rmse: this.calculateRMSE(predictions, actualResults),
      mae: this.calculateMAE(predictions, actualResults),
      confidenceCalibration: this.calculateConfidenceCalibration(
        predictions,
        actualResults
      ),
    };
  }

  private calculateSpearman(
    actualRanks: Map<string, number>,
    predictedRanks: Map<string, number>
  ): number {
    const pairs = Array.from(actualRanks.entries()).map(([playerId, rank]) => ({
      actual: rank,
      predicted: predictedRanks.get(playerId) || 0,
    }));

    const n = pairs.length;
    const sumSquaredDiffs = pairs.reduce((sum, p) => {
      const diff = p.actual - p.predicted;
      return sum + diff * diff;
    }, 0);

    return 1 - (6 * sumSquaredDiffs) / (n * (n * n - 1));
  }

  private calculateKendallTau(
    actualRanks: Map<string, number>,
    predictedRanks: Map<string, number>
  ): number {
    const pairs = Array.from(actualRanks.entries()).map(([playerId, rank]) => ({
      actual: rank,
      predicted: predictedRanks.get(playerId) || 0,
    }));

    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const actualOrder = Math.sign(pairs[i].actual - pairs[j].actual);
        const predictedOrder = Math.sign(
          pairs[i].predicted - pairs[j].predicted
        );

        if (actualOrder === predictedOrder) {
          concordant++;
        } else {
          discordant++;
        }
      }
    }

    const n = (pairs.length * (pairs.length - 1)) / 2;
    return (concordant - discordant) / n;
  }

  private calculateNDCG(
    predictions: PredictionResult[],
    actual: HistoricalTournament['actualResults'],
    k: number
  ): number {
    const actualSet = new Set(actual.slice(0, k).map(r => r.playerId));

    let dcg = 0;
    predictions.slice(0, k).forEach((pred, i) => {
      const relevance = actualSet.has(pred.playerId) ? 1 : 0;
      dcg += relevance / Math.log2(i + 2);
    });

    let idcg = 0;
    for (let i = 0; i < Math.min(k, actualSet.size); i++) {
      idcg += 1 / Math.log2(i + 2);
    }

    return idcg > 0 ? dcg / idcg : 0;
  }

  private calculateHitRate(
    predicted: Set<string>,
    actual: Set<string>
  ): number {
    let hits = 0;
    actual.forEach(playerId => {
      if (predicted.has(playerId)) hits++;
    });
    return actual.size > 0 ? hits / actual.size : 0;
  }

  private calculateCutAccuracy(
    predictions: PredictionResult[],
    actual: HistoricalTournament['actualResults']
  ): number {
    const actualMap = new Map(
      actual.map(r => [r.playerId, r.madecut])
    );

    let correct = 0;
    predictions.forEach(pred => {
      if (actualMap.get(pred.playerId) === pred.predictedMakeCut) {
        correct++;
      }
    });

    return predictions.length > 0 ? correct / predictions.length : 0;
  }

  private calculateAvgFinishError(
    predictions: PredictionResult[],
    actual: HistoricalTournament['actualResults']
  ): number {
    const actualMap = new Map(
      actual.map((r, i) => [r.playerId, r.finish])
    );

    let totalError = 0;
    predictions.forEach((pred, i) => {
      const actualFinish = actualMap.get(pred.playerId) || 0;
      totalError += Math.abs(pred.predictedRank - actualFinish);
    });

    return predictions.length > 0 ? totalError / predictions.length : 0;
  }

  private calculateRMSE(
    predictions: PredictionResult[],
    actual: HistoricalTournament['actualResults']
  ): number {
    const actualMap = new Map(
      actual.map((r, i) => [r.playerId, r.finish])
    );

    let sumSquaredError = 0;
    predictions.forEach((pred, i) => {
      const actualFinish = actualMap.get(pred.playerId) || 0;
      sumSquaredError += Math.pow(pred.predictedRank - actualFinish, 2);
    });

    return Math.sqrt(sumSquaredError / predictions.length);
  }

  private calculateMAE(
    predictions: PredictionResult[],
    actual: HistoricalTournament['actualResults']
  ): number {
    const actualMap = new Map(
      actual.map((r, i) => [r.playerId, r.finish])
    );

    let totalError = 0;
    predictions.forEach((pred, i) => {
      const actualFinish = actualMap.get(pred.playerId) || 0;
      totalError += Math.abs(pred.predictedRank - actualFinish);
    });

    return predictions.length > 0 ? totalError / predictions.length : 0;
  }

  private calculateConfidenceCalibration(
    predictions: PredictionResult[],
    actual: HistoricalTournament['actualResults']
  ): number {
    // Group by confidence buckets
    const buckets = new Map<
      number,
      { predicted: number; actual: number }
    >();

    predictions.forEach(pred => {
      const bucket = Math.round(pred.confidence * 10) / 10;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { predicted: 0, actual: 0 });
      }

      const entry = buckets.get(bucket)!;
      entry.predicted += pred.confidence;
      entry.actual += 1;
    });

    // Calculate calibration error
    let totalError = 0;
    buckets.forEach(({ predicted, actual: count }) => {
      const calibrationError = Math.abs(predicted / count - predicted);
      totalError += calibrationError;
    });

    return Math.min(100, totalError);
  }

  private aggregateMetrics(allMetrics: ValidationMetrics[]): ValidationMetrics {
    const avg = (values: number[]) =>
      values.reduce((a, b) => a + b, 0) / values.length;

    return {
      spearmanCorrelation: avg(
        allMetrics.map(m => m.spearmanCorrelation)
      ),
      kendallTau: avg(allMetrics.map(m => m.kendallTau)),
      ndcg5: avg(allMetrics.map(m => m.ndcg5)),
      ndcg10: avg(allMetrics.map(m => m.ndcg10)),
      ndcg20: avg(allMetrics.map(m => m.ndcg20)),
      top5Accuracy: avg(allMetrics.map(m => m.top5Accuracy)),
      top10Accuracy: avg(allMetrics.map(m => m.top10Accuracy)),
      top20Accuracy: avg(allMetrics.map(m => m.top20Accuracy)),
      cutAccuracy: avg(allMetrics.map(m => m.cutAccuracy)),
      winnerAccuracy: allMetrics.some(m => m.winnerAccuracy),
      topDKScorerAccuracy: allMetrics.some(m => m.topDKScorerAccuracy),
      avgFinishError: avg(allMetrics.map(m => m.avgFinishError)),
      rmse: avg(allMetrics.map(m => m.rmse)),
      mae: avg(allMetrics.map(m => m.mae)),
      confidenceCalibration: avg(
        allMetrics.map(m => m.confidenceCalibration)
      ),
    };
  }

  private predictMakeCut(matchScore: any): boolean {
    // Use confidence-adjusted probability
    const baseProbability = 0.7;
    return baseProbability * matchScore.confidenceMultiplier > 0.5;
  }
}
