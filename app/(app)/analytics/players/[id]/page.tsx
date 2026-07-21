import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import PlayerProfileComponent from '@/features/analytics/components/player-profile'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
  })

  if (!player) {
    return { title: 'Player Not Found' }
  }

  return {
    title: `${player.firstName} ${player.lastName} — Player Profile`,
    description: `Detailed analytics, statistics, and historical performance data`,
  }
}

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
  })

  if (!player) {
    notFound()
  }

  return <PlayerProfileComponent playerId={params.id} />
}
