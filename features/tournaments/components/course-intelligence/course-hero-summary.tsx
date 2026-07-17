import { Card } from '@/components/ui/card'
import type { CourseProfile } from '@/lib/domain/course'

interface CourseHeroSummaryProps {
  courseName: string
  profile: CourseProfile | null
  courseDetails: any // CourseDetails shape
}

export function CourseHeroSummary({ courseName, profile, courseDetails }: CourseHeroSummaryProps) {
  if (!profile) {
    return (
      <Card className="p-6 bg-muted/50">
        <p className="text-sm text-muted-foreground">No course details available</p>
      </Card>
    )
  }

  const facts = [
    { label: 'Par', value: profile.par },
    { label: 'Yardage', value: `${profile.avgYardage?.toLocaleString()}` },
    { label: 'Rating', value: profile.rating?.toFixed(1) },
    { label: 'Slope', value: profile.slope },
    { label: 'Architect', value: courseDetails?.architect || 'Unknown' },
    { label: 'Built', value: courseDetails?.yearBuilt },
    { label: 'Elevation', value: courseDetails?.elevation ? `${courseDetails.elevation}ft` : 'N/A' },
  ]

  return (
    <Card className="p-6 border-primary/20">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{fact.label}</p>
            <p className="text-sm font-semibold text-foreground">{fact.value || '—'}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
