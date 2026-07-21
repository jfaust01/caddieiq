/**
 * BaselineComparisons — Compare Version 1 against multiple baselines
 * 
 * Baselines:
 * 1. OWGR (World Golf Ranking)
 * 2. DataGolf
 * 3. Vegas Odds
 * 4. DraftKings Salary
 * 5. FanDuel Salary
 * 6. Historical SG Model
 * 7. Random
 * 8. Average (previous tournament finish)
 */

import { HistoricalTournament } from './HistoricalReplayEngine';

export interface BaselineComparison {
  baseline: string;
  spearmanCorrelation: number;
  top5Accuracy: number;
  top10Accuracy: number;
  cutAccuracy: number;
  avgFinishError: number;
  mae: number;
  rmse: number;
}

export class BaselineComparisons {
  /**
   * BASELINE 1: OWGR (Official World Golf Ranking)
   * Current World Golf Ranking at tournament start
   */
  static generateOWGRRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // Would use actual OWGR data from tournament week
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 1 / (i + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 2: DataGolf Model
   * Industry-standard golf prediction model
   */
  static generateDataGolfRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // DataGolf uses: recent form, SG-by-category, course history, field strength
    // Would use actual DataGolf API data
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 0.65 + Math.random() * 0.2, // Placeholder
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 3: Vegas Odds
   * Sportsbook to-win odds (market consensus)
   */
  static generateVegasOddsRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // Vegas odds typically very accurate (0.30-0.35 Spearman)
    // Would pull from Vegas lines at tournament start
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 0.70 + Math.random() * 0.2, // Placeholder
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 4: DraftKings Salary-Based
   * Higher salary → Better player (correlation)
   */
  static generateDraftKingsSalaryRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // DK salary correlates with player strength
    // Would use actual DK salaries
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 0.60 + Math.random() * 0.25, // Placeholder
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 5: FanDuel Salary-Based
   * Similar to DK but different salary methodology
   */
  static generateFanDuelSalaryRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // FD salary correlates with player strength
    // Would use actual FD salaries
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 0.60 + Math.random() * 0.25, // Placeholder
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 6: Historical SG Model
   * Career Strokes Gained average
   */
  static generateHistoricalSGRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // Career SG is stable but doesn't account for form
    // Expected: 0.25-0.30 Spearman
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 0.50 + Math.random() * 0.25, // Placeholder
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 7: Random
   * Noise floor (no predictive value)
   */
  static generateRandomRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: Math.random(),
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * BASELINE 8: Previous Tournament Finish
   * Average of previous tournament finishes
   */
  static generatePreviousTournamentRanking(
    tournament: HistoricalTournament
  ): Array<{ playerId: string; rank: number; score: number }> {
    // Would use actual previous tournament results
    // Expected: 0.15-0.20 Spearman (momentum doesn't last)
    return tournament.actualResults
      .map((result, i) => ({
        playerId: result.playerId,
        rank: i + 1,
        score: 0.40 + Math.random() * 0.25, // Placeholder
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /**
   * Generate all baselines for comparison
   */
  static generateAllBaselines(
    tournament: HistoricalTournament
  ): Map<string, Array<{ playerId: string; rank: number; score: number }>> {
    return new Map([
      ['OWGR', this.generateOWGRRanking(tournament)],
      ['DataGolf', this.generateDataGolfRanking(tournament)],
      ['Vegas Odds', this.generateVegasOddsRanking(tournament)],
      ['DraftKings Salary', this.generateDraftKingsSalaryRanking(tournament)],
      ['FanDuel Salary', this.generateFanDuelSalaryRanking(tournament)],
      ['Historical SG', this.generateHistoricalSGRanking(tournament)],
      ['Random', this.generateRandomRanking(tournament)],
      ['Previous Tournament', this.generatePreviousTournamentRanking(tournament)],
    ]);
  }

  /**
   * Expected baseline performance (from literature/benchmarking)
   */
  static getExpectedBaslinePerformance(): Map<string, Partial<BaselineComparison>> {
    return new Map([
      [
        'OWGR',
        { spearmanCorrelation: 0.20, top5Accuracy: 0.25, top10Accuracy: 0.30 },
      ],
      [
        'DataGolf',
        { spearmanCorrelation: 0.32, top5Accuracy: 0.32, top10Accuracy: 0.38 },
      ],
      [
        'Vegas Odds',
        { spearmanCorrelation: 0.33, top5Accuracy: 0.35, top10Accuracy: 0.40 },
      ],
      [
        'DraftKings Salary',
        { spearmanCorrelation: 0.25, top5Accuracy: 0.28, top10Accuracy: 0.32 },
      ],
      [
        'FanDuel Salary',
        { spearmanCorrelation: 0.25, top5Accuracy: 0.28, top10Accuracy: 0.32 },
      ],
      [
        'Historical SG',
        { spearmanCorrelation: 0.28, top5Accuracy: 0.30, top10Accuracy: 0.35 },
      ],
      ['Random', { spearmanCorrelation: 0.0, top5Accuracy: 0.045, top10Accuracy: 0.09 }],
      [
        'Previous Tournament',
        { spearmanCorrelation: 0.18, top5Accuracy: 0.22, top10Accuracy: 0.28 },
      ],
    ]);
  }

  /**
   * V1 Performance vs Baselines
   * Must beat significant baselines to pass
   */
  static evaluateAgainstBaselines(
    v1Performance: Partial<BaselineComparison>,
    baselines: Map<string, Partial<BaselineComparison>>
  ): {
    betterThan: string[];
    worseThan: string[];
    verdict: 'STRONG_PASS' | 'PASS' | 'CONDITIONAL_PASS' | 'FAIL';
  } {
    const v1Spearman = v1Performance.spearmanCorrelation || 0;
    const v1Top5 = v1Performance.top5Accuracy || 0;

    const betterThan: string[] = [];
    const worseThan: string[] = [];

    baselines.forEach((baseline, name) => {
      if (
        (baseline.spearmanCorrelation || 0) < v1Spearman &&
        (baseline.top5Accuracy || 0) < v1Top5
      ) {
        betterThan.push(name);
      } else {
        worseThan.push(name);
      }
    });

    let verdict: 'STRONG_PASS' | 'PASS' | 'CONDITIONAL_PASS' | 'FAIL' =
      'FAIL';

    // Scoring criteria
    if (betterThan.includes('Vegas Odds') && betterThan.length >= 6) {
      verdict = 'STRONG_PASS';
    } else if (betterThan.length >= 5) {
      verdict = 'PASS';
    } else if (betterThan.length >= 3) {
      verdict = 'CONDITIONAL_PASS';
    }

    return { betterThan, worseThan, verdict };
  }
}
