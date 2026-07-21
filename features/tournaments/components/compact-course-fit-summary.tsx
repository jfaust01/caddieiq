'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { FieldLeader } from '@/features/tournaments/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TournamentTopCourseFits } from './tournament-top-course-fits'

interface CompactCourseFitSummaryProps {
  /** Real ranking data from field.rankingLeaders.topRanked */
  leaders: FieldLeader[] | undefined
}

/**
 * Compact course fit summary showing top 5 ranked players.
 * Uses real field ranking data only — no invented scores or traits.
 *
 * Data source: field.rankingLeaders.topRanked (FieldLeader[])
 */
export function CompactCourseFitSummary({ leaders }: CompactCourseFitSummaryProps) {
  return <TournamentTopCourseFits leaders={leaders} />
}
