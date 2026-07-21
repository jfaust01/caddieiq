import { Metadata } from 'next'
import { HistoricalTournamentsView } from '@/features/historical/components/tournaments-explorer'
import { PageHeader } from '@/features/ui/shared'
import { History } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Historical Tournaments',
  description: 'Browse and replay complete historical tournament data with weather, odds, and DFS context.',
}

export default function HistoricalTournamentsPage() {
  return (
    <div className="page-container space-y-6 py-6 md:py-8">
      <PageHeader
        title="Historical Tournaments"
        description="Browse and replay complete tournament data with weather, odds, and DFS context."
        icon={<History className="h-6 w-6" />}
      />
      <HistoricalTournamentsView />
    </div>
  )
}
