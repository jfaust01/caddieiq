import { Metadata } from 'next'
import { HistoricalTournamentsView } from '@/features/historical/components/tournaments-explorer'

export const metadata: Metadata = {
  title: 'Historical Tournaments',
  description: 'Browse and replay complete historical tournament data with weather, odds, and DFS context.',
}

export default function HistoricalTournamentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historical Tournaments</h1>
        <p className="text-muted-foreground mt-2">
          Browse complete historical tournament data with weather, odds, and DFS context.
        </p>
      </div>
      <HistoricalTournamentsView />
    </div>
  )
}
