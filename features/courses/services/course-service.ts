/**
 * CourseService — live data access for the Course domain.
 *
 * The server-only read layer for the courses feature. It reads through
 * `CourseRepository` (the only layer allowed to touch the database) and maps
 * the returned rows into UI shapes via the pure `course-mapper`. It never
 * fabricates data: everything it returns originates from the live database. The
 * `server-only` import guarantees this module can never be pulled into a client
 * bundle.
 */

import 'server-only'

import { cache } from 'react'

import type { CourseDetail } from '@/features/courses/types'
import type { CourseProfile } from '@/lib/domain/course'
import { getCourseRepository } from '@/lib/repositories'

import { mapCourseDetail } from './course-mapper'
import { buildProfileFromRow } from './course-intelligence'

/**
 * Load one course by id, mapped to the UI shape, or `null` when it does not
 * exist. Wrapped in React `cache` so a route that resolves it in both
 * `generateMetadata` and the page component only hits the database once per
 * request.
 */
const getCourseByIdCached = cache(
  async (id: string): Promise<CourseDetail | null> => {
    const row = await getCourseRepository().findDetailById(id)
    return row ? mapCourseDetail(row) : null
  },
)

/**
 * Derive the Course Intelligence profile for a course id, or `null` when no such
 * course exists. Loads only the verified profile inputs (course core +
 * `CourseCharacteristic`) — a lighter read than the full detail — so callers
 * that only need intelligence (e.g. the Tournament hub) don't pull the hosted
 * tournaments list. React-cached per request.
 */
const getCourseIntelligenceCached = cache(
  async (id: string): Promise<CourseProfile | null> => {
    const inputs = await getCourseRepository().findProfileInputsById(id)
    return inputs ? buildProfileFromRow(inputs) : null
  },
)

export const courseService = {
  /**
   * Return a single course by id for the detail page, or `null` when no such
   * course exists (so the route can respond with a proper 404). Reads through
   * the repository — never fabricates data.
   */
  getCourseById(id: string): Promise<CourseDetail | null> {
    return getCourseByIdCached(id)
  },

  /**
   * Return the normalized Course Intelligence profile for a course id, or `null`
   * when the course does not exist. Used by other features (e.g. the Tournament
   * hub) to surface the host venue's intelligence. Never fabricates data — every
   * unresolved characteristic is reported as `unknown`.
   */
  getCourseIntelligence(id: string): Promise<CourseProfile | null> {
    return getCourseIntelligenceCached(id)
  },
}
