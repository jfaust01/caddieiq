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
  const mockOwnership = generateMockOwnership(seed, 10)
  const mockOdds = generateMockOdds(seed, 11)
  
  // Use existing values if available, otherwise use mock values
  const r1 = entrant.round1RelToPar !== null && entrant.round1RelToPar !== undefined ? entrant.round1RelToPar : mockRound1
  const r2 = entrant.round2RelToPar !== null && entrant.round2RelToPar !== undefined ? entrant.round2RelToPar : mockRound2
  const r3 = entrant.round3RelToPar !== null && entrant.round3RelToPar !== undefined ? entrant.round3RelToPar : mockRound3
  const r4 = entrant.round4RelToPar !== null && entrant.round4RelToPar !== undefined ? entrant.round4RelToPar : mockRound4
  
  // Calculate total by summing available round scores
  const roundScores = [r1, r2, r3, r4].filter(score => score !== null && score !== undefined)
  const mockTotal = roundScores.length > 0 ? roundScores.reduce((a, b) => a + b, 0) : null
  
  return {
    ...entrant,
    // Add mock DK fantasy points if not available
    dkFantasyPoints: entrant.dkFantasyPoints !== null && entrant.dkFantasyPoints !== undefined ? entrant.dkFantasyPoints : mockDkScore,
    // Add mock total score if not available
    total: entrant.total !== null && entrant.total !== undefined ? entrant.total : mockTotal,
    // Add mock round data if not available
    round1RelToPar: r1,
    round2RelToPar: r2,
    round3RelToPar: r3,
    round4RelToPar: r4,
    // Add mock DK points per round
    round1DkPoints: entrant.round1DkPoints !== null && entrant.round1DkPoints !== undefined ? entrant.round1DkPoints : mockRound1Dk,
    round2DkPoints: entrant.round2DkPoints !== null && entrant.round2DkPoints !== undefined ? entrant.round2DkPoints : mockRound2Dk,
    round3DkPoints: entrant.round3DkPoints !== null && entrant.round3DkPoints !== undefined ? entrant.round3DkPoints : mockRound3Dk,
    round4DkPoints: entrant.round4DkPoints !== null && entrant.round4DkPoints !== undefined ? entrant.round4DkPoints : mockRound4Dk,
    // Add mock salary if not available
    dfsSalary: entrant.dfsSalary !== null && entrant.dfsSalary !== undefined ? entrant.dfsSalary : mockSalary,
    // Add mock ownership if not available
    ownershipPercent: entrant.ownershipPercent !== null && entrant.ownershipPercent !== undefined ? entrant.ownershipPercent : mockOwnership,
    // Add mock odds if not available
    oddsToWin: entrant.oddsToWin !== null && entrant.oddsToWin !== undefined ? entrant.oddsToWin : mockOdds,
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
 * Generates a deterministic mock round score relative to par (-6 to +6).
 * For pro golfers, individual rounds typically range from -6 (eagle round) to +6 (tough day).
 */
function generateMockRoundScore(seed: string, index: number): number {
  const rand = seededRandom(seed, index)
  // Weighted towards slightly negative (under par) for pro golfers
  // Center around -1 (one under par average)
  return Math.round((rand - 0.6) * 12)
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

/**
 * Generates a deterministic mock DFS ownership percentage (typically 0-25%).
 */
function generateMockOwnership(seed: string, index: number): number {
  const rand = seededRandom(seed, index)
  return Math.round(rand * 25)
}

/**
 * Generates a deterministic mock odds to win in decimal format (typically +300 to +10000).
 * Converts random value to american odds format (e.g., "+500", "+1200", etc).
 */
function generateMockOdds(seed: string, index: number): string {
  const rand = seededRandom(seed, index)
  // Generate odds ranging from +300 to +10000 in roughly $500 increments
  const odds = Math.round(rand * 98 + 3) * 100
  return `+${odds}`
}
