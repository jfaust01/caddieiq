import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RankingsView } from '@/features/rankings/rankings-view'
import { getRankingView } from '@/features/rankings/services/rankings-service'
import {
  getRankingDefinition,
  listRankingTypes,
  type RankingType,
} from '@/lib/ranking'

interface RankingTypePageProps {
  params: Promise<{ type: string }>
}

function isRankingType(value: string): value is RankingType {
  return (listRankingTypes() as string[]).includes(value)
}

export async function generateMetadata({
  params,
}: RankingTypePageProps): Promise<Metadata> {
  const { type } = await params
  if (!isRankingType(type)) return { title: 'Rankings' }
  const definition = getRankingDefinition(type)
  return {
    title: `${definition.label} Rankings`,
    description: definition.description,
  }
}

export default async function RankingTypePage({
  params,
}: RankingTypePageProps) {
  const { type } = await params
  if (!isRankingType(type)) notFound()
  const initialView = await getRankingView(type)
  return <RankingsView type={type} initialView={initialView} />
}
