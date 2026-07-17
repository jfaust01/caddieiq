import { Card } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

interface FantasyTakeawaysProps {
  takeaways: string[]
}

export function FantasyTakeaways({ takeaways }: FantasyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) return null

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Fantasy Takeaways</h3>
      </div>
      <ul className="space-y-2">
        {takeaways.map((takeaway, idx) => (
          <li key={idx} className="text-sm text-foreground/80 leading-relaxed">
            • {takeaway}
          </li>
        ))}
      </ul>
    </Card>
  )
}
