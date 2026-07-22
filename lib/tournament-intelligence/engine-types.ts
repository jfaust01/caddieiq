/**
 * CADDIEIQ TOURNAMENT INTELLIGENCE ENGINE
 * 
 * Comprehensive structured output for all tournament analysis.
 * Consumed by Dashboard, Tournament Detail, Slate Analysis, AI Chat, Optimizer, Reports.
 */

// MODULE 1: COURSE ANALYSIS
export interface CourseAnalysis {
  headline: string
  interpretation: string
  skillsRewarded: {
    skill: string
    importance: 'Critical' | 'Very Important' | 'Important' | 'Moderate' | 'Minor'
    explanation: string
  }[]
  skillsPenalized: {
    skill: string
    severity: 'Severe' | 'Significant' | 'Moderate' | 'Minor'
    explanation: string
  }[]
  historicalScoringTrends: {
    year: number
    winningScore: number
    cutLine: number
    birdieRate: number
  }[]
  weatherStrategy: string
  dfsImplications: string
  confidence: number
}

// MODULE 2: PLAYER FIT ENGINE
export interface PlayerFitScore {
  playerId: string
  playerName: string
  overallFit: number // 0-100
  supportingFactors: {
    name: string
    score: number
    explanation: string
    dataSource: 'STAT' | 'HISTORICAL' | 'CALCULATED' | 'FORM'
  }[]
  weaknesses: {
    name: string
    severity: 'Critical' | 'Significant' | 'Moderate' | 'Minor'
    explanation: string
  }[]
  confidence: number // 0-100
  lastUpdated: Date
}

// MODULE 3: WEATHER ENGINE
export interface WeatherAnalysis {
  headline: string
  interpretation: string
  morningAdvantage: {
    condition: string
    advantage: string
    scoringImpact: number // -5 to +5 strokes
  } | null
  afternoonAdvantage: {
    condition: string
    advantage: string
    scoringImpact: number
  } | null
  suspensionRisk: {
    probability: number // 0-100
    timeWindows: {
      start: string
      end: string
      severity: 'High' | 'Medium' | 'Low'
    }[]
  }
  scoringImpact: string
  clubSelectionImpact: string
  dfsImpact: string
  confidence: number
}

// MODULE 4: FIELD STRENGTH ENGINE
export interface FieldStrengthAnalysis {
  overallStrength: number // 0-100
  strengthByRanking: {
    rankingBand: string
    count: number
    percentage: number
    avgWorldRank: number
  }[]
  majorWinners: number
  elitePlayers: number
  depth: string // 'Very Deep', 'Deep', 'Moderate', 'Shallow'
  weaknesses: string
  expectedVolatility: 'High' | 'Moderate' | 'Low'
  expectedPayouts: string // Description of typical payouts
  uniqueStrengths: string[]
}

// MODULE 5: COURSE HISTORY ENGINE
export interface CourseHistoryAnalysis {
  historicalWinners: {
    year: number
    winner: string
    score: number
    avgWinningScore: number
  }[]
  repeatedContenders: {
    playerName: string
    topFinishes: number
    consistency: string
  }[]
  winningPlayerProfile: string
  failingPlayerProfile: string
  historicalCutLines: {
    year: number
    cutLine: number
    numMadecut: number
    totalField: number
  }[]
  historicalScoringStats: {
    averageRound: number
    birdieRate: number
    bogeyRate: number
    eagleRate: number
  }
  trends: {
    trend: string
    evidence: string
  }[]
}

// MODULE 6: DFS STRATEGY ENGINE
export interface DfsStrategy {
  cash: {
    recommendation: string
    why: string
    playedSalaryRange: string
    exampleLineups: string[]
  }
  singleEntry: {
    recommendation: string
    why: string
    keyPlayers: string[]
  }
  multiEntry: {
    recommendation: string
    why: string
    strategies: string[]
  }
  largeFields: {
    recommendation: string
    why: string
    differentiation: string
  }
}

// MODULE 7: VALUE ENGINE
export interface ValueAnalysis {
  undervalued: {
    playerId: string
    playerName: string
    salary: number
    projectedValue: number
    reason: string
  }[]
  overpriced: {
    playerId: string
    playerName: string
    salary: number
    reason: string
  }[]
  salaryInefficiencies: string[]
  ceiling: {
    playerId: string
    playerName: string
    ceilingScore: number
    explanation: string
  }[]
  floor: {
    playerId: string
    playerName: string
    floorScore: number
    explanation: string
  }[]
  leverageOpportunities: string[]
}

// MODULE 8: TOURNAMENT STORYLINES
export interface TournamentStoryline {
  headline: string
  narrative: string
  relevance: 'High' | 'Medium' | 'Low'
  dfsImpact: string | null // null if minimal impact
  supportingFacts: string[]
}

// MODULE 9: AI EXECUTIVE SUMMARY
export interface ExecutiveSummary {
  headline: string
  keyTakeaway: string
  mustKnowPoints: string[]
  readingTimeMinutes: number // 2-3 minutes recommended
  quickRecommendation: string
}

// MODULE 10: EXPLAINABILITY
export interface ExplainabilityReport {
  supportingFacts: Array<{
    claim: string
    statistic: string
    source: 'API' | 'DATABASE' | 'CALCULATED' | 'HISTORICAL'
    confidence: number
  }>
  dataQuality: {
    overallScore: number // 0-100
    missingInputs: string[]
    limitations: string[]
  }
  sourceAttribution: string[]
  reasoning: string[]
  unknowns: string[]
}

// COMPLETE TOURNAMENT INTELLIGENCE OUTPUT
export interface TournamentIntelligenceOutput {
  tournamentId: string
  tournamentName: string
  generatedAt: Date
  dataQuality: number // 0-100

  // All 10 modules
  courseAnalysis: CourseAnalysis
  playerFitScores: PlayerFitScore[]
  weatherAnalysis: WeatherAnalysis
  fieldStrengthAnalysis: FieldStrengthAnalysis
  courseHistoryAnalysis: CourseHistoryAnalysis
  dfsStrategy: DfsStrategy
  valueAnalysis: ValueAnalysis
  storylines: TournamentStoryline[]
  executiveSummary: ExecutiveSummary
  explainability: ExplainabilityReport

  // Version tracking
  engineVersion: string
  moduleVersions: Record<string, string>
}
