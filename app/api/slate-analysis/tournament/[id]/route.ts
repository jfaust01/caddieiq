import { generateSlateAnalysis } from '@/features/slate-analysis/services/slate-orchestration-service'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const report = await generateSlateAnalysis(params.id)

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
