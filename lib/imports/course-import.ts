/**
 * Course import definition.
 *
 * Wires the four layers for courses with no orchestration logic of its own
 * (see {@link ImportManager}):
 *
 *   fetch    → GolfDataProvider.listCourses        (lib/providers)
 *   map      → mapSportsDataCourse                 (lib/domain)
 *   validate → validateCourses                     (lib/data-quality)
 *   persist  → CourseRepository.bulkUpsert         (lib/repositories)
 *
 * The upstream golf "courses" feed is tournament-shaped: it returns one row per
 * event (622 rows) that repeats a venue across every year/edition it hosts.
 * Persisting all of those directly would re-upsert the same ~200 courses
 * hundreds of times. The `fetch` step therefore collapses the feed to distinct
 * venues before mapping, merging non-null fields so a sparse row (e.g. missing
 * `Par`) is completed by a richer sibling for the same venue.
 */

import { validateCourses } from "@/lib/data-quality"
import { mapSportsDataCourse, type Course } from "@/lib/domain"
import { slugify } from "@/lib/domain/shared/utils"
import type { GolfDataProvider, ProviderListResponse, ProviderQuery } from "@/lib/providers/provider"
import type { SdioCourse } from "@/lib/providers/sportsdataio/types"
import type { CourseRepository } from "@/lib/repositories"

import type { ImportDefinition } from "./import-manager"

/** Dependencies the course import needs from the surrounding layers. */
export interface CourseImportDeps {
  provider: GolfDataProvider<unknown, unknown, SdioCourse>
  repository: CourseRepository
}

/** Fields merged when collapsing duplicate venue rows (first non-null wins). */
const MERGEABLE_FIELDS = [
  "Location",
  "City",
  "State",
  "Country",
  "Par",
  "Yards",
] as const satisfies readonly (keyof SdioCourse)[]

/**
 * Collapse the venue-bearing tournament feed to one record per distinct course.
 * Rows without a venue are dropped (they cannot identify a course). For each
 * venue the first-seen row wins, but any field it is missing is back-filled
 * from a later row for the same venue, maximizing field coverage.
 */
export function dedupeCourses(raw: readonly SdioCourse[]): SdioCourse[] {
  const byVenue = new Map<string, SdioCourse>()

  for (const row of raw) {
    const venue = typeof row.Venue === "string" ? row.Venue.trim() : ""
    if (venue === "") continue

    const key = slugify(venue)
    const existing = byVenue.get(key)
    if (!existing) {
      byVenue.set(key, { ...row })
      continue
    }

    for (const field of MERGEABLE_FIELDS) {
      if (existing[field] == null && row[field] != null) {
        existing[field] = row[field]
      }
    }
  }

  return [...byVenue.values()]
}

/** Build the course {@link ImportDefinition}. */
export function createCourseImportDefinition(
  deps: CourseImportDeps,
  query?: ProviderQuery,
): ImportDefinition<SdioCourse, Course> {
  return {
    entity: "course",
    fetch: async (): Promise<ProviderListResponse<SdioCourse>> => {
      const response = await deps.provider.listCourses(query)
      return { ...response, data: dedupeCourses(response.data) }
    },
    map: (raw) => mapSportsDataCourse(raw),
    validate: (courses) => validateCourses(courses),
    persist: (courses) => deps.repository.bulkUpsert(courses),
  }
}
