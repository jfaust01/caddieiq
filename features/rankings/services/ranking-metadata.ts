/**
 * Mock presentation metadata for the ranking roster.
 *
 * The Ranking Engine works with opaque player ids and labels only. The Rankings
 * UI needs richer, human-facing fields (nationality, tour, events, recent-form)
 * to render country flags, filters, and the recent-form strip. This module maps
 * each engine player id to that metadata.
 *
 * Everything here is deterministic mock data.
 * TODO(data): replace with real player records (joined from the domain model)
 * once the data platform is connected. The engine ids will map to Player.id.
 */

import type { FormResult, Nationality, Tour } from '@/features/players/types'

const NATIONALITIES: Record<string, Nationality> = {
  USA: { code: 'USA', name: 'United States' },
  NIR: { code: 'NIR', name: 'Northern Ireland' },
  SWE: { code: 'SWE', name: 'Sweden' },
  NOR: { code: 'NOR', name: 'Norway' },
  ENG: { code: 'ENG', name: 'England' },
  IRL: { code: 'IRL', name: 'Ireland' },
  AUT: { code: 'AUT', name: 'Austria' },
}

/** Presentation metadata for a single ranked player. */
export interface RankingPlayerMetadata {
  name: string
  nationality: Nationality
  tour: Tour
  events: number
  headshotUrl: string | null
  recentForm: FormResult[]
}

const RECENT_EVENTS = [
  'The Open',
  'BMW Championship',
  'Tour Championship',
  'the Memorial',
  'Travelers Champ.',
]

/** Build a deterministic recent-form strip from a list of finishing positions. */
function buildForm(
  playerId: string,
  positions: FormResult['position'][],
): FormResult[] {
  return positions.map((position, index) => ({
    id: `${playerId}-form-${index}`,
    event: RECENT_EVENTS[index] ?? `Event ${index + 1}`,
    position,
    // Static, deterministic dates — newest first.
    date: `2025-0${(index % 8) + 1}-15`,
  }))
}

/**
 * Metadata keyed by the engine's mock roster ids (see
 * `lib/ranking/ranking-service.ts`). Kept in sync with that roster.
 */
export const RANKING_PLAYER_METADATA: Record<string, RankingPlayerMetadata> = {
  'p-scheffler': {
    name: 'Scottie Scheffler',
    nationality: NATIONALITIES.USA,
    tour: 'PGA',
    events: 22,
    headshotUrl: null,
    recentForm: buildForm('p-scheffler', [1, 2, 1, 4, 1]),
  },
  'p-mcilroy': {
    name: 'Rory McIlroy',
    nationality: NATIONALITIES.NIR,
    tour: 'PGA',
    events: 20,
    headshotUrl: null,
    recentForm: buildForm('p-mcilroy', [1, 6, 3, 2, 12]),
  },
  'p-schauffele': {
    name: 'Xander Schauffele',
    nationality: NATIONALITIES.USA,
    tour: 'PGA',
    events: 21,
    headshotUrl: null,
    recentForm: buildForm('p-schauffele', [2, 5, 8, 1, 3]),
  },
  'p-aberg': {
    name: 'Ludvig Åberg',
    nationality: NATIONALITIES.SWE,
    tour: 'PGA',
    events: 19,
    headshotUrl: null,
    recentForm: buildForm('p-aberg', [4, 3, 'CUT', 7, 2]),
  },
  'p-morikawa': {
    name: 'Collin Morikawa',
    nationality: NATIONALITIES.USA,
    tour: 'PGA',
    events: 21,
    headshotUrl: null,
    recentForm: buildForm('p-morikawa', [6, 4, 9, 3, 5]),
  },
  'p-hovland': {
    name: 'Viktor Hovland',
    nationality: NATIONALITIES.NOR,
    tour: 'PGA',
    events: 20,
    headshotUrl: null,
    recentForm: buildForm('p-hovland', [12, 8, 'CUT', 5, 18]),
  },
  'p-cantlay': {
    name: 'Patrick Cantlay',
    nationality: NATIONALITIES.USA,
    tour: 'PGA',
    events: 20,
    headshotUrl: null,
    recentForm: buildForm('p-cantlay', [7, 9, 4, 11, 6]),
  },
  'p-fleetwood': {
    name: 'Tommy Fleetwood',
    nationality: NATIONALITIES.ENG,
    tour: 'DP_WORLD',
    events: 23,
    headshotUrl: null,
    recentForm: buildForm('p-fleetwood', [3, 5, 2, 14, 8]),
  },
  'p-thomas': {
    name: 'Justin Thomas',
    nationality: NATIONALITIES.USA,
    tour: 'PGA',
    events: 22,
    headshotUrl: null,
    recentForm: buildForm('p-thomas', [9, 15, 6, 'CUT', 4]),
  },
  'p-fowler': {
    name: 'Rickie Fowler',
    nationality: NATIONALITIES.USA,
    tour: 'PGA',
    events: 24,
    headshotUrl: null,
    recentForm: buildForm('p-fowler', ['CUT', 22, 18, 31, 'CUT']),
  },
  'p-lowry': {
    name: 'Shane Lowry',
    nationality: NATIONALITIES.IRL,
    tour: 'DP_WORLD',
    events: 21,
    headshotUrl: null,
    recentForm: buildForm('p-lowry', [8, 11, 5, 16, 9]),
  },
  'p-straka': {
    name: 'Sepp Straka',
    nationality: NATIONALITIES.AUT,
    tour: 'PGA',
    events: 23,
    headshotUrl: null,
    recentForm: buildForm('p-straka', [5, 7, 13, 6, 10]),
  },
}

/** Fallback metadata for any id missing from the map above. */
export function fallbackMetadata(
  playerId: string,
  label: string,
): RankingPlayerMetadata {
  return {
    name: label,
    nationality: { code: '—', name: 'Unknown' },
    tour: 'PGA',
    events: 18,
    headshotUrl: null,
    recentForm: buildForm(playerId, [10, 12, 8, 15, 11]),
  }
}
