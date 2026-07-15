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
 */

import { validateCourses } from "@/lib/data-quality"
import { mapSportsDataCourse, type Course } from "@/lib/domain"
import type { GolfDataProvider, ProviderQuery } from "@/lib/providers/provider"
import type { SdioCourse } from "@/lib/providers/sportsdataio/types"
import type { CourseRepository } from "@/lib/repositories"

import type { ImportDefinition } from "./import-manager"

/** Dependencies the course import needs from the surrounding layers. */
export interface CourseImportDeps {
  provider: GolfDataProvider<unknown, unknown, SdioCourse>
  repository: CourseRepository
}

/** Build the course {@link ImportDefinition}. */
export function createCourseImportDefinition(
  deps: CourseImportDeps,
  query?: ProviderQuery,
): ImportDefinition<SdioCourse, Course> {
  return {
    entity: "course",
    fetch: () => deps.provider.listCourses(query),
    map: (raw) => mapSportsDataCourse(raw),
    validate: (courses) => validateCourses(courses),
    persist: (courses) => deps.repository.bulkUpsert(courses),
  }
}
