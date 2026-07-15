/**
 * Data Quality validator — the orchestrator.
 *
 * Combines per-entity rules (pure, single-object checks) with batch-level
 * duplicate detection (external identifiers and slug candidates) to produce a
 * {@link QualityReport} per entity and an aggregate {@link ValidationOutcome}.
 *
 * This module performs no I/O: no database, no network, no persistence. It is
 * the last gate before the import pipeline — the pipeline should persist only
 * entities whose report `isValid` is true.
 *
 * TODO(repositories): the import pipeline / repository layer consumes
 * `ValidationOutcome`, persisting valid entities (optionally gated on
 * `HIGH_QUALITY_THRESHOLD`) and routing invalid ones to the Admin data-quality
 * review surface. Relationship resolution (nationality, venue, tour/season) and
 * slug *uniqueness against existing rows* also happen there — this layer only
 * detects duplicates *within the incoming batch*.
 */

import type { Course, HasExternalReference, Player, Tournament } from "@/lib/domain"
import { validateCourse, validatePlayer, validateTournament } from "./rules"
import { issue } from "./rules/helpers"
import { averageScore, buildQualityReport } from "./quality-report"
import type {
  EntityKind,
  EvaluatedEntity,
  QualityIssue,
  QualityReport,
  QualityRule,
  ValidationOutcome,
} from "./types"

/** Anything this layer can evaluate: a domain object with provenance + a slug. */
type Validatable = HasExternalReference & { slug: string }

/**
 * Detect duplicate external identifiers and slugs across a batch, returning a
 * map from each entity's index to the extra issues it should carry. Every member
 * of a colliding group is flagged so no ambiguous record slips through.
 */
function detectDuplicates<T extends Validatable>(entities: T[]): Map<number, QualityIssue[]> {
  const extra = new Map<number, QualityIssue[]>()
  const byId = new Map<string, number[]>()
  const bySlug = new Map<string, number[]>()

  entities.forEach((entity, index) => {
    const id = entity.externalRef?.externalId
    if (id) {
      const key = `${entity.externalRef.source}:${id}`
      byId.set(key, [...(byId.get(key) ?? []), index])
    }
    const slug = entity.slug?.trim().toLowerCase()
    if (slug) bySlug.set(slug, [...(bySlug.get(slug) ?? []), index])
  })

  const push = (index: number, next: QualityIssue) => {
    extra.set(index, [...(extra.get(index) ?? []), next])
  }

  for (const [key, indices] of byId) {
    if (indices.length > 1) {
      for (const index of indices) {
        push(
          index,
          issue("DUPLICATE_IDENTIFIER", "error", `Duplicate external identifier "${key}".`, {
            path: "externalRef.externalId",
            value: key,
          }),
        )
      }
    }
  }
  for (const [slug, indices] of bySlug) {
    if (indices.length > 1) {
      for (const index of indices) {
        push(
          index,
          issue("DUPLICATE_SLUG", "error", `Duplicate slug "${slug}" within batch.`, {
            path: "slug",
            value: slug,
          }),
        )
      }
    }
  }

  return extra
}

/**
 * Generic batch evaluation: apply a per-entity rule, merge in duplicate-detection
 * issues, and assemble per-entity reports plus a summary.
 */
function evaluateBatch<T extends Validatable>(
  entity: EntityKind,
  entities: T[],
  rule: QualityRule<T>,
): ValidationOutcome<T> {
  const duplicates = detectDuplicates(entities)

  const evaluated: EvaluatedEntity<T>[] = entities.map((item, index) => {
    const issues = [...rule(item), ...(duplicates.get(index) ?? [])]
    const report = buildQualityReport(entity, item.externalRef, issues)
    return { entity: item, report }
  })

  const reports = evaluated.map((entry) => entry.report)
  const valid = reports.filter((report) => report.isValid).length
  const withWarnings = reports.filter((report) => report.warnings.length > 0).length

  return {
    entity,
    evaluated,
    summary: {
      total: entities.length,
      valid,
      invalid: entities.length - valid,
      withWarnings,
      averageScore: averageScore(reports),
    },
  }
}

/** Evaluate a single player in isolation (no duplicate detection). */
export function evaluatePlayer(player: Player): QualityReport {
  return buildQualityReport("player", player.externalRef, validatePlayer(player))
}

/** Evaluate a single course in isolation. */
export function evaluateCourse(course: Course): QualityReport {
  return buildQualityReport("course", course.externalRef, validateCourse(course))
}

/** Evaluate a single tournament in isolation. */
export function evaluateTournament(tournament: Tournament): QualityReport {
  return buildQualityReport(
    "tournament",
    tournament.externalRef,
    validateTournament(tournament),
  )
}

/** Evaluate a batch of players, including intra-batch duplicate detection. */
export function validatePlayers(players: Player[]): ValidationOutcome<Player> {
  return evaluateBatch("player", players, validatePlayer)
}

/** Evaluate a batch of courses, including intra-batch duplicate detection. */
export function validateCourses(courses: Course[]): ValidationOutcome<Course> {
  return evaluateBatch("course", courses, validateCourse)
}

/** Evaluate a batch of tournaments, including intra-batch duplicate detection. */
export function validateTournaments(
  tournaments: Tournament[],
): ValidationOutcome<Tournament> {
  return evaluateBatch("tournament", tournaments, validateTournament)
}
