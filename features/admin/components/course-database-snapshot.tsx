'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CourseDetails } from '@/lib/generated/prisma/client'

interface CourseDatabaseSnapshotProps {
  course: CourseDetails
}

const Section = ({
  title,
  fields,
}: {
  title: string
  fields: { label: string; value: string | number | boolean | null | undefined }[]
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="font-mono text-sm">
            {value === null || value === undefined ? (
              <span className="text-muted-foreground">—</span>
            ) : typeof value === 'boolean' ? (
              <Badge variant={value ? 'default' : 'secondary'}>
                {value ? 'Yes' : 'No'}
              </Badge>
            ) : (
              <span>{String(value)}</span>
            )}
          </span>
        </div>
      ))}
    </CardContent>
  </Card>
)

export function CourseDatabaseSnapshot({ course }: CourseDatabaseSnapshotProps) {
  return (
    <div className="space-y-6">
      <Section
        title="Identity"
        fields={[
          { label: 'Course Name', value: course.courseName },
          { label: 'City', value: course.city },
          { label: 'State', value: course.state },
          { label: 'Country', value: course.country },
          { label: 'GolfCourseAPI ID', value: course.externalCourseId },
          { label: 'Last Imported', value: course.updatedAt?.toLocaleDateString() },
        ]}
      />

      <Section
        title="Metadata"
        fields={[
          { label: 'Architect', value: course.architect },
          { label: 'Year Built', value: course.yearBuilt },
          { label: 'Course Style', value: course.courseStyle },
        ]}
      />

      <Section
        title="Playing Conditions"
        fields={[
          { label: 'Fairway Grass', value: course.grassTypeFairway },
          { label: 'Green Grass', value: course.grassTypeGreen },
          { label: 'Green Speed', value: course.greenSpeed },
          { label: 'Average Green Size', value: course.greenSize },
          { label: 'Elevation', value: course.elevation },
        ]}
      />

      <Section
        title="Facilities"
        fields={[
          { label: 'Driving Range', value: course.drivingRange },
          { label: 'Putting Green', value: course.puttingGreen },
          { label: 'Short Game Area', value: course.shortGameArea },
        ]}
      />

      <Section
        title="Contact"
        fields={[
          { label: 'Website', value: course.website },
          { label: 'Phone', value: course.phone },
        ]}
      />

      <Section
        title="Specifications"
        fields={[
          { label: 'Par', value: course.par },
          { label: 'Total Yardage', value: course.totalYardage },
          { label: 'Course Rating', value: course.courseRating },
          { label: 'Slope Rating', value: course.slopeRating },
        ]}
      />
    </div>
  )
}
