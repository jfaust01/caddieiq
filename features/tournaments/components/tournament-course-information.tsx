'use client'

import { MapPin, Zap, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'

interface CourseInfo {
  name: string
  location: string
  city: string
  state: string
  architect: string
  yearBuilt: number
  par: number
  yardage: number
  grassType: string
  fairwayGrass: string
  greenType: string
  elevation: number
}

interface TournamentCourseInformationProps {
  course: CourseInfo
}

/**
 * Course Information — displays detailed course data.
 * Shows: location, architect, year built, grass types, par, yardage, elevation.
 * Provides golfers with course characteristics that affect strategy.
 */
export function TournamentCourseInformation({ course }: TournamentCourseInformationProps) {
  if (!course) {
    return null
  }

  return (
    <section aria-label="Course information">
      <SectionHeader
        title="Course Information"
        description={`${course.name} — ${course.city}, ${course.state}`}
        icon={MapPin}
      />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Location</p>
                <p className="text-sm font-medium">{course.city}, {course.state}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Architect</p>
                <p className="text-sm font-medium">{course.architect || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Year Built</p>
                <p className="text-sm font-medium">{course.yearBuilt || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Elevation</p>
                <p className="text-sm font-medium">{course.elevation ? `${course.elevation} ft` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scorecard & Specs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Par</p>
                  <p className="text-2xl font-bold">{course.par}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Yardage</p>
                  <p className="text-2xl font-bold">{course.yardage ? `${(course.yardage / 1000).toFixed(1)}K` : '—'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grass Types */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Grass Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Fairways</p>
                <p className="text-sm font-medium">{course.fairwayGrass || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Greens</p>
                <p className="text-sm font-medium">{course.greenType || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Rough</p>
                <p className="text-sm font-medium">{course.grassType || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
