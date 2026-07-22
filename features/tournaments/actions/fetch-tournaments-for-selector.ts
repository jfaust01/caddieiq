"use server"

import prismaClient from "@/lib/prisma"

export interface TournamentSelectorOption {
  id: string
  name: string
  status: string
  startDate: string | null
  endDate: string | null
  tourCode: string | null
  tourName: string | null
}

/**
 * Fetch tournaments for the tournament selector dropdown.
 * Sorts by: Live first, then Upcoming (soonest first), then Completed (most recent first), then other.
 * Returns up to 100 tournaments.
 */
export async function fetchTournamentsForSelector(): Promise<TournamentSelectorOption[]> {
  const tournaments = await prismaClient.$queryRaw<any[]>`
    SELECT
      t.id,
      t.name,
      t.status,
      t."startDate",
      t."endDate",
      tr.code as "tourCode",
      tr.name as "tourName"
    FROM tournaments t
    LEFT JOIN tours tr ON tr.id = t."tourId"
    WHERE t."deletedAt" IS NULL
    ORDER BY
      CASE t.status::text
        WHEN 'ACTIVE' THEN 0
        WHEN 'IN_PROGRESS' THEN 0
        WHEN 'LIVE' THEN 0
        WHEN 'SCHEDULED' THEN 1
        WHEN 'UPCOMING' THEN 1
        WHEN 'COMPLETED' THEN 2
        ELSE 3
      END ASC,
      CASE t.status::text
        WHEN 'COMPLETED' THEN t."endDate"
        ELSE t."startDate"
      END DESC,
      t.name ASC
    LIMIT 100
  `

  return tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status || "UNKNOWN",
    startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
    endDate: t.endDate ? new Date(t.endDate).toISOString() : null,
    tourCode: t.tourCode,
    tourName: t.tourName,
  }))
}
