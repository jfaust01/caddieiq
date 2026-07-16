/**
 * AI Caddie — pure intent router.
 *
 * Classifies a raw natural-language question into a {@link CaddieIntent} using
 * deterministic keyword / synonym / regex matching. No I/O, no randomness — the
 * same text always yields the same route, which makes it fully unit-testable.
 *
 * Ordering matters: more specific intents are tested before broader ones (e.g.
 * "compare" and "why is X rated" beat generic board lookups).
 */

import type { CaddieIntent, CaddieRouteResult } from "./types"

interface IntentRule {
  readonly intent: CaddieIntent
  /** Any of these phrases (case-insensitive substring) triggers the intent. */
  readonly terms: readonly string[]
}

/**
 * Rules in priority order. The first rule with a matched term wins, so place
 * narrow, high-signal intents first.
 */
const RULES: readonly IntentRule[] = [
  {
    intent: "explain_rating",
    terms: ["why is", "why does", "explain", "how come", "reason for", "what makes", "justify"],
  },
  {
    intent: "compare_players",
    terms: ["compare", "versus", " vs ", " vs. ", "who is better", "who's better", "head to head", "head-to-head", "or "],
  },
  {
    intent: "underpriced",
    terms: ["underpriced", "under priced", "undervalued", "cheap", "value play", "value plays", "bargain", "salary saver", "punt", "leverage"],
  },
  {
    intent: "best_gpp_plays",
    terms: ["gpp", "tournament play", "tournament plays", "ceiling", "upside", "boom", "large field", "risky", "differentiate", "leverage play"],
  },
  {
    intent: "best_cash_plays",
    terms: ["cash", "cash play", "cash plays", "safe", "floor", "double up", "50/50", "stable", "best dfs", "best value", "top value", "best plays", "best lineup"],
  },
  {
    intent: "course_fit",
    terms: ["course fit", "fits the course", "fit the course", "good fit", "best fit", "course history", "suits", "who fits"],
  },
  {
    intent: "fades",
    terms: ["fade", "fades", "avoid", "stay away", "worst fit", "bad fit", "who to sit"],
  },
  {
    intent: "top_form",
    terms: ["form", "hot", "playing well", "in form", "best iron", "best putter", "best driver", "longest driver", "scrambler", "trending", "streaking", "momentum"],
  },
  {
    intent: "odds_favorites",
    terms: ["odds", "favorite", "favorites", "win probability", "chance to win", "betting", "book", "moneyline", "outright", "to win"],
  },
  {
    intent: "weather",
    terms: ["weather", "wind", "windy", "rain", "forecast", "conditions", "temperature", "gust", "wave"],
  },
  {
    intent: "capabilities",
    terms: ["help", "what can you", "what do you", "how do you work", "capabilities", "examples", "what questions"],
  },
]

/** Words we never treat as player-name fragments during extraction. */
const STOP_WORDS = new Set([
  "the", "and", "for", "who", "what", "why", "how", "is", "are", "best",
  "top", "this", "week", "compare", "vs", "versus", "or", "a", "an", "of",
  "in", "on", "to", "me", "show", "give", "list", "players", "player",
  "plays", "play", "should", "i", "my", "with", "at", "this", "that",
])

/**
 * Very light player-name extraction: capitalized word runs, and tokens around
 * comparison connectors. This only *hints* candidate names to answerers; the
 * answerers resolve them against the actual field (so a bad guess simply fails
 * to match and degrades honestly — it never fabricates a player).
 */
function extractPlayerNames(raw: string): string[] {
  const names: string[] = []

  // Capitalized runs (e.g. "Jon Rahm", "Tommy Fleetwood").
  const capitalized = raw.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)
  if (capitalized) {
    for (const c of capitalized) {
      if (!STOP_WORDS.has(c.toLowerCase())) names.push(c.trim())
    }
  }

  // Split around comparison connectors to catch lowercase inputs.
  const connectorSplit = raw.split(/\s+(?:vs\.?|versus|or|compared to|against)\s+/i)
  if (connectorSplit.length > 1) {
    for (const part of connectorSplit) {
      const cleaned = part
        .replace(/compare|who is better|who's better|head[- ]to[- ]head/gi, "")
        .trim()
      if (cleaned && cleaned.length >= 3 && !names.includes(cleaned)) {
        // Only keep short-ish fragments that look like a name, not a sentence.
        if (cleaned.split(/\s+/).length <= 3) names.push(cleaned)
      }
    }
  }

  // De-dupe case-insensitively, preserve order.
  const seen = new Set<string>()
  return names.filter((n) => {
    const k = n.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Classify a raw question into an intent + extracted params. Pure. */
export function routeCaddieQuestion(raw: string): CaddieRouteResult {
  const text = ` ${raw.toLowerCase().trim()} `
  const matchedTerms: string[] = []

  for (const rule of RULES) {
    const hit = rule.terms.find((term) => text.includes(term.toLowerCase()))
    if (hit) {
      matchedTerms.push(hit.trim())
      // For compare, require at least two candidate names; otherwise let it
      // fall through so "or" in a non-compare sentence doesn't misfire.
      if (rule.intent === "compare_players") {
        const names = extractPlayerNames(raw)
        if (names.length < 2) continue
        return { intent: "compare_players", params: { playerNames: names, raw }, matchedTerms }
      }
      return {
        intent: rule.intent,
        params: { playerNames: extractPlayerNames(raw), raw },
        matchedTerms,
      }
    }
  }

  return { intent: "unknown", params: { playerNames: extractPlayerNames(raw), raw }, matchedTerms: [] }
}
