/**
 * Tournament ↔ course relationship linking.
 *
 * Courses and tournaments are imported independently, each keyed by its own
 * deterministic slug. This module wires them together by populating the
 * `tournament_courses` join table.
 *
 * The SportsDataIO golf feed is tournament-shaped (one row per event, carrying
 * both the event `Name` and its `Venue`), so each raw row already tells us which
 * course hosts which tournament in which year. We therefore reconcile purely by
 * the shared, deterministic slug:
 *
 *   tournament  ← slugify(row.Name)   (matches Tournament.slug)
 *   course      ← slugify(row.Venue)  (matches Course.slug)
 *   year        ← row.StartDate's calendar year (fallback: row.Season)
 *
 * Nothing is fabricated: a row is linked only when BOTH a tournament and a
 * course already exist for its slugs. Rows missing a venue, an unknown
 * tournament, or a resolvable year are counted and reported, never guessed.
 */

import { slugify } from "@/lib/domain/shared/utils"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import type { SdioCourse } from "@/lib/providers/sportsdataio/types"

import { getTournamentRepository, type TournamentRepository } from "@/lib/repositories"

/** Outcome of a link run, suitable for surfacing in an import report. */
export interface CourseLinkSummary {
  /** Raw feed rows considered. */
  processed: number
  /** Join rows newly created. */
  linked: number
  /** Existing join rows updated (idempotent re-run). */
  updated: number
  /** Rows skipped because the venue, tournament, course, or year was missing. */
  skipped: number
  /** Rows whose write failed. */
  failed: number
  /** Human-readable notes on skips/failures (bounded for log hygiene). */
  notes: string[]
}

export interface LinkCoursesOptions {
  prisma?: PrismaClient
  repository?: TournamentRepository
  /** Max number of skip/failure notes to retain. */
  maxNotes?: number
}

/** Resolve the calendar year for a raw row: StartDate year, else Season. */
function resolveYear(row: SdioCourse): number | undefined {
  if (typeof row.StartDate === "string") {
    const parsed = new Date(row.StartDate)
    if (!Number.isNaN(parsed.getTime())) return parsed.getUTCFullYear()
  }
  const season = (row as { Season?: unknown }).Season
  return typeof season === "number" && Number.isFinite(season) ? season : undefined
}

/**
 * Populate `tournament_courses` from the raw venue-bearing feed by matching on
 * deterministic slugs. Idempotent: reconciled on `(tournamentId, year)`.
 */
export async function linkTournamentCourses(
  raw: readonly SdioCourse[],
  options: LinkCoursesOptions = {},
): Promise<CourseLinkSummary> {
  const prisma = options.prisma ?? prismaClient
  const repository = options.repository ?? getTournamentRepository()
  const maxNotes = options.maxNotes ?? 25

  const summary: CourseLinkSummary = {
    processed: 0,
    linked: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // Pre-load id lookups once (small tables), keyed by slug.
  const [tournaments, courses] = await Promise.all([
    prisma.tournament.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
    prisma.course.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
  ])
  const tournamentIdBySlug = new Map(tournaments.map((t) => [t.slug, t.id]))
  const courseIdBySlug = new Map(courses.map((c) => [c.slug, c.id]))

  // Collapse to one link per (tournament, year); later rows win on conflict but
  // that is irrelevant since the feed is internally consistent.
  const seen = new Set<string>()

  for (const row of raw) {
    summary.processed += 1

    const name = typeof row.Name === "string" ? row.Name.trim() : ""
    const venue = typeof row.Venue === "string" ? row.Venue.trim() : ""
    if (name === "" || venue === "") {
      summary.skipped += 1
      note(`Missing name/venue for row TournamentID=${row.TournamentID ?? "?"}`)
      continue
    }

    const tournamentId = tournamentIdBySlug.get(slugify(name))
    const courseId = courseIdBySlug.get(slugify(venue))
    const year = resolveYear(row)

    if (!tournamentId || !courseId || year === undefined) {
      summary.skipped += 1
      note(
        `Unresolved link: name="${name}" venue="${venue}" ` +
          `(tournament=${Boolean(tournamentId)}, course=${Boolean(courseId)}, year=${year ?? "?"})`,
      )
      continue
    }

    const dedupeKey = `${tournamentId}:${year}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const result = await repository.linkCourseByYear({ tournamentId, courseId, year })
    if (result.outcome === "failed") {
      summary.failed += 1
      note(`Link failed for "${name}" @ ${year}: ${result.error?.message ?? "unknown error"}`)
      continue
    }
    if (result.outcome === "inserted") summary.linked += 1
    else summary.updated += 1
  }

  return summary
}
