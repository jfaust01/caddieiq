import { X } from "lucide-react"
import type { EventCategory } from "@/lib/timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface TimelineFiltersProps {
  selectedCategories: EventCategory[]
  onCategoriesChange: (categories: EventCategory[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  eventCount: number
}

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "weather", label: "Weather" },
  { value: "odds", label: "Odds" },
  { value: "dfs", label: "DFS" },
  { value: "betting", label: "Betting" },
  { value: "news", label: "News" },
  { value: "field", label: "Field" },
  { value: "ratings", label: "Ratings" },
  { value: "player", label: "Player" },
  { value: "round", label: "Round" },
  { value: "confidence", label: "Confidence" },
]

export function TimelineFilters({
  selectedCategories,
  onCategoriesChange,
  searchQuery,
  onSearchChange,
  eventCount,
}: TimelineFiltersProps) {
  const handleCategoryToggle = (category: EventCategory) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    onCategoriesChange(updated)
  }

  const handleClearAll = () => {
    onCategoriesChange([])
    onSearchChange("")
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      {/* Search */}
      <div>
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Category filters */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">Filter by category:</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategories.includes(cat.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryToggle(cat.value)}
              className="text-xs h-8"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Active filters display */}
      {(selectedCategories.length > 0 || searchQuery) && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
                <button
                  onClick={() =>
                    onCategoriesChange(selectedCategories.filter((c) => c !== cat))
                  }
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{eventCount} event(s)</span>
            {(selectedCategories.length > 0 || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-7 text-xs">
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
