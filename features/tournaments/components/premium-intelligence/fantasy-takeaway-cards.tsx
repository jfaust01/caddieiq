import { Card } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

interface FantasyTakeawayCardsProps {
  takeaways: string[]
}

const TAKEAWAY_ICONS = ['💡', '🎯', '⚙️', '📊', '🔄', '✨']

export function FantasyTakeawayCards({ takeaways }: FantasyTakeawayCardsProps) {
  if (!takeaways || takeaways.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Lightbulb className="size-4 text-amber-500" aria-hidden />
        <p className="text-sm font-semibold text-foreground">DFS Takeaways</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {takeaways.map((takeaway, idx) => (
          <Card key={idx} className="p-3 flex gap-3">
            <div className="flex-shrink-0 text-lg">{TAKEAWAY_ICONS[idx % TAKEAWAY_ICONS.length]}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{takeaway}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
