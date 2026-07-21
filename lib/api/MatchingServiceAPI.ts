/**
 * MatchingServiceAPI - REST API Layer
 * Phase 16B.5: Product Integration
 * 
 * Exposes matching engine via REST endpoints for product surfaces
 */

import { MatchingService } from '@/lib/matching/MatchingService'
import { MatchScoreRepository } from '@/lib/repositories/MatchScoreRepository'
import { PlayerFeatureExtractor } from '@/lib/features/extractors/PlayerFeatureExtractor'
import { CourseFeatureExtractor } from '@/lib/features/extractors/CourseFeatureExtractor'

export interface MatchScoreResponse {
  playerId: string
  courseId: string
  overallScore: number
  components: {
    skillFit: number
    formBonus: number
    venueHistoryBonus: number
    confidence: number
    ceiling: number
    floor: number
  }
  explanation: string
  confidence: {
    score: number
    multiplier: number
    dataQuality: string
  }
  cached: boolean
  calculatedAt: Date
}

export interface TournamentRankingResponse {
  tournamentId: string
  playerId: string
  rank: number
  matchScore: number
  predictedMakeCut: boolean
  makeCutProbability: number
}

export class MatchingServiceAPI {
  private matchingService: MatchingService
  private scoreRepository: MatchScoreRepository
  private playerExtractor: PlayerFeatureExtractor
  private courseExtractor: CourseFeatureExtractor

  constructor() {
    this.matchingService = new MatchingService()
    this.scoreRepository = new MatchScoreRepository()
    this.playerExtractor = new PlayerFeatureExtractor()
    this.courseExtractor = new CourseFeatureExtractor()
  }

  async getMatchScore(playerId: string, courseId: string, tournamentId?: string): Promise<MatchScoreResponse> {
    const result = await this.matchingService.calculateMatchScore(playerId, courseId, tournamentId)

    return {
      playerId,
      courseId,
      overallScore: result.overallScore,
      components: {
        skillFit: result.skillFitScore,
        formBonus: result.formBonus,
        venueHistoryBonus: result.venueHistoryBonus,
        confidence: result.confidenceScore,
        ceiling: result.ceilingScore,
        floor: result.floorScore,
      },
      explanation: result.explanation || '',
      confidence: {
        score: result.confidenceScore,
        multiplier: result.confidenceMultiplier,
        dataQuality: this.getDataQualityLabel(result.confidenceScore),
      },
      cached: false,
      calculatedAt: new Date(),
    }
  }

  async getTournamentRanking(tournamentId: string, courseId: string): Promise<TournamentRankingResponse[]> {
    return []
  }

  async getPlayerInsights(playerId: string) {
    const features = await this.playerExtractor.extractPlayerFeatures(playerId)
    return {
      playerId,
      skillProfile: {
        drivingDistance: features.drivingDistance,
        drivingAccuracy: features.drivingAccuracy,
        approachPlay: features.approachPlay,
        shortGame: features.shortGame,
        putting: features.putting,
      },
      recentForm: features.recentForm,
      venueHistory: features.venueHistory,
      volatility: features.scoreVolatility,
    }
  }

  async getCourseInsights(courseId: string) {
    const features = await this.courseExtractor.extractCourseFeatures(courseId)
    return {
      courseId,
      courseProfile: {
        yardage: features.totalYardage,
        par: features.par,
        rating: features.courseRating,
        slope: features.slopeRating,
        difficulty: this.getDifficultyLabel(features.slopeRating),
      },
      setups: {
        greenSpeed: features.greenSpeed,
        greenFirmness: features.greenFirmness,
        roughHeight: features.roughHeight,
      },
    }
  }

  private getDataQualityLabel(confidence: number): string {
    if (confidence >= 90) return 'High'
    if (confidence >= 70) return 'Medium'
    if (confidence >= 50) return 'Low'
    return 'Very Low'
  }

  private getDifficultyLabel(slope: number): string {
    if (slope >= 150) return 'Extreme'
    if (slope >= 140) return 'Very Hard'
    if (slope >= 130) return 'Hard'
    if (slope >= 120) return 'Medium'
    return 'Easy'
  }
}
