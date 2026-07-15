import type { LucideIcon } from 'lucide-react'
import { Flag, MapPin, Ruler, Trophy } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CourseDetail } from '@/features/courses/types'
import { cn } from '@/lib/utils'

const EMPTY_VALUE = '—'
const YARDAGE_FMT = new Intl.NumberFormat('en-US')

interface CourseStatProps {
  icon: LucideIcon
  label: string
  value: string
  pending?: boolean
}

/** A single at-a-glance course metric; pending stats read as placeholders. */
function CourseStat({ icon: Icon, label, value, pending = false }: CourseStatProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          pending ? 'bg-muted text-muted-foreground/70' : 'bg-accent text-accent-foreground',
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            'truncate text-sm font-semibold',
            pending && 'font-medium text-muted-foreground/60',
          )}
          title={value}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

interface CourseHeroProps {
  course: CourseDetail
}

/** Location line, e.g. "Augusta, GA, USA", or an em-dash when unknown. */
function formatLocation(course: CourseDetail): string {
  const parts = [course.city, course.stateProvince, course.country].filter(
    (part): part is string => Boolean(part && part.trim()),
  )
  return parts.length > 0 ? parts.join(', ') : EMPTY_VALUE
}

/**
 * Identity and key specs of a course at a glance: its name, location, par,
 * yardage, and how many events it has hosted. Missing specs render as
 * intentional muted placeholders rather than broken layout.
 */
export function CourseHero({ course }: CourseHeroProps) {
  const location = formatLocation(course)
  const parValue = typeof course.par === 'number' ? `Par ${course.par}` : EMPTY_VALUE
  const yardageValue =
    typeof course.yardage === 'number' ? `${YARDAGE_FMT.format(course.yardage)} yds` : EMPTY_VALUE
  const eventCount = course.tournaments.length

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Course profile
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            {course.name}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground text-pretty">
            <MapPin className="size-4" aria-hidden />
            {location}
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CourseStat icon={Flag} label="Par" value={parValue} pending={course.par === null} />
          <CourseStat
            icon={Ruler}
            label="Yardage"
            value={yardageValue}
            pending={course.yardage === null}
          />
          <CourseStat icon={MapPin} label="Location" value={location} pending={location === EMPTY_VALUE} />
          <CourseStat
            icon={Trophy}
            label="Events hosted"
            value={eventCount > 0 ? String(eventCount) : 'None yet'}
            pending={eventCount === 0}
          />
        </div>
      </CardContent>
    </Card>
  )
}
