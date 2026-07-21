import prisma from '@/lib/prisma'

export interface RetrievedContext {
  source: string
  data: any
  confidence: number
  query: string
  timestamp: Date
}

export interface AnalystContext {
  tournaments: RetrievedContext[]
  players: RetrievedContext[]
  weather: RetrievedContext[]
  odds: RetrievedContext[]
  dfs: RetrievedContext[]
  salaries: RetrievedContext[]
  projections: RetrievedContext[]
  playerHistory: RetrievedContext[]
  courseData: RetrievedContext[]
}

/**
 * Analyzes user query and determines which data sources are needed
 */
export async function analyzeQueryIntent(query: string): Promise<string[]> {
  const lowerQuery = query.toLowerCase()
  const needSources: string[] = []

  // Keyword mapping to data sources
  if (
    lowerQuery.includes('compare') ||
    lowerQuery.includes('vs') ||
    lowerQuery.includes('player')
  ) {
    needSources.push('players', 'playerHistory')
  }
  if (
    lowerQuery.includes('weather') ||
    lowerQuery.includes('wind') ||
    lowerQuery.includes('temperature') ||
    lowerQuery.includes('condition')
  ) {
    needSources.push('weather')
  }
  if (
    lowerQuery.includes('odds') ||
    lowerQuery.includes('line') ||
    lowerQuery.includes('favorite') ||
    lowerQuery.includes('bet')
  ) {
    needSources.push('odds')
  }
  if (
    lowerQuery.includes('dfs') ||
    lowerQuery.includes('ownership') ||
    lowerQuery.includes('chalk') ||
    lowerQuery.includes('slate')
  ) {
    needSources.push('dfs', 'salaries', 'projections')
  }
  if (
    lowerQuery.includes('salary') ||
    lowerQuery.includes('price') ||
    lowerQuery.includes('$')
  ) {
    needSources.push('salaries')
  }
  if (
    lowerQuery.includes('tournament') ||
    lowerQuery.includes('event') ||
    lowerQuery.includes('course')
  ) {
    needSources.push('tournaments', 'courseData')
  }
  if (
    lowerQuery.includes('value') ||
    lowerQuery.includes('project') ||
    lowerQuery.includes('forecast')
  ) {
    needSources.push('projections')
  }
  if (
    lowerQuery.includes('history') ||
    lowerQuery.includes('past') ||
    lowerQuery.includes('performance')
  ) {
    needSources.push('playerHistory')
  }

  // If no sources identified, default to broad search
  if (needSources.length === 0) {
    needSources.push('tournaments', 'players')
  }

  return [...new Set(needSources)] // Remove duplicates
}

/**
 * Retrieves tournament data relevant to the query
 */
export async function retrieveTournamentData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const recentTournaments = await prisma.tournament.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        season: true,
        _count: {
          select: {
            fields: true,
            rounds: true,
          },
        },
      },
    })

    if (recentTournaments.length === 0) return null

    return {
      source: 'tournaments',
      data: recentTournaments,
      confidence: 0.95,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Tournament retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves player data matching the query
 */
export async function retrievePlayerData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    // Extract player names from query
    const playerNames = query.match(
      /(?:^|\s)([A-Z][a-z]+)\s+(?:vs|versus|vs\.)?(?:\s+and\s+)?([A-Z][a-z]+)?/g
    )

    const players = await prisma.player.findMany({
      take: 10,
      where: {
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        worldRanking: true,
        countryCode: true,
        status: true,
      },
      orderBy: [{ worldRanking: 'asc' }],
    })

    if (players.length === 0) return null

    return {
      source: 'players',
      data: players,
      confidence: 0.85,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Player retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves historical player performance
 */
export async function retrievePlayerHistory(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const recentOutcomes = await prisma.historicalTournamentOutcome.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
          },
        },
      },
    })

    if (recentOutcomes.length === 0) return null

    return {
      source: 'playerHistory',
      data: recentOutcomes,
      confidence: 0.9,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Player history retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves weather data for tournaments
 */
export async function retrieveWeatherData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const weatherData = await prisma.weatherSnapshot.findMany({
      take: 10,
      orderBy: { capturedAt: 'desc' },
      include: {
        periods: {
          take: 5,
        },
        tournament: {
          select: {
            name: true,
            startDate: true,
          },
        },
      },
    })

    if (weatherData.length === 0) return null

    return {
      source: 'weather',
      data: weatherData,
      confidence: 0.88,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Weather retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves betting odds data
 */
export async function retrieveOddsData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const oddsData = await prisma.oddsQuote.findMany({
      take: 20,
      orderBy: { lastUpdate: 'desc' },
      include: {
        oddsEvent: {
          select: {
            tournament: {
              select: {
                name: true,
                startDate: true,
              },
            },
          },
        },
      },
    })

    if (oddsData.length === 0) return null

    return {
      source: 'odds',
      data: oddsData,
      confidence: 0.92,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Odds retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves DFS ownership and contest data
 */
export async function retrieveDFSData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const dfsData = await prisma.dfsPlayerOwnership.findMany({
      take: 15,
      orderBy: { projectedOwnership: 'desc' },
      include: {
        dfsContest: {
          select: {
            id: true,
            contestName: true,
            tournament: {
              select: {
                name: true,
              },
            },
          },
        },
        player: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    })

    if (dfsData.length === 0) return null

    return {
      source: 'dfs',
      data: dfsData,
      confidence: 0.87,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] DFS retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves DFS salary data
 */
export async function retrieveSalaryData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const salaryData = await prisma.dfsSalary.findMany({
      take: 20,
      orderBy: { salary: 'desc' },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
        tournament: {
          select: {
            name: true,
            startDate: true,
          },
        },
      },
    })

    if (salaryData.length === 0) return null

    return {
      source: 'salaries',
      data: salaryData,
      confidence: 0.93,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Salary retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves fantasy projections
 */
export async function retrieveProjectionData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const projections = await prisma.fantasyProjection.findMany({
      take: 15,
      orderBy: { fantasyPointsDraftKings: 'desc' },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
        tournament: {
          select: {
            name: true,
            startDate: true,
          },
        },
      },
    })

    if (projections.length === 0) return null

    return {
      source: 'projections',
      data: projections,
      confidence: 0.84,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Projection retrieval failed:', error)
    return null
  }
}

/**
 * Retrieves course data and characteristics
 */
export async function retrieveCourseData(
  query: string
): Promise<RetrievedContext | null> {
  try {
    const courseData = await prisma.course.findMany({
      take: 5,
      include: {
        analytics: true,
        characteristics: true,
        specifications: true,
        intelligence: true,
      },
    })

    if (courseData.length === 0) return null

    return {
      source: 'courseData',
      data: courseData,
      confidence: 0.89,
      query,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('[Analyst] Course retrieval failed:', error)
    return null
  }
}

/**
 * Master function that orchestrates all retrievals based on query intent
 */
export async function retrieveAnalystContext(
  query: string
): Promise<AnalystContext> {
  // Analyze what data is needed
  const neededSources = await analyzeQueryIntent(query)

  // Retrieve data in parallel from needed sources
  const retrievalPromises = []

  if (neededSources.includes('tournaments')) {
    retrievalPromises.push(
      retrieveTournamentData(query).then((data) => ({ key: 'tournaments', data }))
    )
  }
  if (neededSources.includes('players')) {
    retrievalPromises.push(
      retrievePlayerData(query).then((data) => ({ key: 'players', data }))
    )
  }
  if (neededSources.includes('playerHistory')) {
    retrievalPromises.push(
      retrievePlayerHistory(query).then((data) => ({ key: 'playerHistory', data }))
    )
  }
  if (neededSources.includes('weather')) {
    retrievalPromises.push(
      retrieveWeatherData(query).then((data) => ({ key: 'weather', data }))
    )
  }
  if (neededSources.includes('odds')) {
    retrievalPromises.push(
      retrieveOddsData(query).then((data) => ({ key: 'odds', data }))
    )
  }
  if (neededSources.includes('dfs')) {
    retrievalPromises.push(
      retrieveDFSData(query).then((data) => ({ key: 'dfs', data }))
    )
  }
  if (neededSources.includes('salaries')) {
    retrievalPromises.push(
      retrieveSalaryData(query).then((data) => ({ key: 'salaries', data }))
    )
  }
  if (neededSources.includes('projections')) {
    retrievalPromises.push(
      retrieveProjectionData(query).then((data) => ({ key: 'projections', data }))
    )
  }
  if (neededSources.includes('courseData')) {
    retrievalPromises.push(
      retrieveCourseData(query).then((data) => ({ key: 'courseData', data }))
    )
  }

  const results = await Promise.all(retrievalPromises)

  // Build context object
  const context: AnalystContext = {
    tournaments: [],
    players: [],
    weather: [],
    odds: [],
    dfs: [],
    salaries: [],
    projections: [],
    playerHistory: [],
    courseData: [],
  }

  results.forEach(({ key, data }) => {
    if (data) {
      context[key as keyof AnalystContext] = data
    }
  })

  return context
}
