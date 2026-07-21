import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tournament Replay',
  description: 'Reconstruct tournaments with historical salaries, odds, weather, and DFS context.',
}

export default function HistoricalReplayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tournament Replay</h1>
        <p className="text-muted-foreground mt-2">
          Reconstruct tournaments exactly as they existed before lock with complete historical context.
        </p>
      </div>

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
