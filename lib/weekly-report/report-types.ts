/**
 * Weekly Tournament Report Type Definitions
 * 
 * Comprehensive type system for the flagship Weekly AI Tournament Report feature.
 * Every report generated from Tournament Intelligence and Decision engines.
 */

export interface WeeklyReportMetadata {
  id: string
  tournamentId: string
  tournamentName: string
  weekNumber: number
  year: number
  generatedAt: Date
  lastUpdatedAt: Date
  generatedBy: 'system' | 'manual'
  version: number
  dataQualityScore: number // 0-100
  confidence: number // 0-100
  updatedSinceLastReport?: string // Human readable delta
}

export interface ExecutiveSummarySection {
  headline: string // 1-2 sentences capturing tournament essence
  significance: string // Why this tournament matters
  courseIdentity: string // How course plays
  expectedScoring: {
    winningScore: number
    confidenceRange: [number, number]
    justification: string
    source: string
  }
  competitiveStorylines: string[] // 3-5 key narratives
  dfsEnvironment: {
    expectedVolatility: 'low' | 'medium' | 'high'
    ownershipConcentration: 'chalk' | 'spread' | 'contrarian'
    description: string
  }
  weatherSummary: string // 1 sentence overview
  keyTakeaway: string // "The biggest edge this week is..."
  dataQuality: 'verified' | 'high' | 'medium' | 'low'
}

export interface CourseBreakdownSection {
  courseIdentity: string // Summarize how course plays
  skillsRewarded: {
    name: string
    importance: 'critical' | 'high' | 'medium'
    why: string
    historicalEvidence: string
  }[]
  skillsPenalized: {
    name: string
    severity: 'critical' | 'high' | 'medium'
    why: string
    historicalEvidence: string
  }[]
  scoringAnalysis: {
    historicalAverageWinningScore: number
    historicalCutLine: number
    trend: 'getting_harder' | 'getting_easier' | 'stable'
    source: string
  }
  criticalHoles: {
    hole: number
    par: number
    criticality: 'extreme' | 'high' | 'medium'
    why: string
  }[]
  parDistribution: {
    par3: number
    par4: number
    par5: number
    total: number
  }
  birdieOpportunities: {
    holes: number[]
    frequency: string
    strategy: string
  }
  successProfile: string // "What type of golfer succeeds here"
}

export interface WeatherReportSection {
  headline: string
  forecast: {
    day: string
    high: number
    low: number
    wind: {
      speed: number
      direction: string
      gusts?: number
    }
    rainfall: number
    humidity: number
    conditions: string
  }[]
  morningVsAfternoon: {
    advantage: 'morning' | 'afternoon' | 'neutral'
    scoringImpact: number // strokes
    reason: string
  }
  windAnalysis: {
    primaryDirection: string
    expectedVariability: 'steady' | 'gusty' | 'variable'
    courseExposure: 'sheltered' | 'exposed' | 'mixed'
    impact: string
  }
  rainTiming: {
    probability: number
    expectedTiming: string
    courseImpact: string
  }
  temperatureEffects: string
  courseFirmness: string
  scoringImpactByWave: {
    wave: string
    expectedScoringChange: number // strokes vs normal
    reason: string
  }[]
  dfsImplications: string[]
}

export interface FieldStrengthSection {
  overallAssessment: string
  strengthScore: number // 0-100
  elitePlayers: {
    count: number
    examples: string[]
    dominanceRisk: 'low' | 'medium' | 'high'
  }
  majorChampions: {
    count: number
    recentWins: string[]
  }
  currentFormLeaders: string[] // Top 5 in-form players
  weakPortions: string // Where field is thin
  internationalPresence: {
    count: number
    countries: string[]
  }
  youthVsVeterans: {
    youthCount: number
    veteranCount: number
    interestingDynamic: string
  }
  fieldDepthAssessment: 'top-heavy' | 'balanced' | 'deep'
  volatilityExpectation: 'low' | 'medium' | 'high'
}

export interface PlayerTierEntry {
  rank: number
  playerId: string
  playerName: string
  dfsPosition: string
  salary: number
  projectedDfsPoints: {
    value: number
    ceiling: number
    floor: number
  }
  decisionRating: number // 0-100
  courseFit: number // 0-100
  recentForm: string // 'hot' | 'warm' | 'cold'
  ownership: {
    projected: number
    sentiment: 'chalk' | 'neutral' | 'contrarian'
  }
  reason: string // Why they're in this tier
  strengths: string[]
  concerns: string[]
  contestRecommendation: 'cash' | 'tournament' | 'both' | 'neither'
  lineupRole: 'core' | 'pivot' | 'salary_saver' | 'leverage'
}

export interface PlayerTiersSection {
  tier1: {
    name: 'Elite Core Plays'
    players: PlayerTierEntry[]
    strategyGuide: string
  }
  tier2: {
    name: 'Strong Plays'
    players: PlayerTierEntry[]
    strategyGuide: string
  }
  tier3: {
    name: 'High Upside'
    players: PlayerTierEntry[]
    strategyGuide: string
  }
  tier4: {
    name: 'Value Targets'
    players: PlayerTierEntry[]
    strategyGuide: string
  }
  tier5: {
    name: 'Salary Relief'
    players: PlayerTierEntry[]
    strategyGuide: string
  }
}

export interface FadeReportEntry {
  playerId: string
  playerName: string
  salary: number
  projectionRisk: string // Why they're risky
  reasons: {
    category: 'overpriced' | 'poor_fit' | 'regression' | 'ownership' | 'weather' | 'injury'
    severity: 'caution' | 'warning' | 'avoid'
    explanation: string
  }[]
  alternativeTarget?: string // Who to target instead
  confidence: number // 0-100
}

export interface FadeReportSection {
  header: string
  fadeList: FadeReportEntry[]
  guidance: string // How to interpret fade report
}

export interface ValueReportEntry {
  playerId: string
  playerName: string
  salary: number
  projectedPoints: number
  pointsPerThousandSalary: number
  ownership: number
  whyUndervalued: string
  targetContests: ('cash' | 'tournament' | 'gpp' | 'satellite')[]
  alternativeIfTaken?: string
}

export interface ValueReportSection {
  header: string
  bestValues: ValueReportEntry[]
  salaryRanges: {
    range: '$X-$Y'
    bestValue: ValueReportEntry
    strategy: string
  }[]
  leverageOpportunities: ValueReportEntry[]
}

export interface OwnershipReportSection {
  expectedChalk: {
    players: string[]
    ownership: number
    description: string
  }
  ownershipClusters: {
    cluster: string
    players: string[]
    ownership: number
    implication: string
  }[]
  contrarianPivots: {
    playerName: string
    reason: string
    pivotFrom: string
    ownership: number
  }[]
  leverageOpportunities: string[]
  contestImplications: {
    format: 'cash' | 'tournament' | 'gpp'
    strategy: string
  }[]
}

export interface LineupStrategyGuide {
  format: 'cash' | 'single_entry' | '3max' | '20max' | '150max' | 'small' | 'large'
  objective: string
  keyPrinciples: string[]
  recommendedConstruction: {
    tier1: { count: number; reason: string }
    tier2: { count: number; reason: string }
    tier3: { count: number; reason: string }
    tier4: { count: number; reason: string }
    tier5: { count: number; reason: string }
  }
  salaryAllocation: {
    range: string
    allocation: number // percentage
    strategy: string
  }[]
  exampleLineup?: {
    players: string[]
    totalSalary: number
    projectedPoints: number
    reasoning: string
  }
  commonMistakes: string[]
  winningFormula: string
}

export interface LineupStrategySection {
  cashGame: LineupStrategyGuide
  singleEntry: LineupStrategyGuide
  threeMax: LineupStrategyGuide
  twentyMax: LineupStrategyGuide
  largeFiled: LineupStrategyGuide
  satellites?: LineupStrategyGuide
}

export interface AiFavoritesSection {
  top10Overall: string[] // Player names
  top10Gpp: string[]
  top10Cash: string[]
  top10Value: string[]
  top10Leverage: string[]
  top10CourseFits: string[]
  top10RecentForm: string[]
  sleepers: string[]
}

export interface FinalTakeawaysSection {
  takeaways: {
    order: number
    emoji?: string
    title: string
    description: string
    actionable: true
  }[]
  bestEdge: string // The single biggest edge
  riskToAvoid: string
  opportunityToExplore: string
}

export interface SourceAttribution {
  section: string
  facts: {
    fact: string
    source: 'tournament_intelligence' | 'decision_engine' | 'historical_data' | 'weather_api' | 'odds_api'
    confidence: number // 0-100
    lastUpdated: Date
  }[]
}

export interface WeeklyReportOutput {
  metadata: WeeklyReportMetadata
  executiveSummary: ExecutiveSummarySection
  courseBreakdown: CourseBreakdownSection
  weather: WeatherReportSection
  fieldStrength: FieldStrengthSection
  playerTiers: PlayerTiersSection
  fadeReport: FadeReportSection
  valueReport: ValueReportSection
  ownershipReport: OwnershipReportSection
  lineupStrategy: LineupStrategySection
  aiFavorites: AiFavoritesSection
  finalTakeaways: FinalTakeawaysSection
  sourceAttribution: SourceAttribution[]
  explainability: {
    dataQuality: number // 0-100
    missingInputs: string[]
    limitations: string[]
    regeneratedReason?: string
    previousVersion?: {
      generatedAt: Date
      changesSummary: string
    }
  }
}

export interface WeeklyReportGenerationInput {
  tournamentId: string
  forceRegenerate?: boolean
  includeHistoricalComparison?: boolean
}

export interface WeeklyReportDisplayFormats {
  webReport: string // HTML
  mobileReport: string // Mobile-optimized HTML
  pdfReport: string // PDF blob
  shareableLink: string
  plainText: string
}
