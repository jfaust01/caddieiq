import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: {
        matchScores: { take: 30, orderBy: { tournament: { startDate: 'desc' } } },
      },
    })

    if (!player) {
      return Response.json({ error: 'Player not found' }, { status: 404 })
    }

    // Calculate statistics
    const matchScores = player.matchScores || []
    const cutsMode = matchScores.filter((m) => m.position && m.position < 100).length
    const totalEvents = matchScores.length
    const cutRate = (cutsMode / totalEvents) * 100
    const avgFinish = matchScores.reduce((sum, m) => sum + (m.position || 999), 0) / totalEvents
    const wins = matchScores.filter((m) => m.position === 1).length
    const top10s = matchScores.filter((m) => (m.position || 999) <= 10).length

    const stats = {
      cutsModel: cutRate.toFixed(1),
      avgFinish: avgFinish.toFixed(1),
      wins,
      top10s,
      golfEvents: totalEvents,
    }

    return Response.json({
      success: true,
      data: {
        player: {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          worldRanking: player.worldRanking,
          handicap: player.handicap,
        },
        stats,
      },
    })
  } catch (error) {
    console.error('[Player API] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch player data' },
      { status: 500 }
    )
  }
}
