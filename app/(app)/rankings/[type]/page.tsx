import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RankingsView } from '@/features/rankings/rankings-view'
import { getRankingView } from '@/features/rankings/services/rankings-service'
import { rankingTypeFromSlug } from '@/features/rankings/categories'

interface RankingTypePageProps {
  params: Promise<{ type: string }>
}

export async function generateMetadata({
  params,
}: RankingTypePageProps): Promise<Metadata> {
  const { type } = await params
  const option = rankingTypeFromSlug(type)
  if (!option) return { title: 'Rankings' }
  return {
    title: `${option.label} Rankings`,
    description: option.description,
  }
}

export default async function RankingTypePage({ params }: RankingTypePageProps) {
  const { type } = await params
  // Only real engine categories are valid routes; unknown slugs 404 rather than
  // silently falling back, so links stay honest.
  if (!rankingTypeFromSlug(type)) notFound()
  const view = await getRankingView(type)
  return <RankingsView view={view} />
}
