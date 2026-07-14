import type { Metadata } from 'next'

import { RankingsView } from '@/features/rankings/rankings-view'
import { getRankingView } from '@/features/rankings/services/rankings-service'

export const metadata: Metadata = {
  title: 'Rankings',
  description: 'Live leaderboards driven by your deployed models.',
}

export default async function RankingsPage() {
  const initialView = await getRankingView('overall')
  return <RankingsView type="overall" initialView={initialView} />
}
