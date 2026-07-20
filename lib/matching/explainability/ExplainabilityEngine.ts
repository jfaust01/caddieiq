import { Player, Course } from "@prisma/client";
import { CompleteFeatureSet } from "@/lib/features/core/FeatureTypes";
import { ConfidenceResult } from "../confidence/ConfidenceEngine";

/**
 * ExplainabilityEngine: Generates plain-English explanations
 * 
 * Produces 6 explanation components:
 * 1. Lead explanation (1 sentence)
 * 2. Skill breakdown (per skill)
 * 3. Form & momentum
 * 4. Venue history
 * 5. Risk assessment
 * 6. Confidence statement
 * 
 * Reference: docs/MATCHING_ENGINE_COMPLETE_ARCHITECTURE.md (Step 6)
 */
export class ExplainabilityEngine {
  /**
   * Generate full explanation from all components
   */
  generateExplanation(
    player: Player,
    course: Course,
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet,
    componentScores: ComponentScores,
    confidence: ConfidenceResult,
    derivedFeatures: DerivedFeatures
  ): ExplanationResult {
    const skillFit = componentScores.skillFit;

    return {
      lead: this.generateLead(
        player.name,
        course.name,
        skillFit,
        playerFeatures,
        courseFeatures
      ),
      skillBreakdown: this.generateSkillBreakdown(
        playerFeatures,
        courseFeatures,
        derivedFeatures
      ),
      formMomentum: this.generateFormMomentum(
        player.name,
        derivedFeatures,
        componentScores.formBonus
      ),
      venueHistory: this.generateVenueHistory(
        player.name,
        course.name,
        componentScores.venueHistoryBonus,
        derivedFeatures
      ),
      riskAssessment: this.generateRiskAssessment(
        skillFit,
        derivedFeatures,
        componentScores
      ),
      confidenceStatement: this.generateConfidenceStatement(
        confidence,
        derivedFeatures
      ),
    };
  }

  /**
   * Component A: Lead Explanation (1 sentence)
   */
  private generateLead(
    playerName: string,
    courseName: string,
    skillFit: number,
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet
  ): string {
    // Determine fit quality
    let fitQuality = "";
    if (skillFit >= 80) fitQuality = "Excellent fit";
    else if (skillFit >= 65) fitQuality = "Good fit";
    else if (skillFit >= 50) fitQuality = "Moderate fit";
    else if (skillFit >= 35) fitQuality = "Poor fit";
    else fitQuality = "Terrible fit";

    // Find dominant skill for player
    const drivingDist = playerFeatures.playerMetadata.drivingDistance?.value || 0;
    const approach = playerFeatures.playerMetadata.approachPlay?.value || 0;
    const shortGame = playerFeatures.playerMetadata.shortGame?.value || 0;
    const putting = playerFeatures.playerMetadata.putting?.value || 0;

    const skills = [
      { name: "driving", value: drivingDist },
      { name: "approach play", value: approach },
      { name: "short game", value: shortGame },
      { name: "putting", value: putting },
    ];
    const dominantSkill = skills.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );

    // Find course emphasis
    const yardage = courseFeatures.courseMetadata.totalYardage?.value || 7000;
    const greenSpeed = courseFeatures.courseMetadata.greenSpeed?.value || 11.5;
    let courseEmphasis = "";
    if (yardage > 7300 && dominantSkill.name === "driving") {
      courseEmphasis = "distance emphasis";
    } else if (greenSpeed > 12 && dominantSkill.name === "putting") {
      courseEmphasis = "fast-green emphasis";
    } else {
      courseEmphasis = "specific demands";
    }

    if (dominantSkill.value >= 80) {
      return `${fitQuality}: ${playerName}'s elite ${dominantSkill.name} (${Math.round(dominantSkill.value)}th percentile) perfectly suits ${courseName}'s ${courseEmphasis}.`;
    } else if (dominantSkill.value <= 40 && skillFit < 40) {
      return `${fitQuality}: ${playerName}'s weaker ${dominantSkill.name} creates challenges on ${courseName}.`;
    } else {
      return `${fitQuality}: ${playerName} provides a balanced match on ${courseName}.`;
    }
  }

  /**
   * Component B: Skill Breakdown Explanations (per skill)
   */
  private generateSkillBreakdown(
    playerFeatures: CompleteFeatureSet,
    courseFeatures: CompleteFeatureSet,
    derivedFeatures: DerivedFeatures
  ): SkillBreakdown {
    const drivingDist = playerFeatures.playerMetadata.drivingDistance?.value || 50;
    const approach = playerFeatures.playerMetadata.approachPlay?.value || 50;
    const shortGame = playerFeatures.playerMetadata.shortGame?.value || 50;
    const putting = playerFeatures.playerMetadata.putting?.value || 50;

    const yardage = courseFeatures.courseMetadata.totalYardage?.value || 7000;
    const greenSize = courseFeatures.courseMetadata.greenSize?.value || 5500;
    const hazardDensity = courseFeatures.courseMetadata.hazardDensity?.value || 50;
    const greenSpeed = courseFeatures.courseMetadata.greenSpeed?.value || 11.5;

    return {
      driving: this.explainDriving(drivingDist, yardage),
      approach: this.explainApproach(approach, greenSize, courseFeatures.courseMetadata),
      shortGame: this.explainShortGame(shortGame, hazardDensity),
      putting: this.explainPutting(putting, greenSpeed),
      recovery: this.explainRecovery(shortGame, hazardDensity),
    };
  }

  private explainDriving(playerDriving: number, yardage: number): string {
    if (playerDriving > 80 && yardage > 7300) {
      return `Elite Driving (${Math.round(playerDriving)}th percentile): This ${yardage}+ yard course rewards distance, which is your strength.`;
    } else if (playerDriving < 40 && yardage > 7300) {
      return `Concern - Weak Driving (${Math.round(playerDriving)}th percentile): This long layout penalizes shorter hitters.`;
    } else {
      return `Driving is neutral: Your ${Math.round(playerDriving)}th percentile driving fits this ${yardage}-yard layout well.`;
    }
  }

  private explainApproach(
    playerApproach: number,
    greenSize: number,
    metadata: Record<string, any>
  ): string {
    if (playerApproach > 85 && greenSize < 4500) {
      return `Elite Approach Play (${Math.round(playerApproach)}th percentile): Small ${greenSize} sq ft greens reward your exceptional proximity control.`;
    } else if (playerApproach < 35 && greenSize < 4500) {
      return `Concern - Weak Approach: Demanding green complexity requires better approach skills than your ${Math.round(playerApproach)}th percentile.`;
    } else {
      return `Solid Approach (${Math.round(playerApproach)}th percentile): Approach demands are moderate for this layout.`;
    }
  }

  private explainShortGame(playerShortGame: number, hazardDensity: number): string {
    if (playerShortGame > 80 && hazardDensity > 70) {
      return `Elite Short Game (${Math.round(playerShortGame)}th percentile): High hazard density heavily rewards exceptional chipping and pitching.`;
    } else if (playerShortGame < 40 && hazardDensity > 70) {
      return `Concern - Weak Short Game: This hazard-heavy layout demands better recovery skills than your ${Math.round(playerShortGame)}th percentile.`;
    } else {
      return `Solid Short Game (${Math.round(playerShortGame)}th percentile): Recovery opportunities are available on this layout.`;
    }
  }

  private explainPutting(playerPutting: number, greenSpeed: number): string {
    if (playerPutting > 85 && greenSpeed > 12) {
      return `Elite Putting (${Math.round(playerPutting)}th percentile) on fast greens (Stimp ${greenSpeed.toFixed(1)}): You make long putts at above-average rates.`;
    } else if (playerPutting < 40 && greenSpeed > 12) {
      return `Concern - Weak Putting on Fast Greens: Stimp ${greenSpeed.toFixed(1)} greens heavily favor elite putters; you rank ${Math.round(playerPutting)}th percentile.`;
    } else {
      return `Putting Advantage Neutral: Your ${Math.round(playerPutting)}th percentile putting suits Stimp ${greenSpeed.toFixed(1)} greens.`;
    }
  }

  private explainRecovery(playerRecovery: number, hazardDensity: number): string {
    if (playerRecovery > 75 && hazardDensity > 60) {
      return `Strong Recovery Skills (${Math.round(playerRecovery)}th percentile): Abundant hazards require strong saves, which is your strength.`;
    } else {
      return `Recovery at baseline (${Math.round(playerRecovery)}th percentile): Standard rough and hazard management needed.`;
    }
  }

  /**
   * Component C: Form & Momentum (1 sentence)
   */
  private generateFormMomentum(
    playerName: string,
    derivedFeatures: DerivedFeatures,
    formBonus: number
  ): string {
    if (formBonus > 8) {
      return `${playerName} is in elite form: recent scoring average is exceptional (best in recent months).`;
    } else if (formBonus < -8) {
      return `Caution - Current form is poor: recent scoring is significantly worse than baseline.`;
    } else if (formBonus > 3) {
      return `${playerName} is playing above baseline form with recent tournament success.`;
    } else if (formBonus < -3) {
      return `${playerName} has been underperforming baseline recently.`;
    } else {
      return `${playerName} is playing at baseline form with average recent results.`;
    }
  }

  /**
   * Component D: Venue History (1 sentence)
   */
  private generateVenueHistory(
    playerName: string,
    courseName: string,
    venueBonus: number,
    derivedFeatures: DerivedFeatures
  ): string {
    const venueVisits = derivedFeatures.coursePlayerVisits || 0;

    if (venueVisits > 3 && venueBonus > 5) {
      return `${playerName} has dominated ${courseName}: multiple wins and strong finishes across ${venueVisits} visits.`;
    } else if (venueVisits > 3 && venueBonus < -5) {
      return `Concern - Poor venue record: ${playerName} averages below-par finishes at ${courseName} across ${venueVisits} visits.`;
    } else if (venueVisits === 0) {
      return `First visit: No historical data for ${courseName}.`;
    } else if (venueVisits > 0) {
      return `Limited history: ${venueVisits} visit(s) to ${courseName} with mixed results.`;
    } else {
      return `No prior experience at this venue.`;
    }
  }

  /**
   * Component E: Risk Assessment (1-2 sentences)
   */
  private generateRiskAssessment(
    skillFit: number,
    derivedFeatures: DerivedFeatures,
    componentScores: ComponentScores
  ): string {
    const volatility = derivedFeatures.playerVolatility || 5;
    const ceiling = componentScores.ceiling;
    const floor = componentScores.floor;

    if (volatility > 3 && skillFit < 50) {
      return `High-risk fit: Volatility (±${volatility.toFixed(1)} strokes) combined with poor skill match creates unpredictable results.`;
    } else if (volatility > 3 && skillFit > 65) {
      return `High-ceiling fit: Can score very well (ceiling: ${Math.round(ceiling)}) on the right day, but downside risk (floor: ${Math.round(floor)}).`;
    } else if (volatility < 2 && skillFit > 65) {
      return `Reliable fit: Consistently plays well in these conditions (±${volatility.toFixed(1)} range).`;
    } else {
      return `Moderate risk profile with typical volatility.`;
    }
  }

  /**
   * Component F: Confidence Statement (1 sentence)
   */
  private generateConfidenceStatement(
    confidence: ConfidenceResult,
    derivedFeatures: DerivedFeatures
  ): string {
    const score = confidence.confidenceScore;
    const playerRounds = derivedFeatures.playerTournamentRounds || 10;
    const courseEvents = derivedFeatures.courseTournamentCount || 1;

    if (score > 80) {
      return `High confidence (${Math.round(score)}%): Based on ${playerRounds}+ tournament rounds and ${courseEvents}+ tour events here.`;
    } else if (score < 50) {
      return `Lower confidence (${Math.round(score)}%): Limited playing history; use as directional estimate.`;
    } else {
      return `Moderate confidence (${Math.round(score)}%): Reasonable data but some uncertainty remains.`;
    }
  }
}

export interface ExplanationResult {
  lead: string;
  skillBreakdown: SkillBreakdown;
  formMomentum: string;
  venueHistory: string;
  riskAssessment: string;
  confidenceStatement: string;
}

interface SkillBreakdown {
  driving: string;
  approach: string;
  shortGame: string;
  putting: string;
  recovery: string;
}

interface ComponentScores {
  skillFit: number;
  formBonus: number;
  venueHistoryBonus: number;
  ceiling: number;
  floor: number;
}

interface DerivedFeatures {
  playerVolatility?: number;
  playerTournamentRounds?: number;
  courseTournamentCount?: number;
  coursePlayerVisits?: number;
}
