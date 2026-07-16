/**
 * News-article domain model.
 *
 * A `NewsArticleInput` is the CaddieIQ representation of one provider news
 * article, independent of any provider. It mirrors the persistence model
 * (`NewsArticle`) so a repository can map it 1:1, but imports nothing from
 * Prisma or a provider.
 *
 * Player association is deliberately expressed as `playerExternalId` — the
 * provider's native numeric player id, as a string — because the news feed
 * carries only that id (never a name). CaddieIQ has no external-id column, so
 * resolving it to a real `Player.id` is a persistence-time concern handled by
 * the news importer, which bridges `playerExternalId → deterministic slug →
 * Player.id` using the Players feed. Articles whose id does not resolve are
 * retained with a null player rather than discarded.
 *
 * Every content field is nullable and means "not reported by the source". The
 * mapper copies across only what the provider supplies and never fabricates a
 * missing field.
 */

import type { HasExternalReference } from "../shared/types"

/** One provider news article, pre-reconciliation. */
export interface NewsArticleInput extends HasExternalReference {
  /** Headline. */
  title: string
  /** Article body / summary; `null` when unreported. */
  content: string | null
  /** Canonical article URL; `null` when unreported. */
  url: string | null
  /** Publishing outlet (e.g. "RotoBaller"); `null` when unreported. */
  outlet: string | null
  /** Byline; `null` when unreported. */
  author: string | null
  /** Comma-separated provider categories, verbatim; `null` when unreported. */
  categories: string | null
  /** When the provider last updated the article; `null` when unreported. */
  publishedAt: Date | null
  /**
   * Provider's native player id (as a string) this article is about, or `null`
   * for general / tournament-wide news. Reconciled to a `Player.id` by the
   * importer — never stored as-is.
   */
  playerExternalId: string | null
}
