/**
 * SportsDataIO → CaddieIQ course mapper.
 *
 * The isolation boundary for course data: the only place in the domain layer
 * allowed to reference the SportsDataIO course wire type, via `import type`.
 * Field translation only — no validation, no persistence, no relationship
 * resolution.
 */

import type { SdioCourse } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, slugify } from "../shared/utils"
import { UNKNOWN_COURSE_NAME } from "./constants"
import type { Course } from "./types"

/**
 * Translate a raw SportsDataIO course into a CaddieIQ {@link Course}.
 *
 * @param raw - The provider's un-normalized course record.
 * @returns A provider-agnostic `Course` domain object.
 */
export function mapSportsDataCourse(raw: SdioCourse): Course {
  const name = cleanString(raw.Name) ?? UNKNOWN_COURSE_NAME

  return {
    name,
    slug: slugify(name),
    city: cleanString(raw.City),
    // SportsDataIO uses `State`; the domain generalizes to `stateProvince`.
    stateProvince: cleanString(raw.State),
    country: cleanString(raw.Country),
    par: cleanNumber(raw.Par),
    // SportsDataIO uses `Yards`; the domain uses `yardage`.
    yardage: cleanNumber(raw.Yards),
    externalRef: {
      source: "sportsdataio",
      externalId: String(raw.CourseID),
    },
  }
}
