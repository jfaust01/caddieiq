import { CompleteFeatureSet } from "@/lib/features/core/FeatureTypes";

/**
 * ComponentScorer: Calculates all 5 match score components
 * 
 * Frozen specification from Phase 16A:
 * - Skill Fit (0-100): player skill vs course demand
 * - Form Bonus (-15 to +15): recent trajectory
 * - Venue History (-10 to +10): historical performance
 * - Confidence (0.3-1.0): data quality multiplier
 * - Volatility (ceiling/floor): uncertainty bounds
 *
 * Reference: docs/MATCH_SCORE_ARCHITECTURE.md
 */
export class ComponentScorer {
  /**
   * Score all 5 components from features
   * Exact implementation per frozen specification
   */
  scoreAllComponents(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): ComponentScores {
    return {
      skillFit: this.scoreSkillFit(playerFeatures, courseFeatures),
      formBonus: this.scoreFormBonus(derivedFeatures),
      venueHistoryBonus: this.scoreVenueHistory(derivedFeatures),
      confidenceMultiplier: this.calculateConfidenceMultiplier(derivedFeatures),
      ceiling: this.calculateCeiling(playerFeatures, courseFeatures, derivedFeatures),
      floor: this.calculateFloor(playerFeatures, courseFeatures, derivedFeatures),
    };
  }

  /**
   * Component A: Skill Fit (0-100)
   * Formula: Σ (player_skill[i] * course_demand_weight[i]) / Σ (course_demand_weight[i])
   */
  private scoreSkillFit(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet
  ): number {
    // Extract player skills (percentiles 0-100)
    const playerSkills = {
      driving: playerFeatures.playerMetadata.drivingDistance?.value || 50,
      approach: playerFeatures.playerMetadata.approachPlay?.value || 50,
      shortGame: playerFeatures.playerMetadata.shortGame?.value || 50,
      putting: playerFeatures.playerMetadata.putting?.value || 50,
      scoring: playerFeatures.playerMetadata.recovery?.value || 50,
    };

    // Calculate course demand weights based on course characteristics
    const courseCharacteristics = courseFeatures.courseMetadata;
    const yardage = courseCharacteristics.totalYardage?.value || 7000;
    const greenSpeed = courseCharacteristics.greenSpeed?.value || 11.5;
    const hazardDensity = courseCharacteristics.hazardDensity?.value || 50;

    // Demand weights: longer course emphasizes driving, fast greens emphasize putting
    const demandWeights = {
      driving: this.calculateDrivingWeight(yardage),
      approach: this.calculateApproachWeight(courseCharacteristics),
      shortGame: this.calculateShortGameWeight(hazardDensity),
      putting: this.calculatePuttingWeight(greenSpeed),
      scoring: 10, // Fixed 10% weight for overall difficulty
    };

    // Normalize weights to sum to 100
    const totalWeight = Object.values(demandWeights).reduce((a, b) => a + b, 0);
    const normalizedWeights = {
      driving: (demandWeights.driving / totalWeight) * 100,
      approach: (demandWeights.approach / totalWeight) * 100,
      shortGame: (demandWeights.shortGame / totalWeight) * 100,
      putting: (demandWeights.putting / totalWeight) * 100,
      scoring: (demandWeights.scoring / totalWeight) * 100,
    };

    // Calculate weighted average
    const skillFit =
      (playerSkills.driving * normalizedWeights.driving +
        playerSkills.approach * normalizedWeights.approach +
        playerSkills.shortGame * normalizedWeights.shortGame +
        playerSkills.putting * normalizedWeights.putting +
        playerSkills.scoring * normalizedWeights.scoring) /
      100;

    return Math.max(0, Math.min(100, skillFit));
  }

  /**
   * Component B: Form Bonus (-15 to +15)
   * Recent trajectory vs career baseline, scaled to ±15
   */
  private scoreFormBonus(derivedFeatures: DerivedFeatures): number {
    const formScore = derivedFeatures.formBonus || 0;

    // Scale from raw strokes to ±15 range
    if (formScore >= 5) return 15; // Elite form
    if (formScore >= 3) return 10; // Strong form
    if (formScore >= 1) return 5; // Good form
    if (formScore > -1) return 0; // Neutral
    if (formScore > -3) return -5; // Below average
    if (formScore > -5) return -10; // Poor form
    return -15; // Cold form
  }

  /**
   * Component C: Venue History (-10 to +10)
   * Historical avg at venue vs career baseline, scaled to ±10
   */
  private scoreVenueHistory(derivedFeatures: DerivedFeatures): number {
    const venueBonus = derivedFeatures.venueHistoryBonus || 0;
    // Cap at ±10
    return Math.max(-10, Math.min(10, venueBonus));
  }

  /**
   * Confidence Multiplier (0.3 to 1.0)
   * Derived from data quality, not accuracy
   */
  private calculateConfidenceMultiplier(derivedFeatures: DerivedFeatures): number {
    const tournamentRounds = derivedFeatures.playerTournamentRounds || 10;
    const attributeCompleteness = derivedFeatures.playerAttributeCompleteness || 0.5;

    // Scale tournaments played to confidence multiplier
    let multiplier = 0.3; // Floor

    if (tournamentRounds >= 100) multiplier = 1.0;
    else if (tournamentRounds >= 51) multiplier = 0.85;
    else if (tournamentRounds >= 21) multiplier = 0.65;
    else if (tournamentRounds >= 6) multiplier = 0.4;

    // Reduce if attributes incomplete
    multiplier *= attributeCompleteness;

    return Math.max(0.3, Math.min(1.0, multiplier));
  }

  /**
   * Ceiling Score: optimistic scenario (best-case performance)
   */
  private calculateCeiling(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): number {
    const skillFit = this.scoreSkillFit(playerFeatures, courseFeatures);
    const formBonus = this.scoreFormBonus(derivedFeatures);
    const venueBonus = this.scoreVenueHistory(derivedFeatures);

    // Best case: everything goes right
    let ceiling = skillFit + formBonus + venueBonus + 10; // +10 for optimism

    return Math.max(0, Math.min(100, ceiling));
  }

  /**
   * Floor Score: pessimistic scenario (worst-case performance)
   */
  private calculateFloor(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): number {
    const skillFit = this.scoreSkillFit(playerFeatures, courseFeatures);
    const formBonus = this.scoreFormBonus(derivedFeatures);
    const venueBonus = this.scoreVenueHistory(derivedFeatures);

    // Worst case: everything goes wrong
    let floor = skillFit + formBonus + venueBonus - 10; // -10 for pessimism

    return Math.max(0, Math.min(100, floor));
  }

  // Weight calculation helpers
  private calculateDrivingWeight(yardage: number): number {
    // Longer courses emphasize driving more
    if (yardage >= 7500) return 40;
    if (yardage >= 7200) return 35;
    if (yardage >= 6900) return 30;
    return 20;
  }

  private calculateApproachWeight(courseMetadata: Record<string, any>): number {
    const greenSize = courseMetadata.greenSize?.value || 5500;
    const complexity = courseMetadata.greenComplexity?.value || 3;

    // Smaller, more complex greens require better approach play
    if (greenSize < 4500 && complexity > 3) return 35;
    if (greenSize < 5000) return 28;
    return 20;
  }

  private calculateShortGameWeight(hazardDensity: number): number {
    // More hazards = more short game demands
    if (hazardDensity > 75) return 25;
    if (hazardDensity > 50) return 18;
    return 12;
  }

  private calculatePuttingWeight(greenSpeed: number): number {
    // Faster greens = more putting demands
    if (greenSpeed > 12) return 20;
    if (greenSpeed > 11) return 15;
    return 12;
  }
}

interface ComponentScores {
  skillFit: number;
  formBonus: number;
  venueHistoryBonus: number;
  confidenceMultiplier: number;
  ceiling: number;
  floor: number;
}

interface DerivedFeatures {
  formBonus?: number;
  venueHistoryBonus?: number;
  playerTournamentRounds?: number;
  playerAttributeCompleteness?: number;
}
