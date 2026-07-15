/**
 * Route-facing catalog of the live Ranking Engine categories the directory
 * exposes. Each entry maps a URL-friendly `slug` (used by `/rankings/[type]`)
 * to a {@link RankingCategory} the engine actually produces, plus display copy.
 *
 * This is intentionally the ONLY place the directory enumerates ranking types:
 * the tabs, the routes, and the server loader all read from here, so the live
 * categories can never drift out of sync with the engine. There is no mock
 * "deployed model" concept here — every option corresponds to a real board the
 * engine builds from the season-normalized analytics.
 */

import { RANKING_CATEGORY_META, RANKING_CATEGORY_ORDER } from '@/lib/rankings'
import type { RankingCategory } from '@/lib/rankings/types'

/** A single selectable ranking type in the directory. */
export interface RankingTypeOption {
  /** URL slug, e.g. `"recent-form"`. */
  slug: string
  /** The engine category this slug resolves to. */
  category: RankingCategory
  /** Full label for tabs and headings. */
  label: string
  /** One-line description of what the board orders by. */
  description: string
}

/** Stable URL slug for each engine category. */
const CATEGORY_SLUG: Record<RankingCategory, string> = {
  overall: 'overall',
  recentForm: 'recent-form',
  fantasy: 'fantasy',
  consistency: 'consistency',
  season: 'season',
}

/** One-line descriptions per category (what the board is ordered by). */
const CATEGORY_DESCRIPTION: Record<RankingCategory, string> = {
  overall: 'The composite CaddieIQ rating blending every analytics dimension.',
  recentForm: 'Who is trending up right now, by recent-form score.',
  fantasy: 'Best fantasy production per event — the value board.',
  consistency: 'Most reliable week-to-week producers.',
  season: 'Total season body of work.',
}

/** All directory ranking types, in the engine's canonical display order. */
export const RANKING_TYPE_OPTIONS: RankingTypeOption[] = RANKING_CATEGORY_ORDER.map(
  (category) => ({
    slug: CATEGORY_SLUG[category],
    category,
    label: RANKING_CATEGORY_META[category].label,
    description: CATEGORY_DESCRIPTION[category],
  }),
)

/** The default ranking type when none is specified (the composite board). */
export const DEFAULT_RANKING_TYPE = RANKING_TYPE_OPTIONS.find(
  (option) => option.category === 'overall',
)!

/** Resolve a URL slug to its ranking type, or `null` when unrecognized. */
export function rankingTypeFromSlug(slug: string): RankingTypeOption | null {
  return RANKING_TYPE_OPTIONS.find((option) => option.slug === slug) ?? null
}
