import { getCurrentWeekSlateAnalysis } from '@/features/slate-analysis/services/slate-orchestration-service'

export async function GET() {
  try {
    const report = await getCurrentWeekSlateAnalysis()

    if (!report) {
      return new Response(
        JSON.stringify({
          error: 'No active tournament found for this week',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Slate Analysis API] Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate slate analysis',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
