import prisma from '@/lib/prisma'
import {
  retrieveAnalystContext,
  analyzeQueryIntent,
} from '@/features/analyst/services/data-retrieval-service'
import {
  generateTournamentOverview,
  generateCourseBreakdown,
  generateWeatherReport,
  generateTopPlays,
  generateDFSStrategy,
  generateHistoricalComparisons,
  generateAITakeaways,
} from './slate-sections-builder'

export interface SlateAnalysisReport {
  tournamentId: string
  generatedAt: Date
  sections: {
    overview: any
    courseBreakdown: any
    weatherReport: any
    topPlays: any
    playerCards: any[]
    dfsStrategy: any
    historicalComparisons: any
    aiTakeaways: any
  }
  confidence: number
  dataSources: string[]
}

/**
 * Automatically generates a complete AI-powered slate analysis for a tournament
 */
export async function generateSlateAnalysis(
  tournamentId: string
): Promise<SlateAnalysisReport> {
  console.log(`[SlateAnalysis] Generating report for tournament: ${tournamentId}`)

  // Get tournament data
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentCourses: {
        include: {
          course: {
            include: {
              courseAnalytics: true,
              courseCharacteristics: true,
              courseSpecifications: true,
            },
          },
        },
      },
    },
  })

  if (!tournament) {
    throw new Error(`Tournament not found: ${tournamentId}`)
  }

  // Get all field players
  const fieldPlayers = await prisma.tournamentField.findMany({
    where: { tournamentId },
    include: {
      player: true,
    },
  })

  // Retrieve comprehensive context using AI retrieval layer
  const context = await retrieveAnalystContext(
    `Analyze tournament: ${tournament.name}`
  )

  // Generate all sections in parallel
  const [
    overview,
    courseBreakdown,
    weatherReport,
    topPlays,
    dfsStrategy,
    historicalComparisons,
    aiTakeaways,
  ] = await Promise.all([
    generateTournamentOverview(tournament, context),
    generateCourseBreakdown(tournament, context),
    generateWeatherReport(tournament, context),
    generateTopPlays(fieldPlayers, tournament, context),
    generateDFSStrategy(fieldPlayers, tournament, context),
    generateHistoricalComparisons(tournament, context),
    generateAITakeaways(tournament, fieldPlayers, context),
  ])

  // Generate player cards for top recommendations
  const playerCards = await generatePlayerCards(fieldPlayers.slice(0, 20), context)

  return {
    tournamentId,
    generatedAt: new Date(),
    sections: {
      overview,
      courseBreakdown,
      weatherReport,
      topPlays,
      playerCards,
      dfsStrategy,
      historicalComparisons,
      aiTakeaways,
    },
    confidence: calculateConfidence(context),
    dataSources: extractDataSources(context),
  }
}

/**
 * Gets or generates the current week's slate analysis
 */
export async function getCurrentWeekSlateAnalysis(): Promise<SlateAnalysisReport | null> {
  // Find the active tournament for this week
  const now = new Date()

  const activeTournament = await prisma.tournament.findFirst({
    where: {
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
      },
      active: true,
    },
  })

  if (!activeTournament) {
    return null
  }

  return generateSlateAnalysis(activeTournament.id)
}

/**
 * Generates player cards for featured golfers
 */
async function generatePlayerCards(
  fieldPlayers: any[],
  context: any
): Promise<any[]> {
  const playerCards = []

  for (const fieldPlayer of fieldPlayers.slice(0, 10)) {
    const player = fieldPlayer.player

    // Get player historical data
    const playerHistory = await prisma.historicalTournamentOutcomes.findMany({
      where: { playerId: player.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // Get player ranking
    const playerRanking = await prisma.playerSeasonStatistics.findFirst({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
    })

    // Get DFS data for this player
    const dfsSalaries = await prisma.dfsSalaries.findMany({
      where: {
        playerId: player.id,
        tournamentId: fieldPlayer.tournamentId,
      },
    })

    const projections = await prisma.fantasyProjections.findMany({
      where: {
        playerId: player.id,
        tournamentId: fieldPlayer.tournamentId,
      },
    })

    playerCards.push({
      playerId: player.id,
      playerName: player.fullName,
      salary: dfsSalaries[0]?.salary || null,
      projection: projections[0]?.fantasyPointsDraftKings || null,
      ownership: Math.random() * 50, // Placeholder - would come from DFS API
      vegasOdds: fieldPlayer.startingHole ? 25.0 : 30.0, // Placeholder
      courseHistory: playerHistory,
      recentForm: playerHistory.slice(0, 3),
      worldRanking: playerRanking?.worldRanking || null,
      weatherGrade: calculateWeatherGrade(player.id, context),
      riskGrade: calculateRiskGrade(playerHistory),
      aiSummary: generatePlayerAISummary(player, playerHistory),
    })
  }

  return playerCards
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(context: any): number {
  let confidence = 0.85

  if (context.weather && context.weather.length > 0) confidence += 0.05
  if (context.dfs && context.dfs.length > 0) confidence += 0.05
  if (context.odds && context.odds.length > 0) confidence += 0.03

  return Math.min(confidence, 0.98)
}

/**
 * Extract data sources from context
 */
function extractDataSources(context: any): string[] {
  const sources = new Set<string>()

  if (context.tournaments && context.tournaments.length > 0)
    sources.add('Tournament Database')
  if (context.weather && context.weather.length > 0) sources.add('Weather API')
  if (context.odds && context.odds.length > 0) sources.add('Odds Database')
  if (context.dfs && context.dfs.length > 0) sources.add('DFS Ownership')
  if (context.projections && context.projections.length > 0)
    sources.add('Projections Model')
  if (context.playerHistory && context.playerHistory.length > 0)
    sources.add('Historical Outcomes')

  return Array.from(sources)
}

/**
 * Calculate weather grade for a player
 */
function calculateWeatherGrade(playerId: string, context: any): string {
  return 'A' // Placeholder
}

/**
 * Calculate risk grade based on history
 */
function calculateRiskGrade(playerHistory: any[]): string {
  if (playerHistory.length === 0) return 'HIGH'
  if (playerHistory.length < 3) return 'MEDIUM'
  return 'LOW'
}

/**
 * Generate AI summary for a player
 */
function generatePlayerAISummary(player: any, history: any[]): string {
  if (history.length === 0) {
    return `${player.fullName} has limited historical data at this course. New venue analysis needed.`
  }

  const recentFinishes = history.slice(0, 3)
  const avgFinish =
    recentFinishes.reduce((sum: number, h: any) => sum + (h.finishPosition || 0), 0) /
    recentFinishes.length

  if (avgFinish < 10) {
    return `${player.fullName} consistently finishes top-10. Strong historical fit.`
  } else if (avgFinish < 25) {
    return `${player.fullName} has solid historical performance. Moderate fit.`
  } else {
    return `${player.fullName} struggles at this type of course. Higher risk.`
  }
}
