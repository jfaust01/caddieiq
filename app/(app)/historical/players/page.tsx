import { Metadata } from 'next'
import { PageHeader, EmptyState } from '@/features/ui/shared'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Historical Players',
  description: 'Browse historical player statistics, salary history, and performance trends.',
}

export default function HistoricalPlayersPage() {
  return (
    <div className="page-container space-y-6 py-6 md:py-8">
      <PageHeader
        title="Historical Players"
        description="Browse historical player statistics, salary history, and performance trends."
        icon={<Users className="h-6 w-6" />}
      />

      <EmptyState
        title="Historical player profiles coming soon"
        description="Career statistics, salary trends, ownership history, odds history, and weather impact analysis will be available soon."
        icon={<Users className="h-12 w-12" />}
      />
    </div>
  )
}
