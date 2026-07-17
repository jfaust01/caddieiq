import type { Metadata } from 'next'

import { RankingsView } from '@/features/rankings/rankings-view'
import { getRankingView } from '@/features/rankings/services/rankings-service'
import { DEFAULT_RANKING_TYPE } from '@/features/rankings/categories'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rankings',
  description: "CaddieIQ's leaderboards, ordered by the same season-normalized analytics shown across the platform.",
}

export default async function RankingsPage() {
  const view = await getRankingView(DEFAULT_RANKING_TYPE.slug)
  return <RankingsView view={view} />
}
