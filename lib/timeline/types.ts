import type { Tournament } from "@/lib/domain/tournament"

export type EventCategory =
  | "weather"
  | "odds"
  | "dfs"
  | "betting"
  | "news"
  | "field"
  | "ratings"
  | "player"
  | "round"
  | "confidence"

export interface TimelineEvent {
  id: string
  timestamp: Date
  category: EventCategory
  title: string
  description: string
  affectedPlayers: string[]
  impact: "high" | "medium" | "low"
  previousValue?: number | string
  currentValue?: number | string
  reason?: string
  relatedEventIds?: string[]
  source: "weather" | "odds" | "dfs" | "news" | "field" | "ai" | "system"
  isFavorited?: boolean
}

export interface TimelineFilterOptions {
  categories: EventCategory[]
  sources: TimelineEvent["source"][]
  players: string[]
  rounds: number[]
  impactLevel?: "high" | "medium" | "low"
  searchQuery?: string
}

export interface TimelineEventGroup {
  date: Date
  events: TimelineEvent[]
}
