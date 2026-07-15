/**
 * Row → UI mapper for the Course feature. Pure translation only: it turns a
 * `CourseDetailRow` (from the repository) into the provider-agnostic
 * `CourseDetail` the detail page renders. No fetching, no database access.
 */

import type {
  CourseDetail,
  CourseTournament,
  TournamentStatus,
} from '@/features/courses/types'
import type {
  CourseDetailRow,
  CourseTournamentRow,
} from '@/lib/repositories/course-repository'

const TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELED',
]

/** Narrow a raw status string to the UI enum, defaulting to `SCHEDULED`. */
function toStatus(value: string): TournamentStatus {
  return TOURNAMENT_STATUSES.includes(value as TournamentStatus)
    ? (value as TournamentStatus)
    : 'SCHEDULED'
}

/** Serialize a database date to an ISO string, or null. */
function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null
}

/** Coerce a possibly-non-finite numeric column to a clean number or null. */
function toNumber(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Map a linked-tournament row to its UI shape. */
function mapCourseTournament(row: CourseTournamentRow): CourseTournament {
  return {
    id: row.id,
    name: row.name,
    status: toStatus(row.status),
    startDate: toIso(row.startDate),
    endDate: toIso(row.endDate),
    year: row.year,
    hostCourse: row.hostCourse,
    tourName: row.tourName,
    tourCode: row.tourCode,
  }
}

/** Map the flattened course-detail row to the UI `CourseDetail`. */
export function mapCourseDetail(row: CourseDetailRow): CourseDetail {
  const { course, tournaments } = row
  return {
    id: course.id,
    name: course.name,
    city: course.city ?? null,
    stateProvince: course.stateProvince ?? null,
    country: course.country ?? null,
    par: toNumber(course.par),
    yardage: toNumber(course.yardage),
    tournaments: tournaments.map(mapCourseTournament),
  }
}
