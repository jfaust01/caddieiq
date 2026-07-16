'use server'

/**
 * Server actions for the courses feature.
 *
 * The boundary the client hooks call across. Each wraps the server-only
 * `courseService` (which reads the live database) and converts any failure
 * into a typed, serializable result so the UI can distinguish an empty dataset
 * from a database/unexpected error and render the right state.
 */

import type { PaginatedResult } from '@/features/tournaments/types'
import type { CourseSummary } from '@/features/courses/types'

import { courseService } from './course-service'

/** Discriminated result so the client never has to catch across the boundary. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: 'DATABASE_UNAVAILABLE' }

function logFailure(scope: string, error: unknown): void {
  // Structured, secret-free server log; the client only sees a coarse code.
  console.error(`[courses] ${scope} failed:`, error instanceof Error ? error.message : error)
}

export interface CourseQuery {
  search?: string
  page: number
  pageSize: number
}

/** Fetch a filtered, paginated page of courses. */
export async function fetchCourses(
  query: CourseQuery,
): Promise<ActionResult<PaginatedResult<CourseSummary>>> {
  try {
    const pageSize = query.pageSize
    const skip = (query.page - 1) * pageSize
    const { courses, total } = await courseService.queryCourses({
      search: query.search,
      skip,
      take: pageSize,
    })

    return {
      ok: true,
      data: {
        items: courses,
        total,
        page: query.page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    logFailure('fetchCourses', error)
    return { ok: false, error: 'DATABASE_UNAVAILABLE' }
  }
}
