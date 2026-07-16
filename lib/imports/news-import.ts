/**
 * News import & player linking.
 *
 * News articles are provider content stored in `news_articles`. SportsDataIO
 * exposes them via `/json/News`, so this module drives the full pipeline:
 *
 *   Provider   → fetch recent news + the players catalog (for the id bridge)
 *   Mapper     → map each raw article to a `NewsArticleInput`
 *   Bridge     → resolve the article's provider `PlayerID` → deterministic slug
 *                → CaddieIQ `Player.id`
 *   Repository → upsert each article on its unique `externalId` (NewsID)
 *
 * The association problem: the news feed carries only the provider's native
 * numeric `PlayerID` (never a name), and CaddieIQ has no external-id column —
 * players are reconciled by the deterministic slug of their name. So this
 * importer builds a `PlayerID → slug` map from the Players feed (reusing the
 * exact player mapper, so the slug matches how players were stored), then a
 * `slug → Player.id` map from the database, and chains them.
 *
 * Articles whose `PlayerID` does not resolve — general/tournament-wide news, or
 * a player not in our catalog — are still persisted with a `null` player rather
 * than discarded. Nothing is fabricated.
 */

import { mapSportsDataNews } from "@/lib/domain/news/mapper"
import { mapSportsDataPlayer } from "@/lib/domain/player/mapper"
import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { SportsDataProvider } from "@/lib/providers/sportsdataio/client"
import type { SdioNewsArticle, SdioPlayer } from "@/lib/providers/sportsdataio/types"
import {
  getNewsRepository,
  type NewsRepository,
  type ResolvedNewsArticle,
} from "@/lib/repositories"

/** Outcome of a news import run, suitable for an import report. */
export interface NewsImportSummary {
  /** Raw articles seen from the provider. */
  articlesSeen: number
  /** Articles newly created. */
  inserted: number
  /** Existing articles updated (idempotent re-run). */
  updated: number
  /** Articles whose write failed. */
  failed: number
  /** Articles linked to a player in our catalog. */
  linkedToPlayer: number
  /** Articles retained as general news (no resolvable player). */
  general: number
  /** Human-readable notes on skips/failures (bounded for log hygiene). */
  notes: string[]
}

export interface ImportNewsOptions {
  prisma?: PrismaClient
  provider?: SportsDataProvider
  repository?: NewsRepository
  /** Max number of notes to retain. */
  maxNotes?: number
}

/**
 * Import recent news and link each article to a player when its provider
 * `PlayerID` resolves. Idempotent: each article reconciles on its `externalId`.
 */
export async function importNews(
  options: ImportNewsOptions = {},
): Promise<NewsImportSummary> {
  const prisma = options.prisma ?? prismaClient
  const provider = options.provider ?? SportsDataProvider.fromEnv()
  const repository = options.repository ?? getNewsRepository()
  const maxNotes = options.maxNotes ?? 25

  const summary: NewsImportSummary = {
    articlesSeen: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    linkedToPlayer: 0,
    general: 0,
    notes: [],
  }
  const note = (message: string) => {
    if (summary.notes.length < maxNotes) summary.notes.push(message)
  }

  // Bridge part 1: provider PlayerID → deterministic slug, built from the
  // Players feed using the exact player mapper so slugs match what we stored.
  const externalIdToSlug = new Map<string, string>()
  try {
    const players = await provider.listPlayers()
    for (const raw of (players.data ?? []) as SdioPlayer[]) {
      const mapped = mapSportsDataPlayer(raw)
      externalIdToSlug.set(mapped.externalRef.externalId, mapped.slug)
    }
  } catch (error) {
    // Without the bridge we can still store general news; player linkage is lost
    // for this run. Report it rather than failing the whole import.
    note(`Players feed fetch failed (articles will be unlinked): ${(error as Error).message}`)
  }

  // Bridge part 2: slug → Player.id from our catalog (small table, load once).
  const dbPlayers = await prisma.player.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  })
  const playerIdBySlug = new Map(dbPlayers.map((p) => [p.slug, p.id]))

  // Provider: fetch recent news.
  let rawArticles: SdioNewsArticle[] = []
  try {
    const response = await provider.listNews()
    rawArticles = response.data ?? []
  } catch (error) {
    note(`News fetch failed: ${(error as Error).message}`)
    return summary
  }
  summary.articlesSeen = rawArticles.length

  // Mapper + bridge: map each article and resolve its player association.
  const resolved: ResolvedNewsArticle[] = rawArticles.map((raw) => {
    const article = mapSportsDataNews(raw)
    let playerId: string | null = null
    if (article.playerExternalId) {
      const slug = externalIdToSlug.get(article.playerExternalId)
      playerId = slug ? playerIdBySlug.get(slug) ?? null : null
    }
    if (playerId) summary.linkedToPlayer += 1
    else summary.general += 1
    return { playerId, article }
  })

  // Repository: idempotent bulk upsert.
  const result = await repository.bulkUpsert(resolved)
  summary.inserted += result.inserted
  summary.updated += result.updated
  summary.failed += result.failed
  for (const err of result.errors) {
    note(`Persist failed (${err.reference ?? "?"}): ${err.error.message}`)
  }

  return summary
}
