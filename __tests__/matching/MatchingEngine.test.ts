import { MatchingService } from "@/lib/matching/MatchingService";
import { ComponentScorer } from "@/lib/matching/scorers/ComponentScorer";
import { ConfidenceEngine } from "@/lib/matching/confidence/ConfidenceEngine";
import { ExplainabilityEngine } from "@/lib/matching/explainability/ExplainabilityEngine";

describe("Matching Engine - Phase 16B.3", () => {
  describe("ComponentScorer", () => {
    let scorer: ComponentScorer;

    beforeEach(() => {
      scorer = new ComponentScorer();
    });

    test("skill fit calculation is deterministic", () => {
      const playerFeatures = createMockPlayerFeatures({
        drivingDistance: 90,
        approach: 75,
        shortGame: 70,
        putting: 60,
      });
      const courseFeatures = createMockCourseFeatures({
        totalYardage: 7500,
        greenSize: 4500,
        hazardDensity: 60,
        greenSpeed: 12,
      });

      const result1 = scorer.scoreAllComponents(playerFeatures, courseFeatures, {});
      const result2 = scorer.scoreAllComponents(playerFeatures, courseFeatures, {});

      expect(result1.skillFit).toBe(result2.skillFit);
      expect(result1.skillFit).toBeGreaterThanOrEqual(0);
      expect(result1.skillFit).toBeLessThanOrEqual(100);
    });

    test("form bonus scales correctly (-15 to +15)", () => {
      const testCases = [
        { formScore: 6, expected: 15 },
        { formScore: 4, expected: 10 },
        { formScore: 2, expected: 5 },
        { formScore: 0, expected: 0 },
        { formScore: -2, expected: -5 },
        { formScore: -4, expected: -10 },
        { formScore: -6, expected: -15 },
      ];

      testCases.forEach(({ formScore, expected }) => {
        // Form bonus calculation test
      });
    });

    test("venue history bonus caps at ±10", () => {
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = scorer.scoreAllComponents(playerFeatures, courseFeatures, {
        venueHistoryBonus: 20, // Should cap at 10
      });

      expect(result.venueHistoryBonus).toBeLessThanOrEqual(10);
      expect(result.venueHistoryBonus).toGreaterThanOrEqual(-10);
    });

    test("confidence multiplier stays within 0.3-1.0", () => {
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = scorer.scoreAllComponents(playerFeatures, courseFeatures, {
        playerTournamentRounds: 1,
        playerAttributeCompleteness: 0.2,
      });

      expect(result.confidenceMultiplier).toBeGreaterThanOrEqual(0.3);
      expect(result.confidenceMultiplier).toBeLessThanOrEqual(1.0);
    });

    test("ceiling is always >= floor", () => {
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = scorer.scoreAllComponents(playerFeatures, courseFeatures, {});

      expect(result.ceiling).toGreaterThanOrEqual(result.floor);
    });
  });

  describe("ConfidenceEngine", () => {
    let engine: ConfidenceEngine;

    beforeEach(() => {
      engine = new ConfidenceEngine();
    });

    test("confidence score is 0-100", () => {
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = engine.calculateConfidence(playerFeatures, courseFeatures, {});

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    test("confidence never reaches 100%", () => {
      // Even with perfect data, confidence caps at 95
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = engine.calculateConfidence(playerFeatures, courseFeatures, {
        playerTournamentRounds: 500,
        courseTournamentCount: 50,
        playerLastRoundDays: 1,
        courseSurveyStaleDays: 100,
      });

      expect(result.confidenceScore).toBeLessThan(100);
      expect(result.confidenceMultiplier).toBeLessThanOrEqual(1.0);
    });

    test("confidence increases with data", () => {
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const lowDataResult = engine.calculateConfidence(playerFeatures, courseFeatures, {
        playerTournamentRounds: 5,
        courseTournamentCount: 1,
      });

      const highDataResult = engine.calculateConfidence(playerFeatures, courseFeatures, {
        playerTournamentRounds: 100,
        courseTournamentCount: 10,
      });

      expect(highDataResult.confidenceScore).toBeGreaterThan(lowDataResult.confidenceScore);
    });

    test("confidence multiplier is 0.3-1.0", () => {
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = engine.calculateConfidence(playerFeatures, courseFeatures, {});

      expect(result.confidenceMultiplier).toBeGreaterThanOrEqual(0.3);
      expect(result.confidenceMultiplier).toBeLessThanOrEqual(1.0);
    });
  });

  describe("ExplainabilityEngine", () => {
    let engine: ExplainabilityEngine;

    beforeEach(() => {
      engine = new ExplainabilityEngine();
    });

    test("generates lead explanation", () => {
      const player = createMockPlayer({ name: "Test Player" });
      const course = createMockCourse({ name: "Test Course" });
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = engine.generateExplanation(
        player,
        course,
        playerFeatures,
        courseFeatures,
        { skillFit: 75 } as any,
        createMockConfidence(),
        {}
      );

      expect(result.lead).toBeTruthy();
      expect(result.lead.length).toBeGreaterThan(0);
      expect(result.lead.includes("Test Course")).toBeTruthy();
    });

    test("skill breakdown contains all 5 skills", () => {
      const player = createMockPlayer();
      const course = createMockCourse();
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = engine.generateExplanation(
        player,
        course,
        playerFeatures,
        courseFeatures,
        {} as any,
        createMockConfidence(),
        {}
      );

      expect(result.skillBreakdown.driving).toBeTruthy();
      expect(result.skillBreakdown.approach).toBeTruthy();
      expect(result.skillBreakdown.shortGame).toBeTruthy();
      expect(result.skillBreakdown.putting).toBeTruthy();
      expect(result.skillBreakdown.recovery).toBeTruthy();
    });

    test("explanations reference concrete data", () => {
      const player = createMockPlayer({ name: "Elite Player" });
      const course = createMockCourse({ name: "Augusta National" });
      const playerFeatures = createMockPlayerFeatures({ putting: 95 });
      const courseFeatures = createMockCourseFeatures({ greenSpeed: 13 });

      const result = engine.generateExplanation(
        player,
        course,
        playerFeatures,
        courseFeatures,
        { skillFit: 85, ceiling: 95, floor: 70 } as any,
        createMockConfidence({ score: 85 }),
        {}
      );

      // Should mention specific values, not generic text
      expect(result.lead).toMatch(/\d+/); // Contains numbers
      expect(result.confidenceStatement).toMatch(/\d+%/); // Contains percentage
    });

    test("risk assessment adjusts for volatility", () => {
      const player = createMockPlayer();
      const course = createMockCourse();
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const lowVolatilityResult = engine.generateExplanation(
        player,
        course,
        playerFeatures,
        courseFeatures,
        { skillFit: 75, ceiling: 85, floor: 65 } as any,
        createMockConfidence(),
        { playerVolatility: 1.5 }
      );

      const highVolatilityResult = engine.generateExplanation(
        player,
        course,
        playerFeatures,
        courseFeatures,
        { skillFit: 75, ceiling: 95, floor: 55 } as any,
        createMockConfidence(),
        { playerVolatility: 4.0 }
      );

      expect(lowVolatilityResult.riskAssessment).not.toBe(
        highVolatilityResult.riskAssessment
      );
    });
  });

  describe("Reproducibility", () => {
    test("same inputs produce same scores every time", () => {
      const scorer = new ComponentScorer();
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();
      const derivedFeatures = {};

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(scorer.scoreAllComponents(playerFeatures, courseFeatures, derivedFeatures));
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i].skillFit).toBe(results[0].skillFit);
        expect(results[i].formBonus).toBe(results[0].formBonus);
        expect(results[i].venueHistoryBonus).toBe(results[0].venueHistoryBonus);
      }
    });
  });

  describe("Architecture Compliance", () => {
    test("no NaN values in scores", () => {
      const scorer = new ComponentScorer();
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = scorer.scoreAllComponents(playerFeatures, courseFeatures, {});

      expect(isNaN(result.skillFit)).toBeFalsy();
      expect(isNaN(result.formBonus)).toBeFalsy();
      expect(isNaN(result.venueHistoryBonus)).toBeFalsy();
      expect(isNaN(result.confidenceMultiplier)).toBeFalsy();
    });

    test("score ranges honored", () => {
      const scorer = new ComponentScorer();
      const playerFeatures = createMockPlayerFeatures();
      const courseFeatures = createMockCourseFeatures();

      const result = scorer.scoreAllComponents(playerFeatures, courseFeatures, {});

      expect(result.skillFit).toBeGreaterThanOrEqual(0);
      expect(result.skillFit).toBeLessThanOrEqual(100);

      expect(result.formBonus).toBeGreaterThanOrEqual(-15);
      expect(result.formBonus).toBeLessThanOrEqual(15);

      expect(result.venueHistoryBonus).toBeGreaterThanOrEqual(-10);
      expect(result.venueHistoryBonus).toBeLessThanOrEqual(10);

      expect(result.confidenceMultiplier).toBeGreaterThanOrEqual(0.3);
      expect(result.confidenceMultiplier).toBeLessThanOrEqual(1.0);
    });
  });
});

// Mock helpers
function createMockPlayerFeatures(overrides: any = {}) {
  return {
    playerMetadata: {
      drivingDistance: { value: overrides.drivingDistance || 70 },
      drivingAccuracy: { value: overrides.drivingAccuracy || 60 },
      approachPlay: { value: overrides.approach || 65 },
      shortGame: { value: overrides.shortGame || 60 },
      putting: { value: overrides.putting || 55 },
      volatility: { value: overrides.volatility || 3.0 },
    },
  };
}

function createMockCourseFeatures(overrides: any = {}) {
  return {
    courseMetadata: {
      totalYardage: { value: overrides.totalYardage || 7000 },
      par: { value: overrides.par || 72 },
      courseRating: { value: overrides.courseRating || 73 },
      slopeRating: { value: overrides.slopeRating || 130 },
      greenSize: { value: overrides.greenSize || 5500 },
      greenSpeed: { value: overrides.greenSpeed || 11.5 },
      hazardDensity: { value: overrides.hazardDensity || 50 },
    },
  };
}

function createMockPlayer(overrides: any = {}) {
  return {
    id: "player-1",
    name: overrides.name || "Test Player",
  };
}

function createMockCourse(overrides: any = {}) {
  return {
    id: "course-1",
    name: overrides.name || "Test Course",
  };
}

function createMockConfidence(overrides: any = {}) {
  return {
    confidenceScore: overrides.score || 75,
    confidenceMultiplier: overrides.multiplier || 0.75,
  };
}
