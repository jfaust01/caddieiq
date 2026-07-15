/**
 * Tournament quality rules.
 *
 * Pure, single-entity checks for a mapped {@link Tournament}. Duplicate id/slug
 * detection is handled by the validator.
 */

import type { Tournament } from "@/lib/domain"
import type { QualityIssue, QualityRule } from "../types"
import {
  checkOptionalDate,
  checkOptionalNumber,
  isNonEmptyString,
  isValidDate,
  issue,
  requireString,
} from "./helpers"

/** Tournaments predating professional record-keeping are suspect. */
const MIN_TOURNAMENT_YEAR = 1900

/** Evaluate a single mapped tournament. */
export const validateTournament: QualityRule<Tournament> = (tournament) => {
  const issues: QualityIssue[] = []

  // Required fields.
  const name = requireString(tournament.name, "name", "Tournament name")
  if (name) issues.push(name)
  const slug = requireString(tournament.slug, "slug", "Slug")
  if (slug) issues.push(slug)
  if (!isNonEmptyString(tournament.externalRef?.externalId)) {
    issues.push(
      issue("REQUIRED_FIELD_MISSING", "error", "External identifier is required.", {
        path: "externalRef.externalId",
      }),
    )
  }

  // Dates: each must be valid when present.
  const start = checkOptionalDate(tournament.startDate, "startDate")
  if (start) issues.push(start)
  const end = checkOptionalDate(tournament.endDate, "endDate")
  if (end) issues.push(end)

  // Date range: end must not precede start when both are valid.
  if (isValidDate(tournament.startDate) && isValidDate(tournament.endDate)) {
    if (tournament.endDate < tournament.startDate) {
      issues.push(
        issue("DATE_RANGE_INVALID", "error", "End date precedes start date.", {
          path: "endDate",
          value: { startDate: tournament.startDate, endDate: tournament.endDate },
        }),
      )
    }
  }
  if (isValidDate(tournament.startDate) && tournament.startDate.getFullYear() < MIN_TOURNAMENT_YEAR) {
    issues.push(
      issue("DATE_RANGE_INVALID", "warning", "Start year is implausibly early.", {
        path: "startDate",
        value: tournament.startDate,
      }),
    )
  }

  // A scheduled/active/completed tournament with no dates is suspect.
  if (tournament.startDate === null && tournament.status !== "CANCELED") {
    issues.push(
      issue("REQUIRED_FIELD_MISSING", "warning", "Tournament has no start date.", {
        path: "startDate",
      }),
    )
  }

  // Purse.
  const purse = checkOptionalNumber(tournament.purse, "purse", { min: 0 })
  if (purse) issues.push(purse)

  // TODO(repositories): venue (`TournamentCourse`) and tour/season are required
  // *relationships* resolved on persist. The repository should raise a
  // RelationshipError if a tournament cannot be linked to at least one course,
  // and should associate the correct tour/season before writing.

  return issues
}
