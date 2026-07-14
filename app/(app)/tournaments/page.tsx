import type { Metadata } from 'next'

import { TournamentsView } from '@/features/tournaments/tournaments-view'

export const metadata: Metadata = {
  title: 'Tournaments',
  description: 'Schedule, fields, and event context for upcoming tournaments.',
}

export default function TournamentsPage() {
  return <TournamentsView />
}
