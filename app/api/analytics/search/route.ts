import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return Response.json({ data: [] })
  }

  try {
    const [players, courses, tournaments] = await Promise.all([
      prisma.player.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      prisma.course.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      prisma.tournament.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 10,
      }),
    ])

    const results = [
      ...players.map((p) => ({
        id: p.id,
        type: 'player' as const,
        name: `${p.firstName} ${p.lastName}`,
        description: p.worldRanking ? `World Ranking: #${p.worldRanking}` : undefined,
        href: `/analytics/players/${p.id}`,
      })),
      ...courses.map((c) => ({
        id: c.id,
        type: 'course' as const,
        name: c.name,
        description: `${c.city}, ${c.state}`,
        href: `/analytics/courses/${c.id}`,
      })),
      ...tournaments.map((t) => ({
        id: t.id,
        type: 'tournament' as const,
        name: t.name,
        description: t.location,
        href: `/historical/tournaments/${t.id}`,
      })),
    ]

    return Response.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('[Search] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
