import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Archetype {
  name: string
  why: string
}

interface PlayerArchetypeListProps {
  bestFits: Archetype[]
  potentialFades: Archetype[]
}

export function PlayerArchetypeList({
  bestFits,
  potentialFades,
}: PlayerArchetypeListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Best Fits */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="size-4 text-emerald-500" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">Best Fits</h3>
        </div>

        <div className="space-y-2">
          {bestFits.map((archetype, idx) => (
            <Card
              key={idx}
              className="p-3 border-emerald-500/20 bg-emerald-500/5"
            >
              <p className="text-sm font-medium text-foreground">
                {archetype.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {archetype.why}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Potential Fades */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <TrendingDown className="size-4 text-red-500" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">Consider Fading</h3>
        </div>

        <div className="space-y-2">
          {potentialFades.map((archetype, idx) => (
            <Card
              key={idx}
              className="p-3 border-red-500/20 bg-red-500/5"
            >
              <p className="text-sm font-medium text-foreground">
                {archetype.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {archetype.why}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
