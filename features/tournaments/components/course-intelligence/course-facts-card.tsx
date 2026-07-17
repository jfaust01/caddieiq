import { Card } from '@/components/ui/card'
import type { CourseProfile } from '@/lib/domain/course'

interface CourseFactsCardProps {
  profile: CourseProfile | null
  courseDetails: any // CourseDetails shape
}

export function CourseFactsCard({ profile, courseDetails }: CourseFactsCardProps) {
  if (!profile) return null

  const facts = [
    { label: 'Architect', value: courseDetails?.architect },
    { label: 'Year Built', value: courseDetails?.yearBuilt },
    { label: 'Slope', value: profile.slope },
    { label: 'Course Rating', value: profile.rating?.toFixed(1) },
    { label: 'Total Yardage', value: profile.avgYardage?.toLocaleString() },
    { label: 'Par', value: profile.par },
    { label: 'Facilities', value: courseDetails?.facilities?.slice(0, 2).join(', ') },
    { label: 'Grass Type', value: courseDetails?.grassType },
  ]

  return (
    <Card className="p-6 bg-muted/50">
      <h3 className="text-sm font-semibold mb-4">Course Facts</h3>
      <div className="grid grid-cols-2 gap-3">
        {facts.map(
          (fact) =>
            fact.value && (
              <div key={fact.label}>
                <p className="text-xs text-muted-foreground font-medium mb-1">{fact.label}</p>
                <p className="text-sm font-semibold">{fact.value}</p>
              </div>
            ),
        )}
      </div>
    </Card>
  )
}
