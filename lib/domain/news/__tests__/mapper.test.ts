import { describe, expect, it } from "vitest"

import { mapSportsDataNews } from "../mapper"
import type { SdioNewsArticle } from "@/lib/providers/sportsdataio/types"

/** A representative raw SportsDataIO news row. */
function raw(overrides: Partial<SdioNewsArticle> = {}): SdioNewsArticle {
  return {
    NewsID: 998877,
    Title: "Ludvig Aberg Needs Bounce-Back After Missed Cut",
    Content: "Aberg missed the cut at the Genesis Scottish Open...",
    Url: "https://example.com/aberg",
    Source: "RotoBaller",
    Author: "Staff",
    Categories: "Injury,Preview",
    Updated: "2026-07-15T12:00:00",
    PlayerID: 40003252,
    ...overrides,
  }
}

describe("mapSportsDataNews", () => {
  it("translates a full row into a domain article with provenance", () => {
    const article = mapSportsDataNews(raw())

    expect(article.title).toBe("Ludvig Aberg Needs Bounce-Back After Missed Cut")
    expect(article.content).toBe("Aberg missed the cut at the Genesis Scottish Open...")
    expect(article.url).toBe("https://example.com/aberg")
    expect(article.outlet).toBe("RotoBaller")
    expect(article.author).toBe("Staff")
    expect(article.categories).toBe("Injury,Preview")
    expect(article.publishedAt).toBeInstanceOf(Date)
    expect(article.playerExternalId).toBe("40003252")
    expect(article.externalRef).toEqual({ source: "sportsdataio", externalId: "998877" })
  })

  it("maps absent optional fields to null rather than inventing them", () => {
    const article = mapSportsDataNews(
      raw({
        Content: undefined,
        Url: undefined,
        Source: undefined,
        Author: undefined,
        Categories: undefined,
        Updated: undefined,
      }),
    )
    expect(article.content).toBeNull()
    expect(article.url).toBeNull()
    expect(article.outlet).toBeNull()
    expect(article.author).toBeNull()
    expect(article.categories).toBeNull()
    expect(article.publishedAt).toBeNull()
  })

  it("falls back to a placeholder title when the row has no usable title", () => {
    expect(mapSportsDataNews(raw({ Title: "   " })).title).toBe("Untitled article")
    expect(mapSportsDataNews(raw({ Title: undefined })).title).toBe("Untitled article")
  })

  it("normalizes non-positive player ids to null (general / unlinked news)", () => {
    expect(mapSportsDataNews(raw({ PlayerID: 0 })).playerExternalId).toBeNull()
    expect(mapSportsDataNews(raw({ PlayerID: -1 })).playerExternalId).toBeNull()
    expect(mapSportsDataNews(raw({ PlayerID: undefined })).playerExternalId).toBeNull()
  })

  it("always stringifies the NewsID as the idempotency key", () => {
    expect(mapSportsDataNews(raw({ NewsID: 12345 })).externalRef.externalId).toBe("12345")
  })
})
