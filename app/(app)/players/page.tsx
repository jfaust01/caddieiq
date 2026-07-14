import type { Metadata } from 'next'

import { PlayersView } from '@/features/players/players-view'

export const metadata: Metadata = {
  title: 'Players',
  description: 'Browse and manage the player universe that powers your models.',
}

export default function PlayersPage() {
  return <PlayersView />
}
