import type { AnalyticsBand } from '@/lib/analytics/types'

/**
 * Maps a 0-100 AI rating score to an AnalyticsBand and semantic color.
 * Thresholds match the Analytics Engine's band classification.
 */
export function getRatingBand(score: number | null | undefined): {
  band: AnalyticsBand | null
  colorClass: string
} {
  if (score === null || score === undefined) {
    return {
      band: null,
      colorClass: 'text-muted-foreground',
    }
  }

  if (score >= 85) {
    return {
      band: 'ELITE',
      colorClass: 'text-emerald-400',
    }
  }

  if (score >= 70) {
    return {
      band: 'STRONG',
      colorClass: 'text-cyan-400',
    }
  }

  if (score >= 55) {
    return {
      band: 'SOLID',
      colorClass: 'text-blue-400',
    }
  }

  if (score >= 40) {
    return {
      band: 'AVERAGE',
      colorClass: 'text-yellow-400',
    }
  }

  return {
    band: 'DEVELOPING',
    colorClass: 'text-orange-400',
  }
}

/**
 * Gets the progress bar color class based on rating score.
 */
export function getProgressBarColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'bg-muted-foreground/20'
  }

  if (score >= 85) {
    return 'bg-emerald-400/40'
  }

  if (score >= 70) {
    return 'bg-cyan-400/40'
  }

  if (score >= 55) {
    return 'bg-blue-400/40'
  }

  if (score >= 40) {
    return 'bg-yellow-400/40'
  }

  return 'bg-orange-400/40'
}

/**
 * Gets the progress bar fill color based on rating score.
 */
export function getProgressBarFillColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'bg-muted-foreground/40'
  }

  if (score >= 85) {
    return 'bg-emerald-400'
  }

  if (score >= 70) {
    return 'bg-cyan-400'
  }

  if (score >= 55) {
    return 'bg-blue-400'
  }

  if (score >= 40) {
    return 'bg-yellow-400'
  }

  return 'bg-orange-400'
}
