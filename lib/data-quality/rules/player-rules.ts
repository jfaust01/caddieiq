/**
 * Player quality rules.
 *
 * Pure, single-entity checks for a mapped {@link Player}. Cross-entity concerns
 * (duplicate ids/slugs) are handled by the validator, not here.
 */

import type { Player } from "@/lib/domain"
import type { QualityIssue, QualityRule } from "../types"
import {
  checkOptionalDate,
  checkOptionalNumber,
  isPlausibleCountry,
  isNonEmptyString,
  issue,
  requireString,
} from "./helpers"

/** Earliest plausible birth year for an active professional golfer. */
const MIN_BIRTH_YEAR = 1900
/** Reasonable physical bounds — flag values outside as errors. */
const HEIGHT_CM_BOUNDS = { min: 120, max: 260 }
const WEIGHT_KG_BOUNDS = { min: 40, max: 200 }

/**
 * Evaluate a single mapped player. Required identity fields are errors; missing
 * optional-but-expected fields (country, headshot) are warnings.
 */
export const validatePlayer: QualityRule<Player> = (player) => {
  const issues: QualityIssue[] = []
  const now = new Date()

  // Required fields.
  const firstName = requireString(player.firstName, "firstName", "First name")
  if (firstName) issues.push(firstName)
  const lastName = requireString(player.lastName, "lastName", "Last name")
  if (lastName) issues.push(lastName)
  const fullName = requireString(player.fullName, "fullName", "Full name")
  if (fullName) issues.push(fullName)
  const slug = requireString(player.slug, "slug", "Slug")
  if (slug) issues.push(slug)

  // External reference is required for reconciliation.
  if (!isNonEmptyString(player.externalRef?.externalId)) {
    issues.push(
      issue("REQUIRED_FIELD_MISSING", "error", "External identifier is required.", {
        path: "externalRef.externalId",
      }),
    )
  }

  // Dates.
  const birth = checkOptionalDate(player.birthDate, "birthDate")
  if (birth) {
    issues.push(birth)
  } else if (player.birthDate) {
    const year = player.birthDate.getFullYear()
    if (player.birthDate > now) {
      issues.push(
        issue("DATE_RANGE_INVALID", "error", "Birth date is in the future.", {
          path: "birthDate",
          value: player.birthDate,
        }),
      )
    } else if (year < MIN_BIRTH_YEAR) {
      issues.push(
        issue("DATE_RANGE_INVALID", "warning", `Birth year ${year} is implausibly early.`, {
          path: "birthDate",
          value: player.birthDate,
        }),
      )
    }
  }

  // Numbers.
  const height = checkOptionalNumber(player.heightCm, "heightCm", HEIGHT_CM_BOUNDS)
  if (height) issues.push(height)
  const weight = checkOptionalNumber(player.weightKg, "weightKg", WEIGHT_KG_BOUNDS)
  if (weight) issues.push(weight)
  const proYear = checkOptionalNumber(player.turnedProYear, "turnedProYear", {
    min: MIN_BIRTH_YEAR,
    max: now.getFullYear(),
  })
  if (proYear) issues.push(proYear)

  // Country code — advisory: raw labels are normalized to ISO later.
  if (player.countryCode !== null) {
    if (!isPlausibleCountry(player.countryCode)) {
      issues.push(
        issue("INVALID_COUNTRY_CODE", "warning", "Country code looks invalid.", {
          path: "countryCode",
          value: player.countryCode,
        }),
      )
    }
  } else {
    issues.push(
      issue("REQUIRED_FIELD_MISSING", "warning", "Country is not set.", {
        path: "countryCode",
      }),
    )
  }

  // TODO(repositories): nationality is a required *relationship* on persist.
  // The repository resolves `countryCode` to a `Nationality` row and should
  // raise a RelationshipError if resolution fails.

  return issues
}
