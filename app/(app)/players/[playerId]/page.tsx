import type { Metadata } from 'next'

import { PlayerDetailView } from '@/features/players/player-detail-view'
import { playerService } from '@/features/players/services/player-service'

interface PlayerDetailPageProps {
  params: Promise<{ playerId: string }>
}

export async function generateMetadata({
  params,
}: PlayerDetailPageProps): Promise<Metadata> {
  const { playerId } = await params

  try {
    const player = await playerService.getPlayerById(playerId)

    if (!player) {
      return {
        title: 'Player not found',
        description: 'This player could not be located in the CaddieIQ universe.',
      }
    }

    return {
      title: player.fullName,
      description: `Profile, statistics, and recent form for ${player.fullName}.`,
    }
  } catch {
    // Never let a transient database error break metadata generation.
    return {
      title: 'Player profile',
      description: 'Profile, statistics, and recent form.',
    }
  }
}

export default async function PlayerDetailPage({
  params,
}: PlayerDetailPageProps) {
  const { playerId } = await params
  return <PlayerDetailView playerId={playerId} />
}
