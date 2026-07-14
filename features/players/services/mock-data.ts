/**
 * Mock player dataset.
 *
 * This is placeholder data used to build and validate the Player domain UI
 * before any provider is connected. It is deterministic so the UI renders
 * identically on every load.
 *
 * TODO(data): remove once `PlayerService` reads from the live provider layer.
 */

import type {
  FormResult,
  Handedness,
  Nationality,
  Player,
  PlayerStatus,
  Tour,
} from '@/features/players/types'

const NATIONALITIES: Record<string, Nationality> = {
  USA: { code: 'USA', name: 'United States' },
  NIR: { code: 'NIR', name: 'Northern Ireland' },
  ESP: { code: 'ESP', name: 'Spain' },
  NOR: { code: 'NOR', name: 'Norway' },
  ENG: { code: 'ENG', name: 'England' },
  AUS: { code: 'AUS', name: 'Australia' },
  RSA: { code: 'RSA', name: 'South Africa' },
  CAN: { code: 'CAN', name: 'Canada' },
  JPN: { code: 'JPN', name: 'Japan' },
  KOR: { code: 'KOR', name: 'South Korea' },
  IRL: { code: 'IRL', name: 'Ireland' },
  SWE: { code: 'SWE', name: 'Sweden' },
  GER: { code: 'GER', name: 'Germany' },
  CHI: { code: 'CHI', name: 'Chile' },
  AUT: { code: 'AUT', name: 'Austria' },
}

const RECENT_EVENTS = [
  'The Open',
  'BMW Championship',
  'FedEx St. Jude',
  'Genesis Scottish Open',
  'Travelers Championship',
  'US Open',
]

interface PlayerSeed {
  firstName: string
  lastName: string
  nationality: keyof typeof NATIONALITIES
  tour: Tour
  worldRanking: number
  handedness: Handedness
  status: PlayerStatus
  age: number
  turnedPro: number
  /** Six most-recent finishes, newest first. */
  form: Array<number | 'CUT' | 'WD' | 'DQ'>
}

const SEEDS: PlayerSeed[] = [
  { firstName: 'Scottie', lastName: 'Scheffler', nationality: 'USA', tour: 'PGA', worldRanking: 1, handedness: 'RIGHT', status: 'ACTIVE', age: 29, turnedPro: 2018, form: [1, 1, 3, 2, 1, 6] },
  { firstName: 'Rory', lastName: 'McIlroy', nationality: 'NIR', tour: 'PGA', worldRanking: 2, handedness: 'RIGHT', status: 'ACTIVE', age: 36, turnedPro: 2007, form: [2, 4, 1, 12, 3, 'CUT'] },
  { firstName: 'Jon', lastName: 'Rahm', nationality: 'ESP', tour: 'LIV', worldRanking: 3, handedness: 'RIGHT', status: 'ACTIVE', age: 31, turnedPro: 2016, form: [5, 1, 8, 2, 4, 3] },
  { firstName: 'Viktor', lastName: 'Hovland', nationality: 'NOR', tour: 'PGA', worldRanking: 4, handedness: 'RIGHT', status: 'ACTIVE', age: 28, turnedPro: 2019, form: [9, 3, 15, 1, 22, 7] },
  { firstName: 'Xander', lastName: 'Schauffele', nationality: 'USA', tour: 'PGA', worldRanking: 5, handedness: 'RIGHT', status: 'ACTIVE', age: 32, turnedPro: 2015, form: [1, 6, 2, 4, 10, 2] },
  { firstName: 'Ludvig', lastName: 'Åberg', nationality: 'SWE', tour: 'PGA', worldRanking: 6, handedness: 'RIGHT', status: 'ACTIVE', age: 26, turnedPro: 2023, form: [2, 12, 5, 3, 'CUT', 8] },
  { firstName: 'Collin', lastName: 'Morikawa', nationality: 'USA', tour: 'PGA', worldRanking: 7, handedness: 'RIGHT', status: 'ACTIVE', age: 29, turnedPro: 2019, form: [4, 8, 3, 14, 6, 5] },
  { firstName: 'Patrick', lastName: 'Cantlay', nationality: 'USA', tour: 'PGA', worldRanking: 8, handedness: 'RIGHT', status: 'ACTIVE', age: 33, turnedPro: 2012, form: [11, 5, 9, 3, 18, 4] },
  { firstName: 'Wyndham', lastName: 'Clark', nationality: 'USA', tour: 'PGA', worldRanking: 9, handedness: 'RIGHT', status: 'ACTIVE', age: 32, turnedPro: 2017, form: [6, 22, 4, 'CUT', 12, 9] },
  { firstName: 'Hideki', lastName: 'Matsuyama', nationality: 'JPN', tour: 'PGA', worldRanking: 10, handedness: 'RIGHT', status: 'ACTIVE', age: 33, turnedPro: 2013, form: [3, 1, 12, 7, 5, 'CUT'] },
  { firstName: 'Brooks', lastName: 'Koepka', nationality: 'USA', tour: 'LIV', worldRanking: 12, handedness: 'RIGHT', status: 'ACTIVE', age: 35, turnedPro: 2012, form: [8, 2, 26, 4, 1, 15] },
  { firstName: 'Tommy', lastName: 'Fleetwood', nationality: 'ENG', tour: 'PGA', worldRanking: 13, handedness: 'RIGHT', status: 'ACTIVE', age: 34, turnedPro: 2010, form: [2, 7, 3, 9, 4, 6] },
  { firstName: 'Shane', lastName: 'Lowry', nationality: 'IRL', tour: 'PGA', worldRanking: 15, handedness: 'RIGHT', status: 'ACTIVE', age: 38, turnedPro: 2009, form: [10, 4, 6, 'CUT', 3, 12] },
  { firstName: 'Tyrrell', lastName: 'Hatton', nationality: 'ENG', tour: 'LIV', worldRanking: 16, handedness: 'RIGHT', status: 'ACTIVE', age: 34, turnedPro: 2011, form: [5, 9, 2, 14, 7, 3] },
  { firstName: 'Jason', lastName: 'Day', nationality: 'AUS', tour: 'PGA', worldRanking: 18, handedness: 'RIGHT', status: 'ACTIVE', age: 38, turnedPro: 2006, form: [12, 6, 'CUT', 8, 4, 19] },
  { firstName: 'Cameron', lastName: 'Smith', nationality: 'AUS', tour: 'LIV', worldRanking: 20, handedness: 'RIGHT', status: 'ACTIVE', age: 32, turnedPro: 2013, form: [7, 3, 11, 1, 'CUT', 9] },
  { firstName: 'Matt', lastName: 'Fitzpatrick', nationality: 'ENG', tour: 'PGA', worldRanking: 22, handedness: 'RIGHT', status: 'ACTIVE', age: 31, turnedPro: 2014, form: [14, 8, 5, 21, 6, 2] },
  { firstName: 'Robert', lastName: 'MacIntyre', nationality: 'ENG', tour: 'PGA', worldRanking: 24, handedness: 'LEFT', status: 'ACTIVE', age: 29, turnedPro: 2017, form: [3, 1, 12, 6, 9, 'CUT'] },
  { firstName: 'Sepp', lastName: 'Straka', nationality: 'AUT', tour: 'PGA', worldRanking: 26, handedness: 'RIGHT', status: 'ACTIVE', age: 32, turnedPro: 2015, form: [6, 4, 18, 2, 11, 7] },
  { firstName: 'Sungjae', lastName: 'Im', nationality: 'KOR', tour: 'PGA', worldRanking: 28, handedness: 'RIGHT', status: 'ACTIVE', age: 27, turnedPro: 2015, form: [9, 15, 4, 8, 3, 12] },
  { firstName: 'Corey', lastName: 'Conners', nationality: 'CAN', tour: 'PGA', worldRanking: 30, handedness: 'RIGHT', status: 'ACTIVE', age: 33, turnedPro: 2015, form: [11, 6, 22, 5, 14, 8] },
  { firstName: 'Adam', lastName: 'Scott', nationality: 'AUS', tour: 'PGA', worldRanking: 34, handedness: 'RIGHT', status: 'ACTIVE', age: 45, turnedPro: 2000, form: [18, 9, 7, 'CUT', 12, 5] },
  { firstName: 'Min Woo', lastName: 'Lee', nationality: 'AUS', tour: 'PGA', worldRanking: 38, handedness: 'RIGHT', status: 'ACTIVE', age: 27, turnedPro: 2019, form: [8, 3, 14, 6, 'CUT', 11] },
  { firstName: 'Joaquín', lastName: 'Niemann', nationality: 'CHI', tour: 'LIV', worldRanking: 42, handedness: 'RIGHT', status: 'ACTIVE', age: 27, turnedPro: 2018, form: [1, 5, 9, 2, 22, 4] },
  { firstName: 'Rasmus', lastName: 'Højgaard', nationality: 'SWE', tour: 'DP_WORLD', worldRanking: 48, handedness: 'RIGHT', status: 'ACTIVE', age: 24, turnedPro: 2019, form: [6, 12, 3, 9, 15, 'CUT'] },
  { firstName: 'Thomas', lastName: 'Detry', nationality: 'GER', tour: 'PGA', worldRanking: 55, handedness: 'RIGHT', status: 'INJURED', age: 32, turnedPro: 2015, form: [22, 14, 'WD', 8, 11, 6] },
  { firstName: 'Louis', lastName: 'Oosthuizen', nationality: 'RSA', tour: 'LIV', worldRanking: 64, handedness: 'RIGHT', status: 'ACTIVE', age: 43, turnedPro: 2002, form: [9, 6, 18, 3, 'CUT', 12] },
  { firstName: 'Justin', lastName: 'Thomas', nationality: 'USA', tour: 'PGA', worldRanking: 14, handedness: 'RIGHT', status: 'ACTIVE', age: 32, turnedPro: 2013, form: [4, 2, 11, 6, 8, 3] },
  { firstName: 'Keegan', lastName: 'Bradley', nationality: 'USA', tour: 'PGA', worldRanking: 21, handedness: 'RIGHT', status: 'ACTIVE', age: 39, turnedPro: 2008, form: [7, 12, 5, 'CUT', 9, 14] },
  { firstName: 'Si Woo', lastName: 'Kim', nationality: 'KOR', tour: 'PGA', worldRanking: 44, handedness: 'RIGHT', status: 'INACTIVE', age: 30, turnedPro: 2012, form: ['CUT', 22, 18, 11, 26, 9] },
]

function toSlug(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildRecentForm(
  slug: string,
  finishes: Array<number | 'CUT' | 'WD' | 'DQ'>,
): FormResult[] {
  const base = Date.UTC(2025, 6, 20) // deterministic anchor date
  return finishes.map((position, index) => ({
    id: `${slug}-form-${index}`,
    event: RECENT_EVENTS[index % RECENT_EVENTS.length],
    position,
    date: new Date(base - index * 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  }))
}

export const MOCK_PLAYERS: Player[] = SEEDS.map((seed) => {
  const slug = toSlug(seed.firstName, seed.lastName)
  return {
    id: slug,
    firstName: seed.firstName,
    lastName: seed.lastName,
    fullName: `${seed.firstName} ${seed.lastName}`,
    nationality: NATIONALITIES[seed.nationality],
    tour: seed.tour,
    worldRanking: seed.worldRanking,
    handedness: seed.handedness,
    status: seed.status,
    age: seed.age,
    turnedPro: seed.turnedPro,
    headshotUrl: null,
    recentForm: buildRecentForm(slug, seed.form),
  }
})

/** Unique, sorted nationality options derived from the dataset. */
export const MOCK_NATIONALITIES: Nationality[] = Array.from(
  new Map(MOCK_PLAYERS.map((p) => [p.nationality.code, p.nationality])).values(),
).sort((a, b) => a.name.localeCompare(b.name))
