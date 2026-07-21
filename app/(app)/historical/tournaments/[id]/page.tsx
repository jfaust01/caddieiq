import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TournamentDetailView } from '@/features/historical/components/tournament-detail-view'
import prismaClient from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const tournament = await prismaClient.tournament.findUnique({
    where: { id: params.id },
    select: { name: true, startDate: true },
  })

  if (!tournament) {
    return { title: 'Tournament Not Found' }
  }

  return {
    title: `${tournament.name} — Historical Tournament`,
    description: `Historical data, weather, odds, and DFS context for ${tournament.name}`,
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const tournament = await prismaClient.tournament.findUnique({
    where: { id: params.id },
  })

  if (!tournament) {
    notFound()
  }

  return <TournamentDetailView tournamentId={params.id} />
}
