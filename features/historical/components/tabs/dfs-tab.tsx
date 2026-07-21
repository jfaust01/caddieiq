import { Card } from '@/components/ui/card'

interface DfsTabProps {
  tournament: any
}

export function DfsTab({ tournament }: DfsTabProps) {
  const contests = tournament.dfsContests || []

  if (contests.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No DFS contest data available for this tournament
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contests.map((contest: any, idx: number) => (
        <Card key={idx} className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold">{contest.contestName || 'Contest'}</h4>
            <p className="text-sm text-muted-foreground capitalize">{contest.operator}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {contest.fieldSize && (
              <div>
                <p className="text-muted-foreground">Field Size</p>
                <p className="font-medium">{contest.fieldSize}</p>
              </div>
            )}
            {contest.salaryCap && (
              <div>
                <p className="text-muted-foreground">Salary Cap</p>
                <p className="font-medium">${(contest.salaryCap / 1000).toFixed(0)}k</p>
              </div>
            )}
          </div>

          <button className="w-full px-3 py-2 bg-primary/10 text-primary rounded text-sm font-medium hover:bg-primary/20 transition-colors">
            View Ownership
          </button>
        </Card>
      ))}
    </div>
  )
}
