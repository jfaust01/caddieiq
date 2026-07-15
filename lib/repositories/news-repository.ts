/**
 * News-article repository.
 *
 * The only layer permitted to persist news articles (stored in `news_articles`).
 * It accepts already-mapped {@link NewsArticleInput} domain objects whose player
 * association has already been resolved to a CaddieIQ id (or `null`) by the news
 * importer — it never maps, validates, or fetches.
 *
 * Idempotency: reconciliation is keyed by the unique provider `externalId`
 * (NewsID), so re-importing updates each article in place rather than
 * duplicating it. Like the statistics repository it upserts directly rather than
 * via `upsertBySlug`.
 */

import type { NewsArticleInput } from "@/lib/domain/news/types"
import type {
  NewsArticle as NewsArticleRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import {
  fail,
  ok,
  type BulkRepositoryResult,
  type RepositoryResult,
} from "./repository-result"

/**
 * A mapped article whose player association has already been resolved by the
 * importer: `playerId` is the CaddieIQ id, or `null` for general / unresolved
 * news. The domain {@link NewsArticleInput} intentionally carries only the
 * provider's `playerExternalId`; bridging that to a real `Player.id` is a
 * persistence-time concern the importer owns before calling the repository.
 */
export interface ResolvedNewsArticle {
  playerId: string | null
  article: NewsArticleInput
}

/** A news article flattened for UI rendering. */
export interface NewsArticleView {
  id: string
  title: string
  content: string | null
  url: string | null
  outlet: string | null
  author: string | null
  publishedAt: Date | null
  playerId: string | null
}

const VIEW_SELECT = {
  id: true,
  title: true,
  content: true,
  url: true,
  outlet: true,
  author: true,
  publishedAt: true,
  playerId: true,
} as const

export class NewsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "news", sink)
  }

  /**
   * Idempotently persist one resolved article, reconciled on the unique
   * provider `externalId`.
   */
  async upsert(
    resolved: ResolvedNewsArticle,
  ): Promise<RepositoryResult<NewsArticleRecord>> {
    const { playerId, article } = resolved
    const reference = article.externalRef.externalId
    const data = {
      title: article.title,
      content: article.content,
      url: article.url,
      outlet: article.outlet,
      author: article.author,
      categories: article.categories,
      publishedAt: article.publishedAt,
      playerId,
      source: article.externalRef.source,
    }
    try {
      const existing = await this.prisma.newsArticle.findUnique({
        where: { externalId: reference },
        select: { id: true },
      })
      const record = await this.prisma.newsArticle.upsert({
        where: { externalId: reference },
        create: { externalId: reference, ...data },
        update: data,
      })
      const created = !existing
      created ? this.logger.insert(reference) : this.logger.update(reference)
      return ok(record, created ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "newsArticle",
        operation: "upsert",
        reference,
      })
      this.logger.failure(reference, repoError.message, { code: repoError.code })
      return fail<NewsArticleRecord>(repoError)
    }
  }

  /** Idempotently persist a batch of resolved articles. Never throws per item. */
  async bulkUpsert(
    rows: readonly ResolvedNewsArticle[],
  ): Promise<BulkRepositoryResult<NewsArticleRecord>> {
    return this.runBulk(
      rows,
      (r) => r.article.externalRef.externalId,
      (r) => this.upsert(r),
    )
  }

  /**
   * Most recent articles for a specific player, newest first. Read-only.
   * Articles with a null `publishedAt` sort last.
   */
  async listByPlayer(playerId: string, limit = 5): Promise<NewsArticleView[]> {
    return this.prisma.newsArticle.findMany({
      where: { playerId },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: VIEW_SELECT,
    })
  }

  /**
   * Most recent player-linked articles for the given player ids, grouped as a
   * `playerId → articles` map (each list newest first, capped at
   * `perPlayer`). Used to decorate a tournament field without an N+1 query.
   * Read-only.
   */
  async latestForPlayers(
    playerIds: readonly string[],
    perPlayer = 3,
  ): Promise<Map<string, NewsArticleView[]>> {
    const result = new Map<string, NewsArticleView[]>()
    if (playerIds.length === 0) return result
    const rows = await this.prisma.newsArticle.findMany({
      where: { playerId: { in: [...playerIds] } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: VIEW_SELECT,
    })
    for (const row of rows) {
      if (!row.playerId) continue
      const list = result.get(row.playerId) ?? []
      if (list.length < perPlayer) {
        list.push(row)
        result.set(row.playerId, list)
      }
    }
    return result
  }

  /**
   * Most recent articles across all players/topics, newest first. Read-only.
   * Used for the tournament hub's general news rail.
   */
  async listRecent(limit = 8): Promise<NewsArticleView[]> {
    return this.prisma.newsArticle.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: VIEW_SELECT,
    })
  }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _newsRepository: NewsRepository | undefined
export function getNewsRepository(): NewsRepository {
  return (_newsRepository ??= new NewsRepository())
}
