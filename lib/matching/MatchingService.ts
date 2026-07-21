import { Player, Course, Tournament } from "@prisma/client";
import { CompleteFeatureSet } from "@/lib/features/core/FeatureTypes";
import { PlayerFeatureExtractor } from "@/lib/features/extractors/PlayerFeatureExtractor";
import { CourseFeatureExtractor } from "@/lib/features/extractors/CourseFeatureExtractor";
import { DerivedFeatureCalculator } from "@/lib/features/calculators/DerivedFeatureCalculator";
import { ComponentScorer } from "./scorers/ComponentScorer";
import { ConfidenceEngine } from "./confidence/ConfidenceEngine";
import { ExplainabilityEngine } from "./explainability/ExplainabilityEngine";
import { prisma } from "@/lib/prisma";

/**
 * MatchingService: Core matching engine orchestrator
 * 
 * Implements frozen Phase 16A architecture:
 * - 5-component match scoring
 * - Confidence quantification (orthogonal to accuracy)
 * - Explainability generation
 * - Full reproducibility
 *
 * Reference: docs/MATCH_SCORE_ARCHITECTURE.md
 * Reference: docs/CONFIDENCE_FRAMEWORK.md
 */
export class MatchingService {
  private playerExtractor: PlayerFeatureExtractor;
  private courseExtractor: CourseFeatureExtractor;
  private derivedCalculator: DerivedFeatureCalculator;
  private componentScorer: ComponentScorer;
  private confidenceEngine: ConfidenceEngine;
  private explainabilityEngine: ExplainabilityEngine;

  constructor() {
    this.playerExtractor = new PlayerFeatureExtractor();
    this.courseExtractor = new CourseFeatureExtractor();
    this.derivedCalculator = new DerivedFeatureCalculator();
    this.componentScorer = new ComponentScorer();
    this.confidenceEngine = new ConfidenceEngine();
    this.explainabilityEngine = new ExplainabilityEngine();
  }

  /**
   * Calculate match score for player-course pair
   * Frozen specification: no modifications
   */
  async calculateMatchScore(
    playerId: string,
    courseId: string,
    tournamentId?: string
  ): Promise<MatchScoreResult> {
    // 1. Extract player features
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new Error(`Player not found: ${playerId}`);

    const playerFeatures = await this.playerExtractor.extractPlayerFeatures(player);

    // 2. Extract course features
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error(`Course not found: ${courseId}`);

    const courseFeatures = await this.courseExtractor.extractCourseFeatures(course);

    // 3. Verify feature completeness (both must have required features)
    this.validateFeatureCompleteness(playerFeatures, courseFeatures);

    // 4. Calculate derived features (form, venue history, volatility)
    const derivedFeatures = await this.derivedCalculator.calculateDerivedFeatures(
      playerId,
      courseId,
      tournamentId
    );

    // 5. Score each component
    const componentScores = this.componentScorer.scoreAllComponents(
      playerFeatures,
      courseFeatures,
      derivedFeatures
    );

    // 6. Calculate final fit score (0-100) from components
    const finalScore = this.calculateFinalScore(componentScores);

    // 7. Calculate confidence (0-100)
    const confidence = this.confidenceEngine.calculateConfidence(
      playerFeatures,
      courseFeatures,
      derivedFeatures
    );

    // 8. Generate explanation
    const explanation = this.explainabilityEngine.generateExplanation(
      player,
      course,
      playerFeatures,
      courseFeatures,
      componentScores,
      confidence,
      derivedFeatures
    );

    // 9. Store in database (with full reproducibility)
    const matchScore = await this.storeMatchScore(
      playerId,
      courseId,
      tournamentId,
      {
        overallScore: finalScore,
        skillFitScore: componentScores.skillFit,
        formBonus: componentScores.formBonus,
        venueHistoryBonus: componentScores.venueHistoryBonus,
        confidenceMultiplier: confidence.confidenceMultiplier,
        confidenceScore: confidence.confidenceScore,
        ceilingScore: componentScores.ceiling,
        floorScore: componentScores.floor,
        explanation: explanation.lead,
        explanationComponents: {
          lead: explanation.lead,
          skillBreakdown: explanation.skillBreakdown,
          formMomentum: explanation.formMomentum,
          venueHistory: explanation.venueHistory,
          riskAssessment: explanation.riskAssessment,
          confidenceStatement: explanation.confidenceStatement,
        },
      }
    );

    return {
      matchScore,
      componentScores,
      confidence,
      explanation,
    };
  }

  /**
   * Final score calculation: combines 5 components
   * Frozen formula from Phase 16A.2
   */
  private calculateFinalScore(components: ComponentScores): number {
    // Skill fit is base (0-100)
    let score = components.skillFit;

    // Form bonus: add directly (-15 to +15)
    score += components.formBonus;

    // Venue history bonus: add directly (-10 to +10)
    score += components.venueHistoryBonus;

    // Apply ceiling/floor as uncertainty bounds
    // If score is at upper bound, use ceiling; if lower, use floor
    if (score > 90) score = Math.min(score, components.ceiling);
    if (score < 30) score = Math.max(score, components.floor);

    // Cap to 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  private validateFeatureCompleteness(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet
  ): void {
    const requiredPlayerFeatures = [
      "drivingDistance",
      "drivingAccuracy",
      "approachPlay",
      "shortGame",
      "putting",
    ];

    const requiredCourseFeatures = [
      "totalYardage",
      "par",
      "courseRating",
      "slopeRating",
      "avgHoleLength",
    ];

    for (const feature of requiredPlayerFeatures) {
      if (playerFeatures.playerMetadata[feature]?.value === undefined) {
        throw new Error(`Missing required player feature: ${feature}`);
      }
    }

    for (const feature of requiredCourseFeatures) {
      if (courseFeatures.courseMetadata[feature]?.value === undefined) {
        throw new Error(`Missing required course feature: ${feature}`);
      }
    }
  }

  private async storeMatchScore(
    playerId: string,
    courseId: string,
    tournamentId: string | undefined,
    scoreData: MatchScoreData
  ) {
    // Get or create build
    const build = await prisma.matchScoreBuild.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!build) throw new Error("No active MatchScoreBuild found");

    return prisma.matchScore.create({
      data: {
        playerId,
        courseId,
        buildId: build.id,
        tournamentId,
        version: build.version.versionString,
        overallScore: scoreData.overallScore,
        skillFitScore: scoreData.skillFitScore,
        formBonus: scoreData.formBonus,
        venueHistoryBonus: scoreData.venueHistoryBonus,
        confidenceMultiplier: scoreData.confidenceMultiplier,
        confidenceScore: scoreData.confidenceScore,
        ceilingScore: scoreData.ceilingScore,
        floorScore: scoreData.floorScore,
        explanation: scoreData.explanation,
        explanationComponents: scoreData.explanationComponents,
      },
      include: {
        components: true,
        auditTrail: true,
      },
    });
  }
}

interface ComponentScores {
  skillFit: number; // 0-100
  formBonus: number; // -15 to +15
  venueHistoryBonus: number; // -10 to +10
  confidenceMultiplier: number; // 0.3-1.0
  ceiling: number; // 0-100 (optimistic)
  floor: number; // 0-100 (pessimistic)
}

interface MatchScoreData {
  overallScore: number;
  skillFitScore: number;
  formBonus: number;
  venueHistoryBonus: number;
  confidenceMultiplier: number;
  confidenceScore: number;
  ceilingScore: number;
  floorScore: number;
  explanation: string;
  explanationComponents: Record<string, unknown>;
}

export interface MatchScoreResult {
  matchScore: any; // MatchScore from Prisma
  componentScores: ComponentScores;
  confidence: ConfidenceResult;
  explanation: ExplanationResult;
}
