import type { Metadata } from 'next'

import { AnalyticsView } from '@/features/analytics/analytics-view'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Explore performance trends and model insights.',
}

export default function AnalyticsPage() {
  return <AnalyticsView />
}
