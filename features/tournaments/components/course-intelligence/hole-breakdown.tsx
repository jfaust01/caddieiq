import { Card } from '@/components/ui/card'

interface HoleBreakdownProps {
  holes: Array<{
    number: number
    par: number
    yardage: number
    handicap: number
  }> | null
}

export function HoleBreakdown({ holes }: HoleBreakdownProps) {
  if (!holes || holes.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-2">Hole-by-Hole Breakdown</h3>
        <p className="text-xs text-muted-foreground">
          Hole-by-hole course data has not been imported.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Expected source:</strong> GolfCourseAPI / course_holes table<br/>
          <strong>Status:</strong> Awaiting data import
        </p>
      </Card>
    )
  }

  const frontNine = holes.filter((h) => h.number <= 9)
  const backNine = holes.filter((h) => h.number > 9)

  const frontYards = frontNine.reduce((sum, h) => sum + h.yardage, 0)
  const backYards = backNine.reduce((sum, h) => sum + h.yardage, 0)
  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0)
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0)

  return (
    <Card className="p-6 overflow-x-auto">
      <h3 className="text-sm font-semibold mb-4">Hole-by-Hole Breakdown</h3>

      <div className="space-y-6 min-w-max">
        {/* Front Nine */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">FRONT NINE</h4>
            <span className="text-xs font-semibold">
              {frontPar} par • {frontYards.toLocaleString()} yds
            </span>
          </div>
          <div className="grid grid-cols-9 gap-1">
            {frontNine.map((hole) => (
              <div key={hole.number} className="flex flex-col items-center gap-1 text-center text-xs">
                <div className="w-full aspect-square flex items-center justify-center rounded bg-muted font-semibold">
                  {hole.number}
                </div>
                <div className="font-medium">{hole.par}</div>
                <div className="text-muted-foreground">{hole.yardage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Nine */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">BACK NINE</h4>
            <span className="text-xs font-semibold">
              {backPar} par • {backYards.toLocaleString()} yds
            </span>
          </div>
          <div className="grid grid-cols-9 gap-1">
            {backNine.map((hole) => (
              <div key={hole.number} className="flex flex-col items-center gap-1 text-center text-xs">
                <div className="w-full aspect-square flex items-center justify-center rounded bg-muted font-semibold">
                  {hole.number}
                </div>
                <div className="font-medium">{hole.par}</div>
                <div className="text-muted-foreground">{hole.yardage}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
