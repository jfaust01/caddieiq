import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TournamentCommandCenter } from '@/features/tournaments/command-center/tournament-command-center'
import { TournamentBreadcrumbProvider } from '@/features/tournaments/tournament-breadcrumb-provider'
import { tournamentService } from '@/features/tournaments/services/tournament-service'

interface TournamentDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: TournamentDetailPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const tournament = await tournamentService.getTournamentByName(slug)

    if (!tournament) {
      return {
        title: 'Tournament not found',
        description: 'This tournament could not be located in the CaddieIQ schedule.',
      }
    }

    return {
      title: tournament.name,
      description: `Schedule, venue, and event context for ${tournament.name}.`,
    }
  } catch {
    // Never let a transient database error break metadata generation.
    return {
      title: 'Tournament',
      description: 'Schedule, venue, and event context.',
    }
  }
}

export default async function TournamentDetailPage({
  params,
}: TournamentDetailPageProps) {
  const { slug } = await params
  const tournament = await tournamentService.getTournamentByName(slug)

  // Invalid or unknown slug → proper HTTP 404 via the nearest not-found boundary.
  if (!tournament) {
    notFound()
  }

  return (
    <TournamentBreadcrumbProvider tournament={tournament}>
      <TournamentCommandCenter tournament={tournament} />
    </TournamentBreadcrumbProvider>
  )
}
