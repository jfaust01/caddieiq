/**
 * OPTIMIZER TYPE SYSTEM
 * 
 * Comprehensive types for the AI Lineup Builder & Explainable Optimizer.
 * Every type designed for complete explainability and evidence-based reasoning.
 */

// Contest Types
export type ContestType = 
  | 'cash'
  | 'single-entry'
  | '3-max'
  | '20-max'
  | '150-max'
  | 'small-field-gpp'
  | 'large-field-gpp'
  | 'custom'

// Strategy Profiles
export type StrategyProfile = 
  | 'highest-floor'
  | 'highest-ceiling'
  | 'balanced'
  | 'aggressive-gpp'
  | 'leverage'
  | 'stars-and-scrubs'
  | 'balanced-build'
  | 'weather-edge'
  | 'course-specialists'
  | 'recent-form'
  | 'custom'

// Individual Player Grades (0-100)
export interface PlayerGrades {
  projection: number           // Projected points quality
  ceiling: number              // Upside potential
  floor: number                // Downside protection
  ownership: number            // Ownership efficiency
  leverage: number             // Leverage opportunity
  correlation: number          // Lineup fit
  risk: number                 // Risk assessment
  weather: number              // Weather suitability
  courseFit: number            // Course fit quality
}

// Overall Grade Components
export interface LineupGrades {
  projectionGrade: number      // Overall point projection
  ceilingGrade: number         // Upside potential
  floorGrade: number           // Downside protection
  ownershipGrade: number       // Ownership construction
  leverageGrade: number        // Leverage opportunity
  correlationGrade: number     // Player fit
  riskGrade: number            // Risk level
  weatherGrade: number         // Weather advantage
  courseFitGrade: number       // Course specialization
  overallGrade: number         // Final grade (0-100)
}

// Player Explanation
export interface PlayerExplanation {
  playerId: string
  playerName: string
  salary: number
  position: string
  
  // Why Selected
  whySelected: string          // 1-2 sentence explanation
  primaryReason: string        // Main factor
  secondaryReasons: string[]   // Supporting factors
  
  // Analysis
  courseFit: number            // 0-100 fit score
  recentForm: number           // 0-100 form score
  ownership: number            // Projected ownership %
  riskLevel: 'low' | 'medium' | 'high'
  
  // Projections
  ceiling: number              // Best case points
  floor: number                // Worst case points
  expectedValue: number        // Expected points
  variance: number             // Scoring variance
  
  // Intelligence
  decisionEngineRating: number // 0-100 overall rating
  tournamnetIntelligence: {
    courseAnalysis: string
    playerFitExplanation: string
    weatherImpact: string
  }
  
  // Confidence & Data Quality
  confidence: number           // 0-100 confidence
  dataQuality: number          // 0-100 data completeness
  missingInputs: string[]      // Known gaps
  
  // Contest Suitability
  cashGame: boolean            // Good for cash?
  gpp: boolean                 // Good for GPP?
  cashReason?: string
  gppReason?: string
  
  // Pivots (alternatives)
  bestPivot?: {
    playerId: string
    playerName: string
    salary: number
    reason: string
    salarySaved: number
  }
  saferPivot?: {
    playerId: string
    playerName: string
    salary: number
    reason: string
  }
  lowerOwnedPivot?: {
    playerId: string
    playerName: string
    salary: number
    expectedOwnership: number
    reason: string
  }
  higherCeilingPivot?: {
    playerId: string
    playerName: string
    salary: number
    ceilingPoints: number
    reason: string
  }
}

// Stack Analysis
export interface StackAnalysis {
  players: string[]            // Player names in stack
  type: 'weather' | 'course' | 'form' | 'value' | 'leverage' | 'custom'
  explanation: string
  
  // Quality Metrics
  correlation: number          // How correlated?
  risk: number                 // Stack risk
  
  // Combinations
  positiveWithPlayers?: string[]
  negativeWithPlayers?: string[]
  ownershipOverlap?: number    // % of combined ownership
}

// Lineup Explanation
export interface LineupExplanation {
  tournamentId: string
  lineupId: string
  
  // Executive Summary
  headline: string             // 1-2 sentence summary
  executiveSummary: string     // 3-4 sentence explanation
  
  // Strategy
  strategy: StrategyProfile
  strategyExplanation: string
  contestType: ContestType
  
  // Golfers
  players: PlayerExplanation[]
  
  // Grades
  grades: LineupGrades
  
  // Stack Analysis
  stacks: StackAnalysis[]
  
  // What's Strong
  strengths: string[]          // 3-5 lineup strengths
  
  // What's Weak
  weaknesses: string[]         // 3-5 potential concerns
  
  // Decision Making
  keyDecisions: string[]       // Major trade-offs made
  expectedVsRisk: string       // Ceiling vs Floor explanation
  
  // Contest Recommendation
  bestFor: ContestType[]       // Which formats to use this?
  reasoning: string
  
  // Financials
  totalSalary: number
  salaryRemaining: number
  
  // Intelligence Sources
  intelligenceUsed: {
    tournamentIntelligence: boolean
    decisionEngine: boolean
    weatherData: boolean
    historicalTrends: boolean
    ownershipData: boolean
  }
  
  // Data Quality
  overallConfidence: number    // 0-100
  missingInputs: string[]      // What we don't know
  assumptions: string[]        // Key assumptions
  limitations: string[]        // Known limitations
}

// Lineup Comparison
export interface LineupComparison {
  lineup1Id: string
  lineup2Id: string
  
  // Differences
  differingPlayers: {
    uniqueToLineup1: PlayerExplanation[]
    uniqueToLineup2: PlayerExplanation[]
    sameInBoth: PlayerExplanation[]
  }
  
  // Metrics
  projectionDifference: number
  ceilingDifference: number
  floorDifference: number
  ownershipDifference: number
  leverageDifference: number
  riskDifference: number
  
  // Analysis
  lineup1Advantages: string[]
  lineup2Advantages: string[]
  
  // Recommendation
  recommendation: string
  contestRecommendation: {
    cash: 'lineup1' | 'lineup2' | 'either'
    gpp: 'lineup1' | 'lineup2' | 'either'
    reasoning: string
  }
}

// What-If Scenario
export interface WhatIfScenario {
  originalLineup: LineupExplanation
  modification: {
    type: 'fade-player' | 'weather-change' | 'ownership-change' | 'injury' | 'lock-player' | 'force-salary'
    detail: string
  }
  newLineup: LineupExplanation
  
  // Changes
  changes: {
    removedPlayers: string[]
    addedPlayers: string[]
    projectionChange: number
    ceilingChange: number
    floorChange: number
    ownershipChange: number
  }
  
  // Analysis
  explanation: string          // Why lineup changed
  recommendation: string       // Is this better or worse?
}

// Pivot Engine
export interface PivotOptions {
  playerId: string
  playerName: string
  salary: number
  
  // All pivot options
  pivots: {
    best: PivotOption
    safer: PivotOption
    lowerOwned: PivotOption
    higherCeiling: PivotOption
    salaryVaries: PivotOption[]
  }
}

export interface PivotOption {
  playerId: string
  playerName: string
  salary: number
  
  // Impact
  projectionImpact: number     // Points gained/lost
  ceilingImpact: number
  floorImpact: number
  ownershipImpact: number
  salarySavings: number
  
  // Explanation
  whyBetter: string
  whyPivot: string
  
  // Quality
  confidence: number
}

// Constraints
export interface OptimizerConstraints {
  lockedPlayers?: string[]
  excludedPlayers?: string[]
  minExposure?: { [playerId: string]: number }  // % exposure
  maxExposure?: { [playerId: string]: number }
  minSalary?: number
  maxSalary?: number
  customGroups?: {
    name: string
    players: string[]
    minCount?: number
    maxCount?: number
  }[]
}

// Optimizer Input
export interface OptimizerInput {
  tournamentId: string
  field: any                   // Tournament field
  contestType: ContestType
  strategy: StrategyProfile
  
  // Intelligence
  tournamentIntelligence: any  // From Tournament Engine
  decisionEngine: any          // From Decision Engine
  dfsSalaries: any[]
  ownership: any
  
  // Constraints
  constraints?: OptimizerConstraints
  
  // Options
  count?: number               // How many lineups to generate?
  weatherForecast?: any
  customWeights?: {
    projection?: number
    ceiling?: number
    floor?: number
    ownership?: number
    leverage?: number
    correlation?: number
    risk?: number
    weather?: number
    courseFit?: number
  }
}

// Optimizer Output
export interface OptimizerOutput {
  lineups: LineupExplanation[]
  
  // Metadata
  generatedAt: string
  generationTime: number       // ms
  
  // Summary Statistics
  avgProjection: number
  avgCeiling: number
  avgFloor: number
  avgOwnership: number
  diversityScore: number       // How different are lineups?
  
  // Best Options
  bestForCash: LineupExplanation
  bestForGpp: LineupExplanation
  mostContrarian: LineupExplanation
  highestFloor: LineupExplanation
  highestCeiling: LineupExplanation
  
  // Data Quality
  overallConfidence: number
  dataQuality: {
    decisionEngineReady: boolean
    tournamentIntelligenceReady: boolean
    weatherDataReady: boolean
    ownershipDataReady: boolean
  }
  
  // Explainability
  methodology: string          // How lineups were built
  limitations: string[]
  assumptions: string[]
}

// Export Formats
export interface LineupExport {
  format: 'draftkings-csv' | 'printable-summary' | 'share-link' | 'saved-version'
  content: string | object
  timestamp: string
  tournamentId: string
}

// Saved Lineup
export interface SavedLineup {
  id: string
  tournamentId: string
  name: string
  timestamp: string
  explanation: LineupExplanation
  tags: string[]
  notes: string
  performance?: {
    actualPoints: number
    cash?: boolean
    result?: string
  }
}
