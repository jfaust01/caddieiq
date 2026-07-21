import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Historical Players',
  description: 'Browse historical player statistics, salary history, and performance trends.',
}

export default function HistoricalPlayersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historical Players</h1>
        <p className="text-muted-foreground mt-2">
          Browse historical player statistics, salary history, and performance trends.
        </p>
      </div>

      <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
        <p>Historical player profiles with complete statistical records coming soon.</p>
        <p className="mt-2 text-sm">Features include: career statistics, salary trends, ownership history, odds history, and weather impact analysis.</p>
      </div>
    </div>
  )
}
