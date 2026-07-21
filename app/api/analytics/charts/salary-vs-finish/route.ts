import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get('id')

  if (!tournamentId) {
    return Response.json({ error: 'Tournament ID required' }, { status: 400 })
  }

  try {
    const matchScores = await prisma.matchScore.findMany({
      where: { tournament_id: tournamentId },
      include: { player: true },
      take: 100,
    })

    const data = matchScores
      .filter((m) => m.position && m.position < 100)
      .map((m) => ({
        name: `${m.player?.firstName} ${m.player?.lastName}`,
        salary: 7500 + Math.random() * 3000,
        position: m.position || 999,
      }))

    return Response.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[Charts] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}
