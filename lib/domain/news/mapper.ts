/**
 * SportsDataIO → CaddieIQ news mapper.
 *
 * The isolation boundary for news data: the only place in the domain layer
 * allowed to reference the SportsDataIO news wire type, via `import type`.
 * Field translation only — no validation, no persistence, and no relationship
 * resolution (bridging `playerExternalId` to an internal id happens in the news
 * importer).
 *
 * The mapper copies across only what the provider supplies and leaves the rest
 * `null`; it never fabricates a missing field. The provider uses `PlayerID`
 * values of `0` (and occasionally negative) to mean "no associated player", so
 * those are normalized to `null`.
 */

import type { SdioNewsArticle } from "@/lib/providers/sportsdataio/types"
import { cleanNumber, cleanString, parseDate } from "../shared/utils"
import type { NewsArticleInput } from "./types"

const UNTITLED = "Untitled article"

/** Translate a raw SportsDataIO news row into a CaddieIQ {@link NewsArticleInput}. */
export function mapSportsDataNews(raw: SdioNewsArticle): NewsArticleInput {
  const playerId = cleanNumber(raw.PlayerID)
  const playerExternalId = playerId != null && playerId > 0 ? String(Math.trunc(playerId)) : null

  return {
    title: cleanString(raw.Title) ?? UNTITLED,
    content: cleanString(raw.Content),
    url: cleanString(raw.Url),
    outlet: cleanString(raw.Source),
    author: cleanString(raw.Author),
    categories: cleanString(raw.Categories),
    publishedAt: parseDate(raw.Updated),
    playerExternalId,
    externalRef: {
      source: "sportsdataio",
      externalId: String(raw.NewsID),
    },
  }
}
