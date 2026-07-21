import { Metadata } from 'next'
import { PageHeader } from '@/features/ui/shared'
import { Flag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tournament Replay',
  description: 'Reconstruct tournaments with historical salaries, odds, weather, and DFS context.',
}

export default function HistoricalReplayPage() {
  return (
    <div className="page-container space-y-6 py-6 md:py-8">
      <PageHeader
        title="Tournament Replay"
        description="Reconstruct tournaments exactly as they existed before lock with complete historical context."
        icon={<Flag className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Historical Salaries</h3>
          <p className="text-sm text-muted-foreground">DraftKings salary tiers from tournament day</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Live Weather</h3>
          <p className="text-sm text-muted-foreground">Wind, temperature, and course conditions by round</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Opening Odds</h3>
          <p className="text-sm text-muted-foreground">Tournament winner and prop market prices</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Ownership Data</h3>
          <p className="text-sm text-muted-foreground">Historical player ownership percentages</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Round-by-round scoring and position</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Value Analysis</h3>
          <p className="text-sm text-muted-foreground">Salary vs finish and ownership vs finish</p>
        </div>
      </div>

      <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
        <p>Full tournament replay UI and analysis tools coming soon.</p>
      </div>
    </div>
  )
}
