/**
 * MatchingIntegrationService - Product Integration Layer
 * Phase 16B.5: Integrates matching engine into product surfaces
 * 
 * Coordinates:
 * - Tournament pages (ranking, predictions)
 * - Player pages (intelligence, form)
 * - Course pages (difficulty, setup impact)
 * - Monitoring and observability
 */

import { MatchingService } from '@/lib/matching/MatchingService';
import { MatchScoreRepository } from '@/lib/repositories/MatchScoreRepository';
import { Tournament, Player, Course } from '@prisma/client';

export interface TournamentMatchingContext {
  tournament: Tournament;
  course: Course;
  players: Player[];
  rankings: Array<{
    playerId: string;
    rank: number;
    matchScore: number;
    makeCutProbability: number;
  }>;
  metrics: {
    topPlayerScore: number;
    fieldStength: number;
    winnerProbability: number;
  };
}

export class MatchingIntegrationService {
  private matchingService: MatchingService;
  private scoreRepository: MatchScoreRepository;

  constructor() {
    this.matchingService = new MatchingService();
    this.scoreRepository = new MatchScoreRepository();
  }

  /**
   * Prepare tournament context with matching engine rankings
   */
  async prepareTournamentContext(
    tournament: Tournament,
    course: Course,
    players: Player[]
  ): Promise<TournamentMatchingContext> {
    const rankings = [];

    for (const player of players) {
      const score = await this.matchingService.calculateMatchScore(
        player.id,
        course.id,
        tournament.id
      );
      
      rankings.push({
        playerId: player.id,
        rank: rankings.length + 1,
        matchScore: score.overallScore,
        makeCutProbability: this.calculateMakeCutProbability(score),
      });
    }

    // Sort by score
    rankings.sort((a, b) => b.matchScore - a.matchScore);

    return {
      tournament,
      course,
      players,
      rankings,
      metrics: {
        topPlayerScore: rankings[0]?.matchScore || 0,
        fieldStength: this.calculateFieldStrength(rankings),
        winnerProbability: this.calculateWinnerProbability(rankings),
      },
    };
  }

  /**
   * Get player-specific matching insights
   */
  async getPlayerMatchingInsights(
    playerId: string,
    tournamentId?: string
  ) {
    return {
      playerId,
      recentMatches: [], // Would retrieve from repository
      courseHistory: [],
      formTrend: 'improving' | 'stable' | 'declining',
    };
  }

  private calculateMakeCutProbability(score: any): number {
    // Simplified: 70% baseline + confidence adjustment
    return 0.7 * score.confidenceMultiplier;
  }

  private calculateFieldStrength(rankings: any[]): number {
    const avgScore = rankings.reduce((sum, r) => sum + r.matchScore, 0) / rankings.length;
    return Math.min(100, (avgScore / 75) * 100);
  }

  private calculateWinnerProbability(rankings: any[]): number {
    // Simplified: top player probability
    if (rankings.length === 0) return 0;
    return Math.min(40, rankings[0].matchScore / 2.5);
  }
}
