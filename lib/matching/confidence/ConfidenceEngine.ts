import { CompleteFeatureSet } from "@/lib/features/core/FeatureTypes";

/**
 * ConfidenceEngine: Calculates confidence orthogonal to accuracy
 * 
 * Core principle: Confidence measures DATA QUALITY, not prediction certainty
 * 
 * High fit score + Low confidence = Possible but needs more data
 * Low fit score + High confidence = Trustworthy (don't play them)
 * 
 * Reference: docs/CONFIDENCE_FRAMEWORK.md
 */
export class ConfidenceEngine {
  /**
   * Calculate confidence from data coverage and signal quality
   */
  calculateConfidence(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): ConfidenceResult {
    // Dimension A: Data Coverage Confidence
    const playerCoverage = this.calculatePlayerCoverage(playerFeatures, derivedFeatures);
    const courseCoverage = this.calculateCourseCoverage(courseFeatures, derivedFeatures);
    const coverageConfidence = (playerCoverage + courseCoverage) / 2;

    // Dimension B: Signal Quality Confidence
    const signalQuality = this.calculateSignalQuality(playerFeatures, courseFeatures);

    // Combined confidence score (0-1)
    // Cap at 0.95 (can never be 100% certain)
    const confidenceScore = Math.min(0.95, (coverageConfidence + signalQuality) / 2);

    // Confidence multiplier for final score adjustment (0.3-1.0)
    const confidenceMultiplier = 0.3 + confidenceScore * 0.7;

    return {
      confidenceScore: confidenceScore * 100, // Convert to 0-100
      confidenceMultiplier,
      components: {
        playerCoverage,
        courseCoverage,
        signalQuality,
      },
      rationale: this.generateConfidenceRationale(
        playerCoverage,
        courseCoverage,
        signalQuality
      ),
    };
  }

  /**
   * Dimension A.1: Player Coverage Confidence
   * Based on tournament rounds, attribute completeness, recent activity
   */
  private calculatePlayerCoverage(
    playerFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): number {
    const tournamentRounds = derivedFeatures.playerTournamentRounds || 10;

    // Tournament rounds factor (0-1)
    let roundsFactor = 0;
    if (tournamentRounds >= 100) roundsFactor = 1.0;
    else if (tournamentRounds >= 51) roundsFactor = 0.85;
    else if (tournamentRounds >= 21) roundsFactor = 0.65;
    else if (tournamentRounds >= 6) roundsFactor = 0.4;
    else roundsFactor = 0.2;

    // Attribute completeness (0-1)
    // Count attributes with data
    const requiredAttributes = [
      "drivingDistance",
      "drivingAccuracy",
      "approachPlay",
      "shortGame",
      "putting",
    ];
    const completeAttributes = requiredAttributes.filter(
      (attr) => playerFeatures.playerMetadata[attr]?.value !== undefined
    ).length;
    const attributesFactor = completeAttributes / requiredAttributes.length;

    // Recency factor (0-1)
    const lastRoundDays = derivedFeatures.playerLastRoundDays || 30;
    let recencyFactor = 0;
    if (lastRoundDays <= 14) recencyFactor = 1.0;
    else if (lastRoundDays <= 28) recencyFactor = 0.9;
    else if (lastRoundDays <= 90) recencyFactor = 0.7;
    else if (lastRoundDays <= 365) recencyFactor = 0.4;
    else recencyFactor = 0.1;

    // Combined player coverage
    const coverage =
      roundsFactor * 0.5 + attributesFactor * 0.3 + recencyFactor * 0.2;

    return Math.max(0, Math.min(1, coverage));
  }

  /**
   * Dimension A.2: Course Coverage Confidence
   * Based on tournament history, attribute availability, survey recency
   */
  private calculateCourseCoverage(
    courseFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): number {
    const tournamentHistory = derivedFeatures.courseTournamentCount || 1;

    // Tournament history factor (0-1)
    let historyFactor = 0;
    if (tournamentHistory >= 8) historyFactor = 0.95;
    else if (tournamentHistory >= 4) historyFactor = 0.75;
    else if (tournamentHistory >= 2) historyFactor = 0.5;
    else if (tournamentHistory >= 1) historyFactor = 0.3;
    else historyFactor = 0.1;

    // Attribute availability (0-1)
    // Design specs are always available, conditions may not be
    const designSpecsComplete =
      courseFeatures.courseMetadata.totalYardage?.value !== undefined
        ? 1.0
        : 0.5;
    const attributesFactor = (designSpecsComplete + 0.85) / 2; // Average with typical conditions

    // Survey recency factor (0-1)
    const surveyStaleDays = derivedFeatures.courseSurveyStaleDays || 730;
    let surveyFactor = 0;
    if (surveyStaleDays < 365) surveyFactor = 0.95;
    else if (surveyStaleDays < 730) surveyFactor = 0.8;
    else if (surveyStaleDays < 1095) surveyFactor = 0.65;
    else surveyFactor = 0.5;

    // Combined course coverage
    const coverage = historyFactor * 0.5 + attributesFactor * 0.3 + surveyFactor * 0.2;

    return Math.max(0, Math.min(1, coverage));
  }

  /**
   * Dimension B: Signal Quality Confidence
   * Based on measurement stability and reliability
   */
  private calculateSignalQuality(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet
  ): number {
    // Player signal reliability (0-1)
    const playerVolatility = playerFeatures.playerMetadata.volatility?.value || 5;
    let playerReliability = 0;
    if (playerVolatility < 1.5) playerReliability = 0.95;
    else if (playerVolatility < 2.5) playerReliability = 0.85;
    else if (playerVolatility < 3.5) playerReliability = 0.7;
    else if (playerVolatility < 5.0) playerReliability = 0.5;
    else playerReliability = 0.3;

    // Course signal reliability (0-1)
    // Established courses have more reliable signals
    const courseAge = (courseFeatures.courseMetadata.yearEstablished?.value || new Date().getFullYear() - 30);
    const courseYears = new Date().getFullYear() - courseAge;
    let courseReliability = 0;
    if (courseYears >= 50) courseReliability = 0.95;
    else if (courseYears >= 25) courseReliability = 0.85;
    else if (courseYears >= 10) courseReliability = 0.7;
    else if (courseYears >= 3) courseReliability = 0.5;
    else courseReliability = 0.3;

    // Combined signal quality
    const signalQuality = (playerReliability + courseReliability) / 2;

    return Math.max(0, Math.min(1, signalQuality));
  }

  private generateConfidenceRationale(
    playerCoverage: number,
    courseCoverage: number,
    signalQuality: number
  ): string {
    const factors = [];

    if (playerCoverage > 0.8) {
      factors.push("Strong player data");
    } else if (playerCoverage < 0.4) {
      factors.push("Limited player history");
    }

    if (courseCoverage > 0.8) {
      factors.push("Well-established course");
    } else if (courseCoverage < 0.4) {
      factors.push("Limited course data");
    }

    if (signalQuality > 0.8) {
      factors.push("Stable signals");
    } else if (signalQuality < 0.5) {
      factors.push("High volatility");
    }

    return factors.join(", ");
  }
}

export interface ConfidenceResult {
  confidenceScore: number; // 0-100
  confidenceMultiplier: number; // 0.3-1.0
  components: {
    playerCoverage: number;
    courseCoverage: number;
    signalQuality: number;
  };
  rationale: string;
}

interface DerivedFeatures {
  playerTournamentRounds?: number;
  playerLastRoundDays?: number;
  courseTournamentCount?: number;
  courseSurveyStaleDays?: number;
}
