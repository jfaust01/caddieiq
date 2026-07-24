import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult, DfsValueTier } from '@/lib/dfs-value'

/**
 * Shared, data-safe formatting helpers for the status-aware fantasy tables.
 * Every helper returns an em-dash (`—`) for missing values rather than
 * fabricating data — never invent projections, ownership, odds, or results.
 */

/** Format a value as "—" when null/undefined, otherwise return it unchanged. */
export function formatMissing<T>(value: T | null | undefined): T | string {
  return value == null ? '—' : value
}

/** Format ownership as "X% Drafted" / "— Drafted" (handles 0–1 and 0–100). */
export function formatDraftedPercent(value: number | null | undefined): string {
  if (value == null || typeof value !== 'number' || !Number.isFinite(value)) {
    return '— Drafted'
  }
  const percent = value > 0 && value <= 1 ? value * 100 : value
  return `${Math.round(percent)}% Drafted`
}

/** Parse a betting-odds string to a sortable number (missing sorts last). */
export function parseOdds(odds: string | null | undefined): number {
  if (!odds) return Number.MAX_VALUE
  const num = parseInt(odds.replace(/[^\d-]/g, ''), 10)
  return Number.isNaN(num) ? Number.MAX_VALUE : num
}

/**
 * Honest finish result derived only from authoritative fields (status, cut
 * flag, position, ties). Returns Won / T4 / 15 / MC / WD / DQ / — — never a
 * fabricated tier. "Won" is only asserted for a non-tied position 1 (a T1 is
 * decided by a playoff that position alone cannot reveal).
 */
export function finishResult(e: FieldEntrant, isTie: boolean): string {
  if (e.status === 'WITHDRAWN' || e.withdrawn) return 'WD'
  if (e.status === 'DISQUALIFIED') return 'DQ'
  if (e.status === 'CUT' || e.cutMade === false) return 'MC'
  if (e.position == null) return '—'
  if (e.position === 1 && !isTie) return 'Won'
  return `${isTie ? 'T' : ''}${e.position}`
}

/** Emerald→red accent per DFS value tier (badge styling only). */
export const TIER_BADGE_CLASS: Record<DfsValueTier, string> = {
  A_PLUS: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
  A: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  B_PLUS: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
  B: 'border-sky-400/20 bg-sky-500/[0.08] text-sky-300',
  C: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  D: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
}

/** Read the 0–100 Course Fit signal from a DFS value result, or null. */
export function courseFitScore(result: DfsValueResult | undefined): number | null {
  if (!result) return null
  const fit = result.contributions.find((c) => c.key === 'courseFit')
  return fit && fit.status === 'scored' && fit.score != null ? Math.round(fit.score) : null
}
