import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface IdealPlayerProfileProps {
  bestFits: string[] | null
  potentialFades: string[] | null
}

export function IdealPlayerProfile({ bestFits, potentialFades }: IdealPlayerProfileProps) {
  if (!bestFits && !potentialFades) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bestFits && bestFits.length > 0 && (
        <Card className="p-6 border-emerald-500/30 bg-emerald-500/5">
          <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Best Fits</h3>
          <div className="space-y-2">
            {bestFits.map((fit) => (
              <div key={fit} className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">{fit}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {potentialFades && potentialFades.length > 0 && (
        <Card className="p-6 border-red-500/30 bg-red-500/5">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">Consider Fading</h3>
          <div className="space-y-2">
            {potentialFades.map((fade) => (
              <div key={fade} className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-red-500" />
                <span className="text-sm font-medium">{fade}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
