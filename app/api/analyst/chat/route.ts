import { convertToModelMessages, streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import {
  retrieveAnalystContext,
  analyzeQueryIntent,
} from '@/features/analyst/services/data-retrieval-service'
import { buildContextPrompt, createAttributionGuidance } from '@/features/analyst/services/context-builder'

const systemPrompt = `You are CaddieIQ's AI Golf Analyst - a data-driven expert who provides analysis GROUNDED IN HISTORICAL DATA.

YOUR CORE RESPONSIBILITY:
Analyze questions using ONLY retrieved CaddieIQ data, distinguishing clearly between:
1. FACTS FROM CADDIEIQ: Tournament results, salaries, weather, odds, ownership (cite these)
2. GENERAL GOLF KNOWLEDGE: Context when relevant (e.g., "Firm greens favor aggressive ball strikers")
3. INFERENCES FROM DATA: Show your reasoning (e.g., "87% ownership suggests strong model conviction")
4. UNAVAILABLE DATA: Be explicit (e.g., "CaddieIQ does not have real-time swing speed data for this player")

RESPONSE STRUCTURE:
1. Direct answer to the user's question
2. Supporting data with source attribution
3. Key metrics and statistics
4. Confidence level (High/Medium/Low)
5. Data gaps (if applicable)

DATA SOURCE CITATION FORMAT:
"According to CaddieIQ [source] (Confidence: High/Medium, N records), [specific fact]..."

EXAMPLE:
"According to CaddieIQ historical outcomes (156 tournament records), Scottie McIlroy has cut 94% of courses with Par 4 handicaps under 10, suggesting strong consistency in moderately difficult setups."

ANALYSIS CAPABILITIES:
✓ Player comparisons with historical data
✓ Value play identification (salary vs. projection)
✓ Weather impact (correlation with scoring patterns)
✓ Ownership analysis (over/under detection)
✓ Course fit (historical performance at similar tracks)
✓ DFS positioning (salary cap allocation)
✓ Risk assessment (downside scenarios)

CRITICAL RULES:
- NEVER guess or hallucinate data
- ALWAYS specify confidence levels
- ALWAYS cite data sources
- ALWAYS distinguish CaddieIQ data from general knowledge
- When data is missing, SAY SO explicitly
- Support claims with specific numbers and time periods

${createAttributionGuidance()}`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Get the last user message to understand query intent
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    // Retrieve relevant data based on query
    const analystContext = await retrieveAnalystContext(lastUserMessage)

    // Build context prompt with source attribution
    const contextPrompt = buildContextPrompt(analystContext)

    // Get needed data sources
    const neededSources = await analyzeQueryIntent(lastUserMessage)

    const modelMessages = convertToModelMessages(messages)

    const response = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: `${systemPrompt}

## RETRIEVED CADDIEIQ DATA FOR THIS QUERY

Sources Being Used: ${neededSources.join(', ')}

${contextPrompt}

---

NOW ANSWER THE USER'S QUESTION USING ONLY THE ABOVE DATA. Be specific with metrics and always cite sources.`,
      messages: modelMessages,
      temperature: 0.7,
      maxTokens: 2500,
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
