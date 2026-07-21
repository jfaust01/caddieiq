import { convertToModelMessages, streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import prisma from '@/lib/prisma'

const systemPrompt = `You are an expert AI Golf Analyst powered by CaddieIQ historical data. Your role is to provide deep, data-driven insights about:

- Player projections and rankings
- Historical performance patterns
- Weather impact analysis
- Betting odds and line movements
- Daily Fantasy Sports (DFS) ownership and value
- Salary correlation analysis
- Course fit and historical performance
- Ownership percentages and positioning
- Risk assessment and lineup optimization

IMPORTANT: Always reference actual CaddieIQ platform data in your responses. When discussing:
- Players: Reference their historical performance, course history, and current projections
- Weather: Discuss actual temperature, wind, humidity data from the platform
- Odds: Reference actual betting lines and market sentiment from the platform
- DFS: Reference actual ownership percentages, salary data, and value calculations
- Trends: Support claims with data from the platform

For questions about:
1. Player comparisons: Compare their stats, course history, current form
2. Value plays: Analyze salary, ownership, and projected performance
3. Weather impact: Explain how conditions favor certain playing styles
4. Ownership: Discuss projected ownership and positioning opportunities
5. Lineups: Explain roster construction, balance, and risk/reward
6. Course fit: Reference historical data at similar courses

Format your responses clearly with:
- Direct answer to the question
- Supporting data from the platform
- Key statistics or metrics
- Risk factors (if applicable)
- Confidence level (high/medium/low)

Always be specific with numbers and reference actual tournament/player/course data.`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const modelMessages = convertToModelMessages(messages)

    // Fetch relevant context from the platform
    const context = await gatherAnalystContext()

    const response = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: `${systemPrompt}\n\nCurrent Platform Context:\n${context}`,
      messages: modelMessages,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return response.toDataStreamResponse()
  } catch (error) {
    console.error('[Analyst API] Error:', error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate response',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

async function gatherAnalystContext(): Promise<string> {
  try {
    const [tournaments, players, weatherData, oddsData] = await Promise.all([
      prisma.tournament.findMany({
        take: 3,
        orderBy: { startDate: 'desc' },
        select: { id: true, name: true, startDate: true, location: true },
      }),
      prisma.player.findMany({
        take: 5,
        orderBy: { firstName: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          worldRanking: true,
        },
      }),
      prisma.weatherSnapshot
        .findMany({
          take: 10,
          orderBy: { capturedAt: 'desc' },
          select: {
            temperature: true,
            windSpeed: true,
            condition: true,
          },
        })
        .catch(() => []),
      prisma.oddsQuote
        .findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            selection: true,
            decimalOdds: true,
            impliedProbability: true,
          },
        })
        .catch(() => []),
    ])

    return `
Recent Tournaments:
${tournaments
  .map((t) => `- ${t.name} (${t.location}, ${new Date(t.startDate).toLocaleDateString()})`)
  .join('\n')}

Top Players:
${players
  .map((p) => `- ${p.firstName} ${p.lastName} (Ranking: ${p.worldRanking || 'N/A'})`)
  .join('\n')}

Recent Weather:
${weatherData.length > 0 ? weatherData.map((w) => `- ${w.temperature}°F, Wind: ${w.windSpeed}mph, ${w.condition}`).join('\n') : 'No recent weather data'}

Recent Odds:
${oddsData.length > 0 ? oddsData.map((o) => `- ${o.selection}: ${o.decimalOdds} (${(o.impliedProbability * 100).toFixed(1)}%)`).join('\n') : 'No recent odds data'}
`
  } catch (error) {
    console.error('[Analyst] Error gathering context:', error)
    return 'Unable to gather platform context at this time.'
  }
}
