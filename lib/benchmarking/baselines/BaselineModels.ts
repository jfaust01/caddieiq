/**
 * BaselineModels - 10 comparison models
 * CaddieIQ must exceed ALL baselines to claim improvement
 * Reference: docs/BASELINE_MODEL_SPECIFICATION.md
 */

export interface BaselineRanking {
  playerId: string;
  rank: number;
  score: number;
}

export class BaselineModels {
  /**
   * Baseline 1: Random
   * Expected: Spearman ~0.0, Hit@5 ~4.5%
   */
  static rankRandom(playerIds: string[]): BaselineRanking[] {
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    return shuffled.map((id, i) => ({
      playerId: id,
      rank: i + 1,
      score: Math.random(),
    }));
  }

  /**
   * Baseline 2: World Ranking Only
   * Expected: Spearman 0.20-0.25, Hit@5 25-30%
   */
  static rankWorldRanking(players: Array<{ id: string; worldRank: number }>): BaselineRanking[] {
    return [...players]
      .sort((a, b) => a.worldRank - b.worldRank)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: 1 / (p.worldRank + 1),
      }));
  }

  /**
   * Baseline 3: Recent Form Only
   * Expected: Spearman 0.22-0.28, Hit@5 28-32%
   * CaddieIQ target: Must beat 0.30 correlation
   */
  static rankRecentForm(players: Array<{ id: string; avgSG8Weeks: number }>): BaselineRanking[] {
    return [...players]
      .sort((a, b) => b.avgSG8Weeks - a.avgSG8Weeks)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: p.avgSG8Weeks,
      }));
  }

  /**
   * Baseline 4: Course History Only
   * Expected: Spearman 0.15-0.20, Hit@5 20-25%
   * Limitation: Only 30% of field has 2+ rounds at course
   */
  static rankCourseHistory(
    players: Array<{ id: string; venueAvgSG: number }>
  ): BaselineRanking[] {
    return [...players]
      .sort((a, b) => b.venueAvgSG - a.venueAvgSG)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: p.venueAvgSG,
      }));
  }

  /**
   * Baseline 5: Vegas Odds
   * Expected: Spearman 0.30-0.35, Hit@5 35-40%
   */
  static rankVegasOdds(players: Array<{ id: string; toWinOdds: number }>): BaselineRanking[] {
    return [...players]
      .sort((a, b) => a.toWinOdds - b.toWinOdds)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: 1 / (p.toWinOdds + 1),
      }));
  }

  /**
   * Baseline 6: Composite SG
   */
  static rankCompositeSG(players: Array<{ id: string; careerAvgSG: number }>): BaselineRanking[] {
    return [...players]
      .sort((a, b) => b.careerAvgSG - a.careerAvgSG)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: p.careerAvgSG,
      }));
  }

  /**
   * Baseline 7: FedEx Cup Points
   */
  static rankFedExCup(players: Array<{ id: string; fedexPoints: number }>): BaselineRanking[] {
    return [...players]
      .sort((a, b) => b.fedexPoints - a.fedexPoints)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: p.fedexPoints,
      }));
  }

  /**
   * Baseline 8: Course Scoring Average
   */
  static rankCourseScoringAvg(
    players: Array<{ id: string; scoreAvg: number }>
  ): BaselineRanking[] {
    return [...players]
      .sort((a, b) => a.scoreAvg - b.scoreAvg)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: p.scoreAvg,
      }));
  }

  /**
   * Baseline 9: Field Strength Adjusted
   */
  static rankFieldStrengthAdjusted(
    players: Array<{ id: string; adjSG: number }>
  ): BaselineRanking[] {
    return [...players]
      .sort((a, b) => b.adjSG - a.adjSG)
      .map((p, i) => ({
        playerId: p.id,
        rank: i + 1,
        score: p.adjSG,
      }));
  }

  /**
   * Baseline 10: Ensemble (average of all)
   */
  static rankEnsemble(allBaselines: BaselineRanking[][]): BaselineRanking[] {
    const scoreMap = new Map<string, number>();
    
    allBaselines.forEach(baseline => {
      baseline.forEach(({ playerId, rank }) => {
        scoreMap.set(playerId, (scoreMap.get(playerId) || 0) + rank);
      });
    });

    return Array.from(scoreMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map((entry, i) => ({
        playerId: entry[0],
        rank: i + 1,
        score: entry[1],
      }));
  }
}
