import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TournamentCommandCenter } from '@/features/tournaments/command-center/tournament-command-center'
import { TournamentBreadcrumbProvider } from '@/features/tournaments/tournament-breadcrumb-provider'
import { tournamentService } from '@/features/tournaments/services/tournament-service'

interface TournamentDetailPageProps {
  params: Promise<{ tournamentId: string }>
}

export async function generateMetadata({
  params,
}: TournamentDetailPageProps): Promise<Metadata> {
  const { tournamentId } = await params

  try {
    // Try to look up by name first (URL-friendly format), then fall back to ID for backward compatibility
    let tournament = await tournamentService.getTournamentByName(tournamentId)
    if (!tournament) {
      tournament = await tournamentService.getTournamentById(tournamentId)
    }

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
  const { tournamentId } = await params
  
  // Try to look up by name first (URL-friendly format), then fall back to ID for backward compatibility
  let tournament = await tournamentService.getTournamentByName(tournamentId)
  if (!tournament) {
    tournament = await tournamentService.getTournamentById(tournamentId)
  }

  // Invalid or unknown tournament name/ID → proper HTTP 404 via the nearest not-found boundary.
  if (!tournament) {
    notFound()
  }

  return (
    <TournamentBreadcrumbProvider tournament={tournament}>
      <TournamentCommandCenter tournament={tournament} />
    </TournamentBreadcrumbProvider>
  )
}
