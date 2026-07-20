/// Player Intelligence Feature Types and Interfaces
import { FeatureSource } from './constants'

export interface CalculatedFeature {
  featureName: string
  featureCategory: string
  featureValue: number | null
  featureValueStr: string | null
  confidence: number
  source: FeatureSource
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

export interface BuildResult {
  playerId: string
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED'
  featureCount: number
  completedFeatureCount: number
  dataCompleteness: number
  calculatedAt: Date
  warnings: string[]
  calculatorFailures: Array<{
    calculatorName: string
    error: string
  }>
}

export type BuildStatus = 'PENDING' | 'CALCULATING' | 'SUCCESS' | 'PARTIAL' | 'FAILED'
export type ActivationStatus = 'CANDIDATE' | 'ACTIVE' | 'SUPERSEDED' | 'REJECTED'

export interface PlayerIntelligenceBuildRecord {
  id: string
  playerId: string
  buildStatus: BuildStatus
  activationStatus: ActivationStatus
  dataCompleteness: number
  featureCount: number
  completedFeatureCount: number
  activationReason?: string
  rejectionReason?: string
  builderVersion: string
  featureSchemaVersion: string
  confidencePolicyVersion: string
  activationPolicyVersion: string
  calculatedAt: Date
  activatedAt?: Date
  createdAt: Date
  updatedAt: Date
}
