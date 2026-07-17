import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CourseDifficultyMeterProps {
  difficulty: number // 0-10
}

function getDifficultyLabel(score: number): string {
  if (score <= 2) return 'Easy'
  if (score <= 4) return 'Moderate'
  if (score <= 7) return 'Difficult'
  return 'Very Difficult'
}

function getDifficultyColor(score: number): string {
  if (score <= 2) return 'from-green-500 to-green-600'
  if (score <= 4) return 'from-yellow-500 to-yellow-600'
  if (score <= 7) return 'from-orange-500 to-orange-600'
  return 'from-red-500 to-red-600'
}

export function CourseDifficultyMeter({ difficulty }: CourseDifficultyMeterProps) {
  const rounded = Math.round(difficulty * 10) / 10
  const percentage = (rounded / 10) * 100

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Course Difficulty</h3>
            <span className="text-lg font-bold text-primary">{rounded.toFixed(1)}/10</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full bg-gradient-to-r transition-all duration-300', getDifficultyColor(rounded))}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {getDifficultyLabel(rounded)} course — {rounded < 3 ? 'Lower scores expected' : rounded < 5 ? 'Average scoring conditions' : rounded < 8 ? 'Higher player variance expected' : 'Elite players will separate from the field'}
        </p>
      </div>
    </Card>
  )
}
