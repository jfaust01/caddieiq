/**
 * Row → UI mapper for the Tournament feature. Pure translation only: it turns a
 * flattened `TournamentSearchRow` (from the repository) into the
 * provider-agnostic `TournamentSummary` the directory renders. No fetching, no
 * database access.
 */

import type {
  TournamentStatus,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'
import type { TournamentSearchRow } from '@/lib/repositories/tournament-repository'

const TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELED',
]

const TOUR_TYPES: readonly TourType[] = ['PGA', 'DP_WORLD', 'LIV', 'KORN_FERRY', 'LPGA']

/** Narrow a raw status string to the UI enum, defaulting to `SCHEDULED`. */
function toStatus(value: string | null): TournamentStatus {
  return TOURNAMENT_STATUSES.includes(value as TournamentStatus)
    ? (value as TournamentStatus)
    : 'SCHEDULED'
}

/** Narrow a raw tour-type string to the UI enum, or null when unrecognized. */
function toTourType(value: string | null): TourType | null {
  return value && TOUR_TYPES.includes(value as TourType) ? (value as TourType) : null
}

/** Serialize a database date to an ISO string, or null. */
function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null
}

/** Map a flattened directory row to the UI `TournamentSummary`. */
export function mapTournamentSummary(row: TournamentSearchRow): TournamentSummary {
  const hasLocation = Boolean(row.city || row.stateProvince || row.country)

  return {
    id: row.id,
    name: row.name,
    officialName: row.officialName,
    slug: row.slug,
    status: toStatus(row.status),
    startDate: toIso(row.startDate),
    endDate: toIso(row.endDate),
    season: row.seasonYear ?? null,
    tour: row.tourName
      ? { type: toTourType(row.tourType), name: row.tourName, code: row.tourCode ?? '' }
      : null,
    course: row.courseName ?? null,
    location: hasLocation
      ? {
          city: row.city ?? null,
          stateProvince: row.stateProvince ?? null,
          country: row.country ?? null,
        }
      : null,
    purse: typeof row.purse === 'number' && Number.isFinite(row.purse) ? row.purse : null,
    defendingChampion: row.defendingChampion ?? null,
  }
}
