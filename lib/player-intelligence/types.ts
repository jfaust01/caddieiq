/// Player Intelligence Feature Types and Interfaces

export interface CalculatedFeature {
  featureName: string
  featureCategory: string
  featureValue: number | null
  featureValueStr: string | null
  confidence: number
  source: 'sportsdataio' | 'calculated' | 'projected'
  explanation?: string
}

export interface FeatureCalculator {
  readonly name: string
  readonly category: string
  calculate(playerId: string): Promise<CalculatedFeature | null>
}

export interface PlayerIntelligenceInput {
  playerId: string
  dataCompleteness: number
  features: CalculatedFeature[]
}

export type FeatureCategory = 
  | 'tournament_stats'
  | 'fantasy_metrics'
  | 'sg_metrics'
  | 'calculated'
  | 'form_metrics'
