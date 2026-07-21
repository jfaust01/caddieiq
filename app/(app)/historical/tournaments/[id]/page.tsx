import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prismaClient from '@/lib/prisma'
import TournamentAnalyticsDashboard from '@/features/analytics/components/tournament-analytics-dashboard'

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
    title: `${tournament.name} — Analytics Dashboard`,
    description: `AI-powered analytics, player comparisons, and historical data for ${tournament.name}`,
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

  return <TournamentAnalyticsDashboard tournamentId={params.id} />
}
