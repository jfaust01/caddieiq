/**
 * Row → UI mapper for the Tournament feature. Pure translation only: it turns a
 * flattened `TournamentSearchRow` (from the repository) into the
 * provider-agnostic `TournamentSummary` the directory renders. No fetching, no
 * database access.
 */

import type {
  FieldEntrant,
  FieldEntryStatus,
  TournamentStatus,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'
import type { FieldEntryRow } from '@/lib/repositories/field-repository'
import type { TournamentSearchRow } from '@/lib/repositories/tournament-repository'

const TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELED',
]

const TOUR_TYPES: readonly TourType[] = ['PGA', 'DP_WORLD', 'LIV', 'KORN_FERRY', 'LPGA']

const FIELD_STATUSES: readonly FieldEntryStatus[] = [
  'CONFIRMED',
  'ALTERNATE',
  'WITHDRAWN',
  'DISQUALIFIED',
  'CUT',
  'FINISHED',
]

/** Narrow a raw field-status string to the UI enum, defaulting to `CONFIRMED`. */
function toFieldStatus(value: string | null): FieldEntryStatus {
  return FIELD_STATUSES.includes(value as FieldEntryStatus)
    ? (value as FieldEntryStatus)
    : 'CONFIRMED'
}

/**
 * Map a flattened field row to the UI `FieldEntrant`.
 *
 * The ranking scores default to null here (this mapper is a pure row
 * translation); the tournament service enriches them from the Ranking/Analytics
 * engines so the scores stay a single derived source rather than a duplicate.
 */
export function mapFieldEntrant(row: FieldEntryRow): FieldEntrant {
  return {
    playerId: row.playerId,
    playerName: row.playerName,
    countryCode: row.countryCode ?? null,
    headshotUrl: row.headshotUrl ?? null,
    tour: row.tour ?? null,
    status: toFieldStatus(row.status),
    isAlternate: row.isAlternate,
    withdrawn: row.withdrawn,
    cutMade: row.cutMade ?? null,
    worldRanking: row.worldRanking ?? null,
    rankingScore: null,
    formScore: null,
    fantasyScore: null,
    position: row.position ?? null,
    total: row.totalRelativeToPar ?? null,
    totalStrokes: row.totalStrokes ?? null,
    totalDkFantasyPoints: row.dkFantasyPoints ?? null,
    thruHole: null, // Not implemented
    roundScore: null, // Not implemented
    projection: row.projection ? row.projection.toString() : null,
    startingTime: null, // Not implemented
    dkFantasyPoints: row.dkFantasyPoints ?? null,
    oddsToWin: row.odds ?? null,
    ownershipPercent: row.ownershipPercent ?? null,
    round1: row.round1 ?? null,
    round1RelToPar: row.round1RelToPar ?? null,
    round1DkPoints: null, // Per-round DK points not yet implemented
    round2: row.round2 ?? null,
    round2RelToPar: row.round2RelToPar ?? null,
    round2DkPoints: null,
    round3: row.round3 ?? null,
    round3RelToPar: row.round3RelToPar ?? null,
    round3DkPoints: null,
    round4: row.round4 ?? null,
    round4RelToPar: row.round4RelToPar ?? null,
    round4DkPoints: null,
  }
}

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
    courseRef:
      row.courseId && row.courseName
        ? {
            id: row.courseId,
            name: row.courseName,
            par: typeof row.coursePar === 'number' ? row.coursePar : null,
            yardage: typeof row.courseYardage === 'number' ? row.courseYardage : null,
          }
        : null,
    location: hasLocation
      ? {
          city: row.city ?? null,
          stateProvince: row.stateProvince ?? null,
          country: row.country ?? null,
        }
      : null,
    purse: typeof row.purse === 'number' && Number.isFinite(row.purse) ? row.purse : null,
    totalDkFantasyPoints: typeof (row as any).totalDkFantasyPoints === 'number' && Number.isFinite((row as any).totalDkFantasyPoints) ? (row as any).totalDkFantasyPoints : null,
    tournamentWinner:
      (row as any).tournamentWinnerPlayerId &&
      (row as any).tournamentWinnerPlayerName
        ? {
            playerId: (row as any).tournamentWinnerPlayerId,
            playerName: (row as any).tournamentWinnerPlayerName,
            headshotUrl: (row as any).tournamentWinnerHeadshotUrl ?? null,
            scoreToPar: typeof (row as any).tournamentWinnerScoreToPar === 'number' && Number.isFinite((row as any).tournamentWinnerScoreToPar) ? (row as any).tournamentWinnerScoreToPar : null,
            dkFantasyPoints: typeof (row as any).tournamentWinnerDkFantasyPoints === 'number' && Number.isFinite((row as any).tournamentWinnerDkFantasyPoints) ? (row as any).tournamentWinnerDkFantasyPoints : null,
          }
        : null,
    topDkScorer:
      (row as any).topDkScorerPlayerId &&
      (row as any).topDkScorerPlayerName &&
      typeof (row as any).topDkScorerDkFantasyPoints === 'number' &&
      Number.isFinite((row as any).topDkScorerDkFantasyPoints)
        ? {
            playerId: (row as any).topDkScorerPlayerId,
            playerName: (row as any).topDkScorerPlayerName,
            headshotUrl: (row as any).topDkScorerHeadshotUrl ?? null,
            dkFantasyPoints: (row as any).topDkScorerDkFantasyPoints,
          }
        : null,
    defendingChampion: row.defendingChampion ?? null,
    cutLine: typeof row.cutLine === 'number' && Number.isFinite(row.cutLine) ? row.cutLine : null,
    cutAfterRounds: typeof row.cutAfterRounds === 'number' && Number.isFinite(row.cutAfterRounds) ? row.cutAfterRounds : null,
  }
}
