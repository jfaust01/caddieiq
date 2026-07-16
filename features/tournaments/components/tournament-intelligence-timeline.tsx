import { useState, useMemo } from "react"
import type { Tournament } from "@/lib/domain/tournament"
import { extractTimelineEvents, groupEventsByDate, filterEvents } from "@/lib/timeline"
import { TimelineEventCard } from "./timeline-event-card"
import { TimelineFilters } from "./timeline-filters"
import type { TimelineEvent, EventCategory } from "@/lib/timeline"

interface TournamentIntelligenceTimelineProps {
  tournament: Tournament
}

export function TournamentIntelligenceTimeline({ tournament }: TournamentIntelligenceTimelineProps) {
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  // Extract events from tournament context
  const allEvents = useMemo(() => extractTimelineEvents(tournament), [tournament])

  // Filter events
  const filteredEvents = useMemo(() => {
    const categories = selectedCategories.length > 0 ? selectedCategories : undefined
    return filterEvents(allEvents, categories, undefined, searchQuery)
  }, [allEvents, selectedCategories, searchQuery])

  // Group by date
  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents])

  const handleToggleFavorite = (eventId: string) => {
    const newFavorites = new Set(favoriteIds)
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId)
    } else {
      newFavorites.add(eventId)
    }
    setFavoriteIds(newFavorites)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TimelineFilters
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        eventCount={filteredEvents.length}
      />

      {/* Timeline */}
      <div className="space-y-8">
        {groupedEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found. Try adjusting your filters.</p>
          </div>
        ) : (
          groupedEvents.map((group) => (
            <div key={group.date.toISOString()}>
              {/* Date header */}
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 sticky top-0 bg-background/95 py-2">
                {group.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {/* Events for this date */}
              <div className="space-y-3">
                {group.events.map((event) => (
                  <TimelineEventCard
                    key={event.id}
                    event={{
                      ...event,
                      isFavorited: favoriteIds.has(event.id),
                    }}
                    isExpanded={expandedEventId === event.id}
                    onExpand={() =>
                      setExpandedEventId(expandedEventId === event.id ? null : event.id)
                    }
                    onToggleFavorite={() => handleToggleFavorite(event.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
