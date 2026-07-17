import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CourseDifficultyExpandedProps {
  difficulty: number
  skillExplanations: Record<string, { band: string; explanation: string }>
}

const DIFFICULTY_BANDS = [
  { min: 0, max: 2, label: 'Easy', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { min: 2, max: 4, label: 'Moderate', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { min: 4, max: 7, label: 'Difficult', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { min: 7, max: 10, label: 'Very Difficult', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
]

export function CourseDifficultyExpanded({
  difficulty,
  skillExplanations,
}: CourseDifficultyExpandedProps) {
  const band = DIFFICULTY_BANDS.find((b) => difficulty >= b.min && difficulty <= b.max) || DIFFICULTY_BANDS[2]
  const highSkills = Object.entries(skillExplanations)
    .filter(([, { band }]) => band === 'high')
    .map(([key]) => key)

  return (
    <div className="space-y-4">
      {/* Main Difficulty Meter */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Overall Difficulty</p>
              <p className="text-4xl font-bold text-foreground">{difficulty.toFixed(1)}</p>
              <p className={`text-xs font-semibold ${band.color}`}>{band.label}</p>
            </div>
            
            {/* Meter Bar */}
            <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className={`h-full rounded-lg transition-all ${
                  difficulty < 2.5 ? 'bg-emerald-500' :
                  difficulty < 4.5 ? 'bg-blue-500' :
                  difficulty < 7 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(difficulty / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Scale Reference */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
            {DIFFICULTY_BANDS.map((b) => (
              <div key={b.label} className="text-center">
                <p className={`text-xs font-medium ${b.color}`}>{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.min}-{b.max}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Key Difficulty Factors */}
      {highSkills.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3">What Makes This Course Difficult</p>
          <div className="flex flex-wrap gap-2">
            {highSkills.map((skill) => {
              const skillLabels: Record<string, string> = {
                driving: 'Demands Driving Accuracy',
                irons: 'Requires Iron Precision',
                shortGame: 'Punishes Approach Misses',
                putting: 'Tests Putting Skill',
                courseManagement: 'Variable Conditions',
              }
              return (
                <Badge key={skill} variant="secondary">
                  {skillLabels[skill] || skill}
                </Badge>
              )
            })}
          </div>
        </Card>
      )}

      {/* Strategy Note */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {difficulty > 7
            ? 'This is a very challenging course that will test all aspects of your game. Target consistent, well-rounded performers rather than specialists.'
            : difficulty > 4
            ? 'This course presents a balanced test. Build a lineup that excels in multiple areas rather than relying on specialists.'
            : 'This is a relatively friendly course for scoring. Prioritize players in great form who can take advantage of scoring opportunities.'}
        </p>
      </Card>
    </div>
  )
}
