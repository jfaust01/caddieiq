import { AnalystContext, RetrievedContext } from './data-retrieval-service'

export interface SourceAttribution {
  source: string
  confidence: number
  dataPoints: number
  retrievedAt: Date
}

export interface ContextBlock {
  section: string
  content: string
  attribution: SourceAttribution[]
}

/**
 * Formats retrieved context into LLM-friendly text with source attribution
 */
export function buildContextPrompt(context: AnalystContext): string {
  const blocks: ContextBlock[] = []

  // Tournament context
  if (context.tournaments.length > 0) {
    blocks.push(
      formatTournamentContext(context.tournaments[0]),
      formatPlayerContext(context.players[0]),
      formatWeatherContext(context.weather[0]),
      formatOddsContext(context.odds[0]),
      formatDFSContext(context.dfs[0]),
      formatSalaryContext(context.salaries[0]),
      formatProjectionContext(context.projections[0]),
      formatPlayerHistoryContext(context.playerHistory[0]),
      formatCourseContext(context.courseData[0])
    )
  }

  // Build the final prompt
  return blocks
    .filter((block) => block.content.trim().length > 0)
    .map((block) => formatBlockWithAttribution(block))
    .join('\n\n')
}

function formatTournamentContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Recent Tournaments',
      content: 'No tournament data available.',
      attribution: [],
    }
  }

  const tournaments = context.data
  const content = tournaments
    .slice(0, 5)
    .map(
      (t: any) => `
- ${t.name} (${new Date(t.startDate).toLocaleDateString()})
  Location: ${t.location || 'TBA'}
  Players: ${t._count?.fields || 'Unknown'}
  Rounds: ${t._count?.rounds || 'Unknown'}
  Status: ${t.status || 'Scheduled'}
`
    )
    .join('')

  return {
    section: 'Recent Tournaments',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: tournaments.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatPlayerContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Player Rankings',
      content: 'No player ranking data available.',
      attribution: [],
    }
  }

  const players = context.data
  const content = players
    .slice(0, 10)
    .map(
      (p: any) => `
- ${p.fullName || `${p.firstName} ${p.lastName}`}
  World Ranking: #${p.worldRanking || 'N/A'}
  Status: ${p.status}
  Country: ${p.countryCode || 'N/A'}
`
    )
    .join('')

  return {
    section: 'Top Players',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: players.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatWeatherContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Weather Conditions',
      content: 'No weather data available.',
      attribution: [],
    }
  }

  const weatherSnapshots = context.data
  const content = weatherSnapshots
    .slice(0, 3)
    .map((w: any) => {
      const periods = w.periods || []
      const periodSummary = periods
        .slice(0, 3)
        .map((p: any) => `${p.temperatureC}°C, Wind: ${p.windSpeedMs}m/s, ${p.conditionLabel}`)
        .join('\n  ')

      return `
Tournament: ${w.tournament?.name || 'Unknown'} (${new Date(w.capturedAt).toLocaleDateString()})
Location: ${w.latitude.toFixed(2)}°, ${w.longitude.toFixed(2)}°
Forecast Periods:
  ${periodSummary || 'No period data'}
`
    })
    .join('\n')

  return {
    section: 'Weather Conditions',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: weatherSnapshots.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatOddsContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Betting Odds',
      content: 'No odds data available.',
      attribution: [],
    }
  }

  const odds = context.data
  const content = odds
    .slice(0, 15)
    .map(
      (o: any) => `
- ${o.selection}
  Decimal Odds: ${o.decimalOdds}
  American Odds: ${o.americanOdds}
  Implied Probability: ${(o.impliedProbability * 100).toFixed(1)}%
  Bookmaker: ${o.bookmakerTitle || o.bookmakerKey}
  Market: ${o.market}
  Updated: ${new Date(o.lastUpdate).toLocaleDateString()}
`
    )
    .join('')

  return {
    section: 'Betting Odds & Markets',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: odds.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatDFSContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'DFS Ownership',
      content: 'No DFS ownership data available.',
      attribution: [],
    }
  }

  const dfsData = context.data
  const content = dfsData
    .slice(0, 12)
    .map(
      (d: any) => `
- ${d.player?.fullName || `${d.player?.firstName} ${d.player?.lastName}`}
  Projected Ownership: ${(d.projectedOwnership * 100).toFixed(1)}%
  ${d.actualOwnership ? `Actual Ownership: ${(d.actualOwnership * 100).toFixed(1)}%` : ''}
  Contest: ${d.dfsContest?.contestName || 'Unknown'}
  Tournament: ${d.dfsContest?.tournament?.name || 'Unknown'}
`
    )
    .join('')

  return {
    section: 'DFS Ownership Data',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: dfsData.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatSalaryContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'DFS Salaries',
      content: 'No salary data available.',
      attribution: [],
    }
  }

  const salaries = context.data
  const content = salaries
    .slice(0, 15)
    .map(
      (s: any) => `
- ${s.player?.fullName || `${s.player?.firstName} ${s.player?.lastName}`}
  Salary: $${s.salary?.toLocaleString()}
  Operator: ${s.operator}
  Slate: ${s.slateId || 'N/A'}
  Tournament: ${s.tournament?.name || 'Unknown'}
`
    )
    .join('')

  return {
    section: 'DFS Salaries',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: salaries.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatProjectionContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Fantasy Projections',
      content: 'No projection data available.',
      attribution: [],
    }
  }

  const projections = context.data
  const content = projections
    .slice(0, 12)
    .map(
      (p: any) => `
- ${p.player?.fullName || `${p.player?.firstName} ${p.player?.lastName}`}
  DraftKings: ${p.fantasyPointsDraftKings?.toFixed(1)} pts
  FanDuel: ${p.fantasyPointsFanDuel?.toFixed(1)} pts
  Tournament: ${p.tournament?.name || 'Unknown'}
  Available: ${p.available ? 'Yes' : 'No'}
`
    )
    .join('')

  return {
    section: 'Fantasy Point Projections',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: projections.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatPlayerHistoryContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Player History',
      content: 'No player history available.',
      attribution: [],
    }
  }

  const outcomes = context.data
  const content = outcomes
    .slice(0, 10)
    .map(
      (o: any) => `
- ${o.player?.fullName}
  Tournament: ${o.tournament?.name}
  Finish: ${o.finishPosition || 'N/A'} (Score: ${o.scoreTopar > 0 ? '+' : ''}${o.scoreTopar})
  Status: ${o.cutStatus || 'Completed'}
  DK Fantasy: ${o.dkFantasyPoints?.toFixed(1)} | FD: ${o.fdFantasyPoints?.toFixed(1)}
`
    )
    .join('')

  return {
    section: 'Recent Player Results',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: outcomes.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatCourseContext(context: RetrievedContext | undefined): ContextBlock {
  if (!context || !context.data || context.data.length === 0) {
    return {
      section: 'Course Data',
      content: 'No course data available.',
      attribution: [],
    }
  }

  const courses = context.data
  const content = courses
    .slice(0, 5)
    .map((c: any) => {
      const specs = c.specifications?.[0]
      const analytics = c.analytics?.[0]
      return `
- ${c.name}
  Location: ${c.city}, ${c.stateProvince}
  Par: ${specs?.par || c.par}, Yardage: ${specs?.totalYardage || c.yardage}
  Difficulty: ${specs?.difficultyRating?.toFixed(1) || 'N/A'} | Slope: ${specs?.slopeRating || 'N/A'}
  Avg Score: ${analytics?.averageScoreToPar?.toFixed(1) || 'N/A'} | Birdie Rate: ${analytics?.historicalBirdieRate?.toFixed(1)}%
`
    })
    .join('')

  return {
    section: 'Course Characteristics',
    content,
    attribution: [
      {
        source: context.source,
        confidence: context.confidence,
        dataPoints: courses.length,
        retrievedAt: context.timestamp,
      },
    ],
  }
}

function formatBlockWithAttribution(block: ContextBlock): string {
  const attributionText =
    block.attribution.length > 0
      ? `\n[Data Sources: ${block.attribution
          .map(
            (a) =>
              `${a.source} (Confidence: ${(a.confidence * 100).toFixed(0)}%, ${a.dataPoints} records)`
          )
          .join(' | ')}]`
      : ''

  return `## ${block.section}

${block.content}${attributionText}`
}

/**
 * Creates a source attribution summary for the LLM
 */
export function createAttributionGuidance(): string {
  return `
DATA SOURCE ATTRIBUTION GUIDE:

When referencing data in your analysis, always include:
1. THE SOURCE: "According to CaddieIQ [source name]..."
2. THE METRIC: "The [specific metric] shows..."
3. THE CONFIDENCE: Indicate confidence level (high/medium/low)
4. THE CONTEXT: "Based on [number] records from [date range]..."

EXAMPLE:
"According to CaddieIQ historical player data (high confidence, 156 tournament records), Scottie McIlroy has averaged 68.4 strokes in tournament play over the past 18 months..."

WHEN DATA IS UNAVAILABLE:
Instead of guessing, state explicitly:
"CaddieIQ data does not currently contain [specific metric] for [player/tournament]. This analysis would benefit from [data type]."

DISTINGUISH BETWEEN:
1. FACTS FROM CADDIEIQ: Always source these (tournament results, salaries, weather, odds, ownership)
2. GENERAL GOLF KNOWLEDGE: Can reference generally (e.g., "Short-game skills matter at courses with small greens")
3. INFERENCE FROM DATA: Explain the reasoning (e.g., "High ownership percentage (87%) suggests the model sees strong value")
4. UNAVAILABLE DATA: Be explicit about what's missing
`
}
