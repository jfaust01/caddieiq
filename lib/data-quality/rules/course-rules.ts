/**
 * Course quality rules.
 *
 * Pure, single-entity checks for a mapped {@link Course}. Duplicate id/slug
 * detection is handled by the validator.
 */

import type { Course } from "@/lib/domain"
import type { QualityIssue, QualityRule } from "../types"
import {
  checkOptionalNumber,
  isFiniteNumber,
  isPlausibleCountry,
  isNonEmptyString,
  isValidLatitude,
  isValidLongitude,
  issue,
  requireString,
} from "./helpers"

/** Plausible bounds for an 18-hole course. */
const PAR_BOUNDS = { min: 27, max: 80 }
const YARDAGE_BOUNDS = { min: 1000, max: 9000 }

/**
 * A course may carry geographic coordinates from an enriched source. The base
 * `Course` domain type does not declare them, so we read them structurally
 * without widening the domain model. When present, both must be valid.
 */
function readCoordinates(course: Course): { lat?: number; lng?: number } {
  const record = course as unknown as Record<string, unknown>
  const lat = record.latitude
  const lng = record.longitude
  return {
    lat: isFiniteNumber(lat) ? lat : undefined,
    lng: isFiniteNumber(lng) ? lng : undefined,
  }
}

/** Evaluate a single mapped course. */
export const validateCourse: QualityRule<Course> = (course) => {
  const issues: QualityIssue[] = []

  // Required fields.
  const name = requireString(course.name, "name", "Course name")
  if (name) issues.push(name)
  const slug = requireString(course.slug, "slug", "Slug")
  if (slug) issues.push(slug)
  if (!isNonEmptyString(course.externalRef?.externalId)) {
    issues.push(
      issue("REQUIRED_FIELD_MISSING", "error", "External identifier is required.", {
        path: "externalRef.externalId",
      }),
    )
  }

  // Numbers.
  const par = checkOptionalNumber(course.par, "par", PAR_BOUNDS)
  if (par) issues.push(par)
  const yardage = checkOptionalNumber(course.yardage, "yardage", YARDAGE_BOUNDS)
  if (yardage) issues.push(yardage)

  // Location — advisory when missing.
  if (course.country !== null && !isPlausibleCountry(course.country)) {
    issues.push(
      issue("INVALID_COUNTRY_CODE", "warning", "Country looks invalid.", {
        path: "country",
        value: course.country,
      }),
    )
  }
  if (course.country === null && course.city === null && course.stateProvince === null) {
    issues.push(
      issue("REQUIRED_FIELD_MISSING", "warning", "Course has no location information.", {
        path: "country",
      }),
    )
  }

  // Coordinates — validate as a pair when either is present.
  const { lat, lng } = readCoordinates(course)
  if (lat !== undefined || lng !== undefined) {
    if (lat === undefined || lng === undefined) {
      issues.push(
        issue(
          "INVALID_COORDINATES",
          "error",
          "Coordinates are incomplete — both latitude and longitude are required.",
          { path: "coordinates" },
        ),
      )
    } else if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
      issues.push(
        issue("INVALID_COORDINATES", "error", "Coordinates are out of range.", {
          path: "coordinates",
          value: { lat, lng },
        }),
      )
    }
  }

  return issues
}
