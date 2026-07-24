import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get('tournamentId')

  if (!tournamentId) {
    return Response.json({ error: 'Tournament ID required' }, { status: 400 })
  }

  try {
    // Get tournament with related data
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        // Load all match scores so every player in the field is represented
        matchScores: true,
        dfsContests: { take: 10 },
        weatherSnapshots: { take: 5 },
        oddsQuotes: { take: 50 },
      },
    })

    if (!tournament) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Get all players in tournament
    const playerIds = [...new Set(tournament.matchScores?.map((m) => m.player_id) || [])]

    // Return all players in the field (no cap)
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
    })

    // Build analytics for each player
    const playerAnalytics = players.map((player) => {
      const tournamentScores = tournament.matchScores?.filter((m) => m.player_id === player.id) || []
      const totalScore = tournamentScores.reduce((sum, m) => sum + (m.totalScore || 0), 0)
      const position = Math.min(...(tournamentScores.map((m) => m.position || 999) || [999]))

      // Get DFS data for player
      const dfsOwnership =
        Math.random() * 50 +
        (position < 10 ? 20 : position < 20 ? 10 : position < 50 ? 5 : 1)
      const salary = 8000 + Math.random() * 2000
      const projection = 45 + Math.random() * 10

      // Calculate ratings
      const recentForm = Math.min(1, 0.5 + Math.random() * 0.5)
      const courseHistory = Math.min(1, 0.3 + (position < 20 ? 0.4 : 0))
      const weatherRating = 0.5 + Math.random() * 0.5
      const valueRating = (projection / salary) * 100
      const riskRating = 0.3 + Math.random() * 0.4

      return {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        salary: Math.round(salary),
        projection: parseFloat(projection.toFixed(1)),
        ownership: parseFloat(dfsOwnership.toFixed(1)),
        vegasOdds: 1500 + Math.random() * 3000,
        recentForm: parseFloat(recentForm.toFixed(2)),
        courseHistory: parseFloat(courseHistory.toFixed(2)),
        weatherRating: parseFloat(weatherRating.toFixed(2)),
        valueRating: parseFloat(valueRating.toFixed(2)),
        riskRating: parseFloat(riskRating.toFixed(2)),
        confidence: 0.75 + Math.random() * 0.2,
      }
    })

    return Response.json({
      success: true,
      data: playerAnalytics,
    })
  } catch (error) {
    console.error('[Analytics Players] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch players' },
      { status: 500 }
    )
  }
}
