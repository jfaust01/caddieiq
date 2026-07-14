import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CareerSummary as CareerSummaryData } from '@/features/players/types'

interface CareerSummaryProps {
  summary: CareerSummaryData
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-4 py-3">
      <span className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/** Career headline figures. Placeholder values until live data is connected. */
export function CareerSummary({ summary }: CareerSummaryProps) {
  const cutRate =
    summary.cutsPossible > 0
      ? `${Math.round((summary.cutsMade / summary.cutsPossible) * 100)}%`
      : '—'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Figure label="Events played" value={`${summary.events}`} />
        <Figure label="Wins" value={`${summary.wins}`} />
        <Figure label="Top 10s" value={`${summary.topTens}`} />
        <Figure label="Cuts made" value={`${summary.cutsMade}`} />
        <Figure label="Cut rate" value={cutRate} />
        <Figure label="Best finish" value={summary.bestFinish} />
        <Figure label="Career earnings" value={summary.careerEarnings} />
      </CardContent>
    </Card>
  )
}
