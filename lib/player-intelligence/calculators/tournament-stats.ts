import { prisma } from '@/lib/prisma'
import type { CalculatedFeature, FeatureCalculator } from '../types'

abstract class TournamentStatCalculator implements FeatureCalculator {
  abstract readonly name: string
  abstract readonly category: string
  abstract calculate(playerId: string): Promise<CalculatedFeature | null>

  protected async getTournamentFields(playerId: string) {
    return await prisma.tournamentField.findMany({
      where: { playerId },
      include: {
        tournament: true,
      },
      orderBy: { tournament: { startDate: 'desc' } },
    })
  }
}

export class TournamentCountCalculator extends TournamentStatCalculator {
  readonly name = 'tournament_count'
  readonly category = 'tournament_stats'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    const count = await prisma.tournamentField.count({
      where: { playerId },
    })

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: count,
      featureValueStr: null,
      confidence: 100,
      source: 'sportsdataio',
      explanation: `Player has competed in ${count} tournaments`,
    }
  }
}

export class AverageFinishCalculator extends TournamentStatCalculator {
  readonly name = 'avg_finish'
  readonly category = 'tournament_stats'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    const fields = await this.getTournamentFields(playerId)

    if (fields.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: 'calculated',
        explanation: 'Insufficient data: player has no tournament history',
      }
    }

    const validPositions = fields
      .filter((f) => f.finalPosition && f.finalPosition > 0)
      .map((f) => f.finalPosition as number)

    if (validPositions.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 50,
        source: 'calculated',
        explanation: 'Limited data: player has competed but mostly missed cuts',
      }
    }

    const avgFinish = validPositions.reduce((a, b) => a + b, 0) / validPositions.length

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(avgFinish.toFixed(2)),
      featureValueStr: null,
      confidence: Math.min(100, Math.floor((validPositions.length / fields.length) * 100)),
      source: 'calculated',
      explanation: `Average finish of ${avgFinish.toFixed(1)} across ${validPositions.length} completed tournaments`,
    }
  }
}

export class CutPercentageCalculator extends TournamentStatCalculator {
  readonly name = 'cut_percentage'
  readonly category = 'tournament_stats'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    const fields = await this.getTournamentFields(playerId)

    if (fields.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: 'calculated',
        explanation: 'Insufficient data: player has no tournament history',
      }
    }

    const cutsMade = fields.filter((f) => f.madeCut === true).length
    const percentage = (cutsMade / fields.length) * 100

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(percentage.toFixed(2)),
      featureValueStr: `${percentage.toFixed(1)}%`,
      confidence: Math.min(100, Math.floor((fields.length / 20) * 100)),
      source: 'calculated',
      explanation: `Made cut ${cutsMade} out of ${fields.length} times (${percentage.toFixed(1)}%)`,
    }
  }
}

export class Top10PercentageCalculator extends TournamentStatCalculator {
  readonly name = 'top10_percentage'
  readonly category = 'tournament_stats'

  async calculate(playerId: string): Promise<CalculatedFeature | null> {
    const fields = await this.getTournamentFields(playerId)

    if (fields.length === 0) {
      return {
        featureName: this.name,
        featureCategory: this.category,
        featureValue: null,
        featureValueStr: null,
        confidence: 0,
        source: 'calculated',
        explanation: 'Insufficient data: player has no tournament history',
      }
    }

    const top10 = fields.filter((f) => f.finalPosition && f.finalPosition <= 10).length
    const percentage = (top10 / fields.length) * 100

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(percentage.toFixed(2)),
      featureValueStr: `${percentage.toFixed(1)}%`,
      confidence: Math.min(100, Math.floor((fields.length / 20) * 100)),
      source: 'calculated',
      explanation: `Finished top 10 in ${top10} out of ${fields.length} tournaments (${percentage.toFixed(1)}%)`,
    }
  }
}
