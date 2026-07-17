import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface SkillExplanation {
  band: string
  explanation: string
}

interface SkillImportanceCardsProps {
  skillExplanations: Record<string, SkillExplanation>
}

const SKILL_LABELS: Record<string, { label: string; icon: string }> = {
  driving: { label: 'Driving Distance', icon: '🎯' },
  irons: { label: 'Iron Play', icon: '⛳' },
  shortGame: { label: 'Short Game', icon: '🎪' },
  putting: { label: 'Putting', icon: '⚪' },
  courseManagement: { label: 'Course Management', icon: '🧭' },
}

const BAND_COLORS: Record<string, { stars: number; color: string; label: string }> = {
  low: { stars: 1, color: 'text-slate-400', label: 'Low Importance' },
  medium: { stars: 2, color: 'text-amber-500', label: 'Medium Importance' },
  high: { stars: 3, color: 'text-emerald-500', label: 'High Importance' },
}

export function SkillImportanceCards({ skillExplanations }: SkillImportanceCardsProps) {
  const skills = Object.entries(skillExplanations)

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {skills.map(([key, { band, explanation }]) => {
        const skillInfo = SKILL_LABELS[key]
        const bandInfo = BAND_COLORS[band] || BAND_COLORS.medium

        return (
          <Card key={key} className="flex flex-col gap-3 p-4">
            {/* Skill Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1.5">
                <h4 className="text-sm font-semibold text-foreground">{skillInfo.label}</h4>
                <p className={`text-xs font-medium ${bandInfo.color}`}>{bandInfo.label}</p>
              </div>
              <span className="text-lg">{skillInfo.icon}</span>
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${
                    i < bandInfo.stars
                      ? `fill-current ${bandInfo.color}`
                      : 'text-muted-foreground'
                  }`}
                  aria-hidden
                />
              ))}
            </div>

            {/* Explanation */}
            <p className="text-xs leading-relaxed text-muted-foreground">{explanation}</p>
          </Card>
        )
      })}
    </div>
  )
}
