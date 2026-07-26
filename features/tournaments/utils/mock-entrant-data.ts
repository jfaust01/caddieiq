import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Enriches entrant with mock data for fields that are not yet populated.
 * This allows the UI to display data while real data connections are being built.
 */
export function enrichEntrantWithMockData(entrant: FieldEntrant): FieldEntrant {
  return {
    ...entrant,
    // Add mock DK fantasy points if not available
    dkFantasyPoints: entrant.dkFantasyPoints ?? generateMockDkScore(),
    // Add mock round data if not available
    round1RelToPar: entrant.round1RelToPar ?? generateMockRoundScore(),
    round2RelToPar: entrant.round2RelToPar ?? generateMockRoundScore(),
    round3RelToPar: entrant.round3RelToPar ?? generateMockRoundScore(),
    round4RelToPar: entrant.round4RelToPar ?? generateMockRoundScore(),
    // Add mock DK points per round
    round1DkPoints: entrant.round1DkPoints ?? generateMockRoundDkScore(),
    round2DkPoints: entrant.round2DkPoints ?? generateMockRoundDkScore(),
    round3DkPoints: entrant.round3DkPoints ?? generateMockRoundDkScore(),
    round4DkPoints: entrant.round4DkPoints ?? generateMockRoundDkScore(),
    // Add mock salary if not available
    dfsSalary: entrant.dfsSalary ?? generateMockSalary(),
  }
}

/**
 * Enriches an array of entrants with mock data.
 */
export function enrichEntrantsWithMockData(entrants: FieldEntrant[]): FieldEntrant[] {
  return entrants.map(enrichEntrantWithMockData)
}

/**
 * Generates a mock DK fantasy score (typically 20-60 points).
 */
function generateMockDkScore(): number {
  return Math.round(Math.random() * 40 + 20)
}

/**
 * Generates a mock round score relative to par (-8 to +8).
 */
function generateMockRoundScore(): number {
  return Math.round((Math.random() - 0.5) * 16)
}

/**
 * Generates a mock DK points per round (typically 10-35 points).
 */
function generateMockRoundDkScore(): number {
  return Math.round(Math.random() * 25 + 10)
}

/**
 * Generates a mock DraftKings salary (typically $3K-$11K in $100 increments).
 */
function generateMockSalary(): number {
  return (Math.round(Math.random() * 80 + 30) * 100)
}
