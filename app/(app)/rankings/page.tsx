import type { Metadata } from 'next'

import { RankingsView } from '@/features/rankings/rankings-view'

export const metadata: Metadata = {
  title: 'Rankings',
  description: 'Live leaderboards driven by your deployed models.',
}

export default function RankingsPage() {
  return <RankingsView />
}
