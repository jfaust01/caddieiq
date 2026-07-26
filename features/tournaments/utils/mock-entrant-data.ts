import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Seeded pseudo-random number generator using playerId to ensure
 * deterministic values for server/client hydration consistency.
 */
function seededRandom(seed: string, index: number): number {
  // Simple hash-based pseudo-random: convert seed+index to a number between 0-1
  let hash = 0
  const combined = seed + index
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to 0-1 range
  return Math.abs(hash % 10000) / 10000
}

/**
 * Enriches entrant with mock data for fields that are not yet populated.
 * This allows the UI to display data while real data connections are being built.
 * Uses playerId as seed to ensure deterministic values for hydration.
 */
export function enrichEntrantWithMockData(entrant: FieldEntrant): FieldEntrant {
  const seed = entrant.playerId
  
  return {
    ...entrant,
    // Add mock DK fantasy points if not available
    dkFantasyPoints: entrant.dkFantasyPoints ?? generateMockDkScore(seed, 0),
    // Add mock round data if not available
    round1RelToPar: entrant.round1RelToPar ?? generateMockRoundScore(seed, 1),
    round2RelToPar: entrant.round2RelToPar ?? generateMockRoundScore(seed, 2),
    round3RelToPar: entrant.round3RelToPar ?? generateMockRoundScore(seed, 3),
    round4RelToPar: entrant.round4RelToPar ?? generateMockRoundScore(seed, 4),
    // Add mock DK points per round
    round1DkPoints: entrant.round1DkPoints ?? generateMockRoundDkScore(seed, 5),
    round2DkPoints: entrant.round2DkPoints ?? generateMockRoundDkScore(seed, 6),
    round3DkPoints: entrant.round3DkPoints ?? generateMockRoundDkScore(seed, 7),
    round4DkPoints: entrant.round4DkPoints ?? generateMockRoundDkScore(seed, 8),
    // Add mock salary if not available
    dfsSalary: entrant.dfsSalary ?? generateMockSalary(seed, 9),
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
