'use client'

import { Globe, Phone, Zap, Cloud } from 'lucide-react'
import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionHeader } from '@/components/shared/section-header'
import { HoleByHoleBreakdown } from './hole-by-hole-breakdown'
import type { CourseDetails } from '@/lib/generated/prisma/client'
import type { CourseHole as CourseHoleRecord } from '@/lib/generated/prisma/client'
import type { CourseTee as CourseTeeRecord } from '@/lib/generated/prisma/client'

interface CourseOverviewProps {
  course: CourseDetails
  holes: CourseHoleRecord[]
  tees: CourseTeeRecord[]
}

/**
 * Placeholder component for missing optional values.
 */
function Placeholder() {
  return <span className="text-xs text-muted-foreground">—</span>
}

/**
 * Format a number with optional thousand separators.
 */
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value.toLocaleString()
}

/**
 * Course Overview — displays imported GolfCourse API data on tournament pages.
 * Shows course hero, specifications, facilities, tees, and hole-by-hole summary.
 */
export function CourseOverview({ course, holes, tees }: CourseOverviewProps) {
  // Sort tees by yardage descending
  const sortedTees = [...tees].sort((a, b) => (b.yardage ?? 0) - (a.yardage ?? 0))

  return (
    <div className="flex flex-col gap-6">
      {/* Course Hero */}
      <section className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">{course.courseName}</h2>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {course.clubName && <p className="font-medium text-foreground">{course.clubName}</p>}
              <p>
                {[course.city, course.state, course.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>

            {/* Key metrics grid */}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Par</span>
                <span className="font-semibold text-foreground">{course.par ?? <Placeholder />}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Yardage</span>
                <span className="font-semibold text-foreground">
                  {course.totalYardage ? formatNumber(course.totalYardage) : <Placeholder />}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Rating</span>
                <span className="font-semibold text-foreground">
                  {course.courseRating?.toFixed(1) ?? <Placeholder />}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Slope</span>
                <span className="font-semibold text-foreground">{course.slopeRating ?? <Placeholder />}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Details Grid */}
      <section className="flex flex-col gap-3">
        <SectionHeader as="h3" title="Course Details" />
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            {/* Architect */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Architect</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.architect ?? <Placeholder />}
              </span>
            </div>

            {/* Year Built */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Year Built</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.yearBuilt ?? <Placeholder />}
              </span>
            </div>

            {/* Course Style */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Course Style</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.courseStyle ?? <Placeholder />}
              </span>
            </div>

            {/* Elevation */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Elevation</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.elevation ? `${formatNumber(course.elevation)} ft` : <Placeholder />}
              </span>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* Fairway Grass */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Fairway Grass</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.grassTypeFairway ?? <Placeholder />}
              </span>
            </div>

            {/* Green Grass */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Green Grass</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.grassTypeGreen ?? <Placeholder />}
              </span>
            </div>

            {/* Green Size */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Green Size</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.greenSize ?? <Placeholder />}
              </span>
            </div>

            {/* Green Speed */}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border/50 p-3">
              <span className="text-xs text-muted-foreground">Green Speed</span>
              <span className="text-right text-sm font-medium text-foreground">
                {course.greenSpeed ?? <Placeholder />}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="flex flex-col gap-3">
        <SectionHeader as="h3" title="Facilities" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
            <Zap className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Driving Range</p>
              <p className="text-sm font-medium text-foreground">
                {course.drivingRange === null ? '—' : course.drivingRange ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
            <Zap className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Putting Green</p>
              <p className="text-sm font-medium text-foreground">
                {course.puttingGreen === null ? '—' : course.puttingGreen ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
            <Zap className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Short Game Area</p>
              <p className="text-sm font-medium text-foreground">
                {course.shortGameArea === null ? '—' : course.shortGameArea ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      {(course.website || course.phone) && (
        <section className="flex flex-col gap-3">
          <SectionHeader as="h3" title="Contact" />
          <div className="flex flex-col gap-2 sm:flex-row">
            {course.website && (
              <Link
                href={course.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border/50 p-3 text-sm text-primary hover:bg-accent"
              >
                <Globe className="size-4" />
                Website
              </Link>
            )}
            {course.phone && (
              <a
                href={`tel:${course.phone}`}
                className="flex items-center gap-2 rounded-lg border border-border/50 p-3 text-sm text-primary hover:bg-accent"
              >
                <Phone className="size-4" />
                {course.phone}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Tee Boxes Table */}
      <div className="border-t border-border pt-4">
        <SectionHeader title="Tee Boxes" description="Available tee sets" />
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Tee</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Yardage</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Slope</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTees.map((tee) => (
                <TableRow key={tee.id}>
                  <TableCell className="font-medium">{tee.teeName}</TableCell>
                  <TableCell>{tee.teeColor || <Placeholder />}</TableCell>
                  <TableCell>{tee.gender || <Placeholder />}</TableCell>
                  <TableCell>{tee.yardage ? formatNumber(tee.yardage) : <Placeholder />}</TableCell>
                  <TableCell>{tee.rating?.toFixed(1) ?? <Placeholder />}</TableCell>
                  <TableCell>{tee.slope ?? <Placeholder />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Hole-by-Hole Breakdown */}
      <div className="border-t border-border pt-4">
        {holes && holes.length > 0 ? (
          <HoleByHoleBreakdown holes={holes} courseId={course.id} />
        ) : (
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No hole information has been imported for this course.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
