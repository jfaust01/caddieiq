/**
 * Course feature types.
 *
 * The provider-agnostic shapes the course detail page renders against. The
 * server-only `courseService` maps live database rows (via
 * `CourseRepository.findDetailById`) into these types. Fields sourced from
 * optional columns are nullable so the UI degrades gracefully (renders an
 * em-dash) rather than fabricating a value.
 */

import type { CourseProfile } from '@/lib/domain/course'

/** Minimal course summary for list/directory views. */
export interface CourseSummary {
  id: string
  name: string
  slug: string
  city: string | null
  stateProvince: string | null
  country: string | null
}

/** Lifecycle status of a tournament (mirrors the database enum). */
export type TournamentStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'

/** A tournament that has been hosted at a course. */
export interface CourseTournament {
  id: string
  name: string
  status: TournamentStatus
  /** ISO date string, or null when not supplied by the source. */
  startDate: string | null
  /** ISO date string, or null when not supplied by the source. */
  endDate: string | null
  /** The year the event was hosted here. */
  year: number
  /** Whether this course was the primary host for that edition. */
  hostCourse: boolean
  /** Owning tour name, e.g. "PGA Tour", or null when unresolved. */
  tourName: string | null
  /** Short tour code, e.g. "PGA", or null when unresolved. */
  tourCode: string | null
}

/**
 * A course profile for the detail page. `name` is always present; every other
 * descriptive field is nullable and renders an em-dash when the source omits
 * it. `tournaments` is the list of events linked to this course (may be empty).
 */
export interface CourseDetail {
  id: string
  name: string
  city: string | null
  stateProvince: string | null
  country: string | null
  par: number | null
  yardage: number | null
  /**
   * The normalized Course Intelligence profile derived from verified course
   * facts. Always present and stably shaped: every modeled characteristic is
   * included, `unknown` until real data exists (never fabricated).
   */
  profile: CourseProfile
  /** Tournaments hosted at this course, newest first. */
  tournaments: CourseTournament[]
}
