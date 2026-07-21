import { prisma } from '@/lib/prisma'
import type { CalculatedFeature, FeatureCalculator } from '../types'
import { FeatureSource, calculateTournamentConfidence } from '../constants'

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

    // Count is directly from database, so confidence is high if count > 0
    const confidence = count === 0 ? 0 : 95

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: count,
      featureValueStr: null,
      confidence,
      source: FeatureSource.SPORTSDATAIO,
      explanation: `Player has competed in ${count} tournaments (high confidence: direct data count)`,
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
        source: FeatureSource.DERIVED,
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
        confidence: 20,
        source: FeatureSource.DERIVED,
        explanation: `Limited data: player competed in ${fields.length} tournaments but mostly missed cuts`,
      }
    }

    // Confidence based on number of finishes: threshold is 13+ tournaments for HIGH
    const finishConfidence = calculateTournamentConfidence(validPositions.length)
    const avgFinish = validPositions.reduce((a, b) => a + b, 0) / validPositions.length

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(avgFinish.toFixed(2)),
      featureValueStr: null,
      confidence: finishConfidence,
      source: FeatureSource.DERIVED,
      explanation: `Average finish of ${avgFinish.toFixed(1)} across ${validPositions.length} completed tournaments (${fields.length} total attempts)`,
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
        source: FeatureSource.DERIVED,
        explanation: 'Insufficient data: player has no tournament history',
      }
    }

    const cutsMade = fields.filter((f) => f.madeCut === true).length
    const percentage = (cutsMade / fields.length) * 100
    const cutConfidence = calculateTournamentConfidence(fields.length)

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(percentage.toFixed(2)),
      featureValueStr: `${percentage.toFixed(1)}%`,
      confidence: cutConfidence,
      source: FeatureSource.DERIVED,
      explanation: `Made cut ${cutsMade} out of ${fields.length} times (${percentage.toFixed(1)}%) - confidence based on ${fields.length} tournament sample`,
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
        source: FeatureSource.DERIVED,
        explanation: 'Insufficient data: player has no tournament history',
      }
    }

    const top10 = fields.filter((f) => f.finalPosition && f.finalPosition <= 10).length
    const percentage = (top10 / fields.length) * 100
    const top10Confidence = calculateTournamentConfidence(fields.length)

    return {
      featureName: this.name,
      featureCategory: this.category,
      featureValue: parseFloat(percentage.toFixed(2)),
      featureValueStr: `${percentage.toFixed(1)}%`,
      confidence: top10Confidence,
      source: FeatureSource.DERIVED,
      explanation: `Finished Top 10 in ${top10} out of ${fields.length} tournaments (${percentage.toFixed(1)}%) - confidence based on ${fields.length} tournament sample`,
    }
  }
}
