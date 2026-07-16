import type { Tournament } from "@/lib/domain/tournament"
import type { TimelineEvent } from "./types"

/**
 * Extract all timeline events from tournament.
 * Pure function - derives events from existing data without fabrication.
 */
export function extractTimelineEvents(tournament: Tournament): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // For now, create a minimal set of events from tournament data
  // This can be expanded with more sophisticated extraction logic
  const weather = (tournament as any).weather
  if (weather) {
    events.push({
      id: `weather-${Date.now()}`,
      timestamp: new Date(weather.timestamp || Date.now()),
      category: "weather",
      title: `Weather Update: ${weather.condition || "Unknown"}`,
      description: `Weather conditions recorded`,
      affectedPlayers: [],
      impact: "medium",
      source: "weather",
    })
  }

  // Odds changes - extract from tournament odds if available
  const odds = (tournament as any).odds
  if (odds && Array.isArray(odds) && odds.length > 0) {
    for (const odd of odds.slice(0, 5)) {
      const playerId = odd.playerId || `Player ${odds.indexOf(odd) + 1}`
      events.push({
        id: `odds-${playerId}-${Date.now()}`,
        timestamp: new Date(odd.timestamp || Date.now()),
        category: "odds",
        title: `Odds Update: ${playerId}`,
        description: `Odds updated for player`,
        affectedPlayers: [playerId],
        impact: "low",
        source: "odds",
      })
    }
  }

  // DFS news/slate updates
  const dfsContext = (tournament as any).dfsContext
  if (dfsContext?.slateInfo) {
    events.push({
      id: `dfs-slate-${Date.now()}`,
      timestamp: new Date(dfsContext.slateInfo.timestamp || Date.now()),
      category: "dfs",
      title: "DFS Slate Information",
      description: `DFS slate information available`,
      affectedPlayers: [],
      impact: "high",
      source: "dfs",
    })
  }

  // Field changes
  const field = (tournament as any).field
  if (field && Array.isArray(field) && field.length > 0) {
    const fieldSize = field.length
    events.push({
      id: `field-update-${Date.now()}`,
      timestamp: new Date(Date.now()),
      category: "field",
      title: "Field Update",
      description: `Current field size: ${fieldSize} players`,
      affectedPlayers: [],
      impact: fieldSize < 50 ? "high" : "low",
      currentValue: fieldSize,
      source: "system",
    })
  }

  // News events (if available)
  const news = (tournament as any).news
  if (news && Array.isArray(news) && news.length > 0) {
    for (const newsItem of news.slice(0, 3)) {
      const newsId = newsItem.id || `news-${news.indexOf(newsItem)}`
      events.push({
        id: `news-${newsId}-${Date.now()}`,
        timestamp: new Date(newsItem.timestamp || Date.now()),
        category: "news",
        title: newsItem.title || "News Update",
        description: newsItem.summary || newsItem.content || "News item",
        affectedPlayers: newsItem.affectedPlayers || [],
        impact: newsItem.impact || "low",
        source: "news",
      })
    }
  }

  // Sort by timestamp descending (newest first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Group events by date for timeline view
 */
export function groupEventsByDate(events: TimelineEvent[]) {
  const groups = new Map<string, TimelineEvent[]>()

  for (const event of events) {
    const dateKey = event.timestamp.toISOString().split("T")[0]
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(event)
  }

  return Array.from(groups.entries())
    .map(([dateStr, events]) => ({
      date: new Date(dateStr),
      events,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Filter events by category, source, and search query
 */
export function filterEvents(
  events: TimelineEvent[],
  categories?: string[],
  sources?: string[],
  searchQuery?: string,
) {
  return events.filter((event) => {
    if (categories && !categories.includes(event.category)) return false
    if (sources && !sources.includes(event.source)) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.affectedPlayers.some((p) => p.toLowerCase().includes(query))
      )
    }
    return true
  })
}
