import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Seeded pseudo-random number generator using playerId to ensure
 * deterministic values for server/client hydration consistency.
 * Uses MurmurHash3 algorithm for better distribution.
 */
function seededRandom(seed: string, index: number): number {
  let hash = 0
  const combined = seed + '|' + index
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Use unsigned right shift to convert to positive number
  hash = hash >>> 0
  // Convert to 0-1 range using modulo
  return (hash % 1000) / 1000
}

/**
 * Enriches entrant with mock data for fields that are not yet populated.
 * This allows the UI to display data while real data connections are being built.
 * Uses playerId as seed to ensure deterministic values for hydration.
 */
export function enrichEntrantWithMockData(entrant: FieldEntrant): FieldEntrant {
  const seed = entrant.playerId
  
  // Always generate the same mock values for a given playerId to ensure hydration consistency
  const mockDkScore = generateMockDkScore(seed, 0)
  const mockRound1 = generateMockRoundScore(seed, 1)
  const mockRound2 = generateMockRoundScore(seed, 2)
  const mockRound3 = generateMockRoundScore(seed, 3)
  const mockRound4 = generateMockRoundScore(seed, 4)
  const mockRound1Dk = generateMockRoundDkScore(seed, 5)
  const mockRound2Dk = generateMockRoundDkScore(seed, 6)
  const mockRound3Dk = generateMockRoundDkScore(seed, 7)
  const mockRound4Dk = generateMockRoundDkScore(seed, 8)
  const mockSalary = generateMockSalary(seed, 9)
  
  return {
    ...entrant,
    // Add mock DK fantasy points if not available
    dkFantasyPoints: entrant.dkFantasyPoints !== null && entrant.dkFantasyPoints !== undefined ? entrant.dkFantasyPoints : mockDkScore,
    // Add mock round data if not available
    round1RelToPar: entrant.round1RelToPar !== null && entrant.round1RelToPar !== undefined ? entrant.round1RelToPar : mockRound1,
    round2RelToPar: entrant.round2RelToPar !== null && entrant.round2RelToPar !== undefined ? entrant.round2RelToPar : mockRound2,
    round3RelToPar: entrant.round3RelToPar !== null && entrant.round3RelToPar !== undefined ? entrant.round3RelToPar : mockRound3,
    round4RelToPar: entrant.round4RelToPar !== null && entrant.round4RelToPar !== undefined ? entrant.round4RelToPar : mockRound4,
    // Add mock DK points per round
    round1DkPoints: entrant.round1DkPoints !== null && entrant.round1DkPoints !== undefined ? entrant.round1DkPoints : mockRound1Dk,
    round2DkPoints: entrant.round2DkPoints !== null && entrant.round2DkPoints !== undefined ? entrant.round2DkPoints : mockRound2Dk,
    round3DkPoints: entrant.round3DkPoints !== null && entrant.round3DkPoints !== undefined ? entrant.round3DkPoints : mockRound3Dk,
    round4DkPoints: entrant.round4DkPoints !== null && entrant.round4DkPoints !== undefined ? entrant.round4DkPoints : mockRound4Dk,
    // Add mock salary if not available
    dfsSalary: entrant.dfsSalary !== null && entrant.dfsSalary !== undefined ? entrant.dfsSalary : mockSalary,
  }
}

/**
 * Enriches an array of entrants with mock data.
 */
export function enrichEntrantsWithMockData(entrants: FieldEntrant[]): FieldEntrant[] {
  return entrants.map(enrichEntrantWithMockData)
}

/**
 * Generates a deterministic mock DK fantasy score (typically 20-60 points).
 */
function generateMockDkScore(seed: string, index: number): number {
  const rand = seededRandom(seed, index)
  return Math.round(rand * 40 + 20)
}

/**
 * Generates a deterministic mock round score relative to par (-8 to +8).
 */
function generateMockRoundScore(seed: string, index: number): number {
  const rand = seededRandom(seed, index)
  return Math.round((rand - 0.5) * 16)
}

/**
 * Generates a deterministic mock DK points per round (typically 10-35 points).
 */
function generateMockRoundDkScore(seed: string, index: number): number {
  const rand = seededRandom(seed, index)
  return Math.round(rand * 25 + 10)
}

/**
 * Generates a deterministic mock DraftKings salary (typically $3K-$11K in $100 increments).
 */
function generateMockSalary(seed: string, index: number): number {
  const rand = seededRandom(seed, index)
  return Math.round(rand * 80 + 30) * 100
}
