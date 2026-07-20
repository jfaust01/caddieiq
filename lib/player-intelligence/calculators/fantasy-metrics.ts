import { prisma } from '@/lib/prisma'
import type { CalculatedFeature, FeatureCalculator } from '../types'
import { FeatureSource, calculateDataRatioConfidence } from '../constants'

abstract class FantasyCalculator implements FeatureCalculator {
  abstract readonly name: string
  abstract readonly category: string
  abstract calculate(playerId: string): Promise<CalculatedFeature | null>
}

export class AverageDKPointsCalculator extends FantasyCalculator {
  readonly name = 'avg_dk_points'
  readonly category = 'fantasy_metrics'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    const projections = await prisma.fantasyProjection.findMany({
      where: { playerId },
      orderBy: { tournament: { startDate: 'desc' } },
      take: 50,
    })

    if (projections.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: FeatureSource.SPORTSDATAIO,
        explanation: 'Insufficient data: no fantasy projections available',
      }
    }

    const validPoints = projections
      .filter((p) => p.fantasyPoints != null)
      .map((p) => p.fantasyPoints as number)

    if (validPoints.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: FeatureSource.SPORTSDATAIO,
        explanation: 'Insufficient data: no fantasy points recorded',
      }
    }

    const avgPoints = validPoints.reduce((a, b) => a + b, 0) / validPoints.length
    // Confidence: ratio of valid points to projected tournaments (better data availability = higher confidence)
    const confidence = calculateDataRatioConfidence(validPoints.length, projections.length)

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(avgPoints.toFixed(2)),
      featureValueStr: null,
      confidence,
      source: FeatureSource.SPORTSDATAIO,
      explanation: `Average DK points: ${avgPoints.toFixed(2)} across ${validPoints.length} tournaments (${projections.length} total projections available)`,
    }
  }
}

export class AverageSalaryCalculator extends FantasyCalculator {
  readonly name = 'avg_salary'
  readonly category = 'fantasy_metrics'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    const salaries = await prisma.dfsSalary.findMany({
      where: { playerId },
      orderBy: { tournament: { startDate: 'desc' } },
      take: 50,
    })

    if (salaries.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: FeatureSource.SPORTSDATAIO,
        explanation: 'Insufficient data: no salary information available',
      }
    }

    const validSalaries = salaries
      .filter((s) => s.salary && s.salary > 0)
      .map((s) => s.salary as number)

    if (validSalaries.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: FeatureSource.SPORTSDATAIO,
        explanation: 'Insufficient data: no valid salary values found',
      }
    }

    const avgSalary = validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length
    const confidence = calculateDataRatioConfidence(validSalaries.length, salaries.length)

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: avgSalary,
      featureValueStr: `$${avgSalary.toLocaleString()}`,
      confidence,
      source: FeatureSource.SPORTSDATAIO,
      explanation: `Average DK salary: $${avgSalary.toLocaleString()} across ${validSalaries.length} tournaments (${salaries.length} total salary data points)`,
    }
  }
}

export class SalaryValueCalculator extends FantasyCalculator {
  readonly name = 'salary_value'
  readonly category = 'fantasy_metrics'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    // Salary value = avg points / (salary / 1000)
    // Higher is better (more points per $1000 salary)
    const avgPointsFeature = await new AverageDKPointsCalculator().calculate(playerId)
    const avgSalaryFeature = await new AverageSalaryCalculator().calculate(playerId)

    if (!avgPointsFeature?.featureValue || !avgSalaryFeature?.featureValue) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: FeatureSource.DERIVED,
        explanation: 'Cannot calculate salary value without avg points and avg salary',
      }
    }

    const salaryValue = avgPointsFeature.featureValue / (avgSalaryFeature.featureValue / 1000)
    // Confidence is minimum of source confidence
    const confidence = Math.min(avgPointsFeature.confidence, avgSalaryFeature.confidence)

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(salaryValue.toFixed(2)),
      featureValueStr: null,
      confidence,
      source: FeatureSource.DERIVED,
      explanation: `Salary value: ${salaryValue.toFixed(2)} points per $1000 salary (derived from avg DK points and salary)`,
    }
  }
}
