/**
 * Tournament relationship resolution.
 *
 * `TournamentRepository` cannot INSERT a new tournament without a resolved
 * `tourId` (a required foreign key), yet neither the SportsDataIO wire payload
 * nor the mapped `Tournament` domain object carries tour/season linkage — that
 * is, by design, a persist-time relationship concern. This module supplies the
 * missing piece: it resolves the required `tour` (and optional `season`)
 * foreign keys from reference data already in the database.
 *
 * Why a pre-loaded, synchronous resolver: the import pipeline calls the
 * relation resolver once per record inside its in-memory map step, so the
 * resolver itself must be synchronous. We therefore load the small set of tours
 * and seasons ONCE up front and close over them, rather than issuing a query
 * per tournament.
 *
 * No IDs are hardcoded (tours are looked up by their stable business `code`)
 * and no data is fabricated: seasons are resolved only when a matching row
 * already exists, otherwise the optional link is simply left unset.
 */

import type { Tournament } from "@/lib/domain"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"

/** The relationship keys the tournament repository needs at persist time. */
export interface TournamentRelationResolution {
  /** Required FK for inserts; resolved from the target tour's business key. */
  tourId?: string
  /** Optional FK; set only when a season row already exists for the year. */
  seasonId?: string | null
}

/** A synchronous resolver, safe to call per-record inside the pipeline. */
export type TournamentRelationResolver = (
  tournament: Tournament,
) => TournamentRelationResolution

export interface TournamentRelationResolverOptions {
  /** Prisma client to read reference data with (defaults to the singleton). */
  prisma?: PrismaClient
  /**
   * Business key (`Tour.code`) of the tour the imported schedule belongs to.
   * SportsDataIO's golf feed is the PGA Tour schedule, so this defaults to
   * `"PGA"`. It is resolved to the tour's id from the database at build time —
   * the id itself is never hardcoded.
   */
  tourCode?: string
}

const DEFAULT_TOUR_CODE = "PGA"

/**
 * Build a synchronous {@link TournamentRelationResolver} by pre-loading the
 * target tour and its seasons from the database.
 *
 * - `tourId` resolves to the tour whose `code` matches {@link
 *   TournamentRelationResolverOptions.tourCode} (default `"PGA"`). If that tour
 *   is absent, `tourId` is left undefined and the repository will report the
 *   affected inserts as relationship failures — surfaced in the import report
 *   rather than silently dropped.
 * - `seasonId` resolves from the tournament's start-date year, but only when a
 *   matching season already exists for the tour; otherwise it is left unset
 *   (the link is optional and no season rows are fabricated).
 */
export async function createTournamentRelationResolver(
  options: TournamentRelationResolverOptions = {},
): Promise<TournamentRelationResolver> {
  const prisma = options.prisma ?? prismaClient
  const tourCode = (options.tourCode ?? DEFAULT_TOUR_CODE).toUpperCase()

  const tour = await prisma.tour.findFirst({
    where: { code: tourCode },
    select: { id: true },
  })
  const tourId = tour?.id

  const seasonRows = tourId
    ? await prisma.season.findMany({
        where: { tourId },
        select: { id: true, year: true },
      })
    : []
  const seasonIdByYear = new Map<number, string>(
    seasonRows.map((season) => [season.year, season.id]),
  )

  return (tournament) => {
    const year = tournament.startDate?.getFullYear()
    const seasonId =
      year !== undefined ? seasonIdByYear.get(year) : undefined
    return { tourId, seasonId }
  }
}
