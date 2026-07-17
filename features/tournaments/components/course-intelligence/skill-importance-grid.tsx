import { Card } from '@/components/ui/card'
import type { CourseProfile } from '@/lib/domain/course'

interface SkillImportanceGridProps {
  profile: CourseProfile | null
}

type ImportanceLevel = 'Critical' | 'High' | 'Medium' | 'Low'

function getImportanceColor(level: ImportanceLevel): string {
  switch (level) {
    case 'Critical':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
    case 'High':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30'
    case 'Medium':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
    case 'Low':
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30'
  }
}

export function SkillImportanceGrid({ profile }: SkillImportanceGridProps) {
  if (!profile) return null

  const skills: Array<{ name: string; emoji: string; importance: ImportanceLevel }> = [
    { name: 'Driving Distance', emoji: '🚀', importance: profile.avgYardage > 7200 ? 'Critical' : 'High' },
    { name: 'Iron Play', emoji: '⛳', importance: profile.avgGreenSize === 'small' ? 'Critical' : 'High' },
    { name: 'Short Game', emoji: '🎯', importance: profile.avgGreenSize === 'small' ? 'High' : 'Medium' },
    { name: 'Putting', emoji: '🏌️', importance: 'High' },
    { name: 'Course Management', emoji: '🗺️', importance: profile.windExposure === 'high' ? 'Critical' : 'Medium' },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-4">Skill Importance</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className={`rounded-lg border p-3 flex items-center gap-2 ${getImportanceColor(skill.importance)}`}
          >
            <span className="text-lg">{skill.emoji}</span>
            <div className="text-xs">
              <p className="font-medium">{skill.name}</p>
              <p className="text-[0.65rem] opacity-75">{skill.importance}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
