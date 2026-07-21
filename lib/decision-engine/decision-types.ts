/**
 * CADDIEIQ DECISION ENGINE
 * 
 * Transforms tournament intelligence into explainable player recommendations.
 * Every player gets a comprehensive Decision Profile with supporting evidence.
 * Consumed by all pages: Dashboard, Tournament Detail, Player Profile, Optimizer, etc.
 */

/**
 * Core Decision Profile for a single golfer
 * Contains all information needed to make DFS decisions about this player
 */
export interface PlayerDecisionProfile {
  // Identification
  playerId: string
  playerName: string
  rank: number // 1-150+ in field
  salary: number
  
  // Overall Rating
  overallRating: number // 0-100, primary recommendation score
  recommendationStrength: 'Elite Play' | 'Core Play' | 'Consider' | 'Leverage Play' | 'Fade' | 'Avoid'
  
  // Core Metrics (each 0-100)
  courseFit: number
  currentForm: number
  statisticalMatch: number
  salaryValue: number
  ownershipLeverage: number
  weatherImpact: number
  vegasConfidence: number
  historicalSuccess: number
  
  // Volatility & Range
  volatility: number // 0-100, scoring variance
  ceilingProjection: number // Ceiling DFS points
  floorProjection: number // Floor DFS points
  
  // Risk Assessment
  riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
  missedCutRisk: number // 0-100
  volatilityRisk: number // 0-100
  weatherSensitivity: number // 0-100
  
  // Ownership Context
  expectedOwnership: number // 0-100
  ownershipJustified: boolean
  leverageOpportunity: boolean
  leverageExplanation: string
  
  // Decision Tags
  tags: DecisionTag[]
  
  // Analyst Summary
  analystSummary: string
  whyRatesWell: string[]
  potentialConcerns: string[]
  
  // Contest Recommendations
  contestSuitability: {
    cash: ContestSuitability
    singleEntry: ContestSuitability
    threeMax: ContestSuitability
    twentyMax: ContestSuitability
    oneFiftyMax: ContestSuitability
    smallFieldGpp: ContestSuitability
    largeFieldGpp: ContestSuitability
  }
  
  // Lineup Roles
  recommendedRoles: LineupRole[]
  
  // Comparison Data
  stackPartners: string[] // Player IDs
  contrastPlayers: string[] // Players with opposite characteristics
  
  // Explainability
  supportingStatistics: {
    stat: string
    value: string | number
    source: 'DATABASE' | 'API' | 'CALCULATED' | 'HISTORICAL'
    confidence: number // 0-100
  }[]
  
  supportingTrends: {
    trend: string
    direction: 'Improving' | 'Declining' | 'Stable'
    explanation: string
    source: string
  }[]
  
  // Data Quality
  dataQuality: number // 0-100
  confidenceScore: number // 0-100
  missingInputs: string[]
  limitations: string[]
  
  // Metadata
  lastUpdated: Date
  generatedBy: 'DECISION_ENGINE_V1'
}

/**
 * Decision Tag - every tag must have supporting evidence
 */
export type DecisionTagType =
  | 'Elite Play'
  | 'Core Play'
  | 'Cash Lock'
  | 'High Ceiling'
  | 'Boom/Bust'
  | 'Contrarian'
  | 'Value'
  | 'Fade'
  | 'Risky Chalk'
  | 'Weather Boost'
  | 'Course Horse'
  | 'Balanced Option'
  | 'Injury Risk'
  | 'Form Swing'
  | 'Ownership Outlier'

export interface DecisionTag {
  tag: DecisionTagType
  confidence: number // 0-100
  reason: string
  supportingEvidence: string
}

/**
 * Contest Suitability - how good is this player for each format?
 */
export interface ContestSuitability {
  suitability: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Not Recommended'
  reasoning: string
  idealSalaryRange?: {
    min: number
    max: number
  }
  exampleDfsPoints?: {
    ceiling: number
    median: number
    floor: number
  }
  recommendation?: string
}

/**
 * Lineup Role - how should this player be used in a lineup?
 */
export type LineupRoleType =
  | 'Core Piece'
  | 'Tournament Pivot'
  | 'Last Man In'
  | 'Salary Saver'
  | 'High Ceiling Anchor'
  | 'Ownership Pivot'
  | 'Leverage Play'
  | 'Balanced Build'
  | 'Fade'

export interface LineupRole {
  role: LineupRoleType
  suitability: 'Primary' | 'Secondary' | 'Tertiary'
  explanation: string
  exampleSalaryStructure?: string
}

/**
 * Player Comparison - head-to-head analysis
 */
export interface PlayerComparison {
  player1Id: string
  player1Name: string
  player2Id: string
  player2Name: string
  
  courseFitComparison: {
    winner: 'Player1' | 'Player2' | 'Similar'
    reasoning: string
  }
  
  currentFormComparison: {
    winner: 'Player1' | 'Player2' | 'Similar'
    reasoning: string
  }
  
  ownershipComparison: {
    player1Ownership: number
    player2Ownership: number
    leverageAdvantage: 'Player1' | 'Player2' | 'Neither'
    reasoning: string
  }
  
  salaryComparison: {
    player1Salary: number
    player2Salary: number
    valueWinner: 'Player1' | 'Player2' | 'Context Dependent'
    reasoning: string
  }
  
  projectionComparison: {
    player1Ceiling: number
    player2Ceiling: number
    player1Floor: number
    player2Floor: number
    ceilingWinner: 'Player1' | 'Player2'
    floorWinner: 'Player1' | 'Player2'
    reasoning: string
  }
  
  riskComparison: {
    player1Risk: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
    player2Risk: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
    reasoning: string
  }
  
  aiRecommendation: string
  winner: 'Player1' | 'Player2' | 'Context Dependent'
  winnerReasoning: string
  
  supportingEvidence: {
    stat: string
    player1Value: string | number
    player2Value: string | number
    significance: 'Critical' | 'Important' | 'Minor'
  }[]
}

/**
 * Risk Profile - comprehensive risk assessment
 */
export interface RiskProfile {
  missedCutRisk: {
    probability: number // 0-100
    factors: string[]
  }
  
  volatilityRisk: {
    scoringVariance: number // Std dev of recent scores
    factors: string[]
  }
  
  weatherSensitivity: {
    rating: number // 0-100
    sensitivity: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
    factors: string[]
  }
  
  injuryConcerns: {
    status: 'None' | 'Minor' | 'Significant' | 'Severe'
    explanation: string
  }
  
  recentInconsistency: {
    rating: number // 0-100
    trend: 'Improving' | 'Declining' | 'Stable'
    explanation: string
  }
  
  overallRiskConfidence: number // 0-100
  riskAdjustment: number // -10 to +10 points to overall rating
}

/**
 * Ownership Analysis - explain ownership decisions
 */
export interface OwnershipAnalysis {
  expectedOwnership: number // 0-100
  
  reasonsForHighOwnership: string[]
  reasonsForLowOwnership: string[]
  
  ownershipJustified: boolean
  justificationReasoning: string
  
  leverageOpportunity: {
    exists: boolean
    magnitude: 'Low' | 'Moderate' | 'High'
    explanation: string
    howToExploit: string
  }
  
  comparisonToPeers: {
    player: string
    peerId: string
    peerOwnership: number
    reasoning: string
  }[]
}

/**
 * Explainability Report - complete audit trail
 */
export interface ExplainabilityReport {
  supportingFacts: {
    fact: string
    source: 'DATABASE' | 'API' | 'CALCULATED' | 'HISTORICAL' | 'MODEL'
    confidence: number
    provider?: string
  }[]
  
  reasoningChain: {
    step: number
    decision: string
    inputs: string[]
    output: string
  }[]
  
  missingInputs: {
    input: string
    impact: 'Critical' | 'Important' | 'Minor'
  }[]
  
  limitations: {
    limitation: string
    impact: string
  }[]
  
  unknowns: {
    unknown: string
    wouldAffect: string
  }[]
  
  dataQualityScore: number // 0-100
  confidenceLevel: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low'
}

/**
 * Complete Decision Output - consumed by all pages
 */
export interface DecisionEngineOutput {
  tournamentId: string
  generatedAt: Date
  
  playerDecisions: PlayerDecisionProfile[]
  
  topRecommendations: {
    elite: PlayerDecisionProfile[]
    core: PlayerDecisionProfile[]
    leverage: PlayerDecisionProfile[]
  }
  
  fadeList: PlayerDecisionProfile[]
  
  explainability: ExplainabilityReport
  
  dataQualityScore: number // 0-100
  overallConfidence: number // 0-100
}

/**
 * Decision Engine Input - what data it needs
 */
export interface DecisionEngineInput {
  tournamentId: string
  field: any // TournamentField
  tournamentIntelligence: any // TournamentIntelligenceOutput
  playerStats: any // PlayerStatistics[]
  dfsSalaries: any // DfsSalary[]
  currentOdds: any // OddsData[]
  weatherForecast: any // WeatherData
  historicalData: any // HistoricalTournamentData
  ownershipProjections?: any // Projected ownership %
}
