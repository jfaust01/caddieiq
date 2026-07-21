import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Historical Trends',
  description: 'Analyze historical patterns across tournaments and players.',
}

export default function HistoricalTrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historical Trends</h1>
        <p className="text-muted-foreground mt-2">
          Analyze historical patterns and correlations across tournaments and players.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Salary vs Finish</h3>
          <p className="text-sm text-muted-foreground">Average salary by tournament placement across all events</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Ownership vs Finish</h3>
          <p className="text-sm text-muted-foreground">Player ownership percentage correlation with finish position</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Odds vs Finish</h3>
          <p className="text-sm text-muted-foreground">Opening odds accuracy for tournament winners</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Wind vs Scoring</h3>
          <p className="text-sm text-muted-foreground">Course difficulty impact based on historical wind data</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Course History</h3>
          <p className="text-sm text-muted-foreground">Tournament-specific patterns and player performance by venue</p>
        </div>
        <div className="p-6 border border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Player Trends</h3>
          <p className="text-sm text-muted-foreground">Individual player performance trends over time</p>
        </div>
      </div>

      <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
        <p>Interactive charts and trend analysis tools coming soon.</p>
      </div>
    </div>
  )
}
