import { Card } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

interface StrategySummaryProps {
  summary: string
}

export function StrategySummary({ summary }: StrategySummaryProps) {
  return (
    <Card className="p-4 bg-blue-500/5 border-blue-500/20">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <BookOpen className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Strategy Guide</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>
      </div>
    </Card>
  )
}
