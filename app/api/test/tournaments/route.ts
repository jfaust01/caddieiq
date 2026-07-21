import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      take: 5,
      orderBy: {
        startDate: 'desc',
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        status: true,
        _count: {
          select: {
            fields: true,
            courses: true,
          },
        },
      },
    })

    if (tournaments.length === 0) {
      return Response.json({ error: 'No tournaments found', status: 'EMPTY' }, { status: 404 })
    }

    return Response.json(tournaments)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: errorMsg }, { status: 500 })
  }
}
