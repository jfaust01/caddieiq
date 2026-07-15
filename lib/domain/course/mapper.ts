/**
 * SportsDataIO → CaddieIQ course mapper.
 *
 * The isolation boundary for course data: the only place in the domain layer
 * allowed to reference the SportsDataIO course wire type, via `import type`.
 * Field translation only — no validation, no persistence, no relationship
 * resolution.
 *
 * The upstream golf feed has no standalone course catalog and no `CourseID`;
 * the course is the tournament row's `Venue`, so identity is derived from the
 * venue name. `City`/`State` fall back to parsing the free-text `Location`
 * ("Pebble Beach, CA") when the structured fields are absent.
 */

import type { SdioCourse } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, slugify } from "../shared/utils"
import { UNKNOWN_COURSE_NAME } from "./constants"
import type { Course } from "./types"

/** A US state code fallback recognizes a trailing 2-letter uppercase token. */
const US_STATE_CODE = /^[A-Z]{2}$/

/**
 * Resolve city/state from the structured fields, falling back to the free-text
 * `Location`. Conservative by design: the locality's first segment becomes the
 * city, and the second segment sets the state **only** when it looks like a US
 * state code (so an international "County Limerick, Ireland" never mislabels
 * "Ireland" as a state).
 */
function resolveLocality(raw: SdioCourse): {
  city: string | null
  stateProvince: string | null
} {
  let city = cleanString(raw.City)
  let stateProvince = cleanString(raw.State)

  if ((city === null || stateProvince === null) && cleanString(raw.Location)) {
    const [firstSegment, secondSegment] = (raw.Location as string)
      .split(",")
      .map((part) => part.trim())

    if (city === null && firstSegment) {
      city = firstSegment
    }
    if (stateProvince === null && secondSegment && US_STATE_CODE.test(secondSegment)) {
      stateProvince = secondSegment
    }
  }

  return { city, stateProvince }
}

/**
 * Translate a raw SportsDataIO course (venue-bearing tournament row) into a
 * CaddieIQ {@link Course}.
 *
 * @param raw - The provider's un-normalized record.
 * @returns A provider-agnostic `Course` domain object.
 */
export function mapSportsDataCourse(raw: SdioCourse): Course {
  // The course's identity in this feed is its venue name.
  const name = cleanString(raw.Venue) ?? UNKNOWN_COURSE_NAME
  const slug = slugify(name)
  const { city, stateProvince } = resolveLocality(raw)

  return {
    name,
    slug,
    city,
    stateProvince,
    country: cleanString(raw.Country),
    par: cleanNumber(raw.Par),
    // SportsDataIO uses `Yards`; the domain uses `yardage`.
    yardage: cleanNumber(raw.Yards),
    externalRef: {
      source: "sportsdataio",
      // No upstream CourseID exists; the deterministic slug is the stable,
      // source-derived identity used for reconciliation.
      externalId: slug,
    },
  }
}
