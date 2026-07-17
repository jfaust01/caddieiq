import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface CourseFactsCardProps {
  courseName: string
  courseProfile: {
    par?: number
    avgYardage?: number
    elevation?: number
    fairwayGrass?: string
    greenSpeed?: string
    architect?: string
    yearBuilt?: number
  }
}

export function CourseFactsCard({
  courseName,
  courseProfile,
}: CourseFactsCardProps) {
  const facts = [
    { label: 'Par', value: courseProfile.par },
    { label: 'Yardage', value: courseProfile.avgYardage ? `${courseProfile.avgYardage.toLocaleString()} yds` : undefined },
    { label: 'Elevation', value: courseProfile.elevation ? `${courseProfile.elevation} ft` : undefined },
    { label: 'Fairway Grass', value: courseProfile.fairwayGrass },
    { label: 'Green Speed', value: courseProfile.greenSpeed },
    { label: 'Architect', value: courseProfile.architect },
    { label: 'Year Built', value: courseProfile.yearBuilt },
  ].filter(({ value }) => value !== undefined && value !== null)

  return (
    <Card className="p-4">
      <div className="flex gap-2 mb-4">
        <MapPin className="size-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">{courseName}</p>
          <p className="text-xs text-muted-foreground">Course Reference</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {facts.map(({ label, value }) => (
          <div key={label}>
            <p className="font-medium text-muted-foreground">{label}</p>
            <p className="text-foreground font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
