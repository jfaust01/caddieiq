import { Cloud, TrendingUp, Zap, Users, Trophy, Newspaper, Wind, Heart } from "lucide-react"
import type { TimelineEvent } from "@/lib/timeline"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatTimestamp } from '@/features/tournaments/utils/format'
import { cn } from "@/lib/utils"

interface TimelineEventCardProps {
  event: TimelineEvent
  isExpanded?: boolean
  onExpand?: () => void
  onToggleFavorite?: () => void
}

const CATEGORY_ICONS = {
  weather: Cloud,
  odds: TrendingUp,
  dfs: Zap,
  betting: Trophy,
  news: Newspaper,
  field: Users,
  ratings: Wind,
  player: Users,
  round: Trophy,
  confidence: Trophy,
}

const IMPACT_COLORS = {
  high: "bg-red-500/20 text-red-700 border-red-200",
  medium: "bg-yellow-500/20 text-yellow-700 border-yellow-200",
  low: "bg-blue-500/20 text-blue-700 border-blue-200",
}

const CATEGORY_COLORS = {
  weather: "bg-sky-500/10 text-sky-700",
  odds: "bg-emerald-500/10 text-emerald-700",
  dfs: "bg-violet-500/10 text-violet-700",
  betting: "bg-orange-500/10 text-orange-700",
  news: "bg-slate-500/10 text-slate-700",
  field: "bg-cyan-500/10 text-cyan-700",
  ratings: "bg-indigo-500/10 text-indigo-700",
  player: "bg-pink-500/10 text-pink-700",
  round: "bg-amber-500/10 text-amber-700",
  confidence: "bg-teal-500/10 text-teal-700",
}

export function TimelineEventCard({
  event,
  isExpanded,
  onExpand,
  onToggleFavorite,
}: TimelineEventCardProps) {
  const Icon = CATEGORY_ICONS[event.category] || Trophy
  const impactColor = IMPACT_COLORS[event.impact]
  const categoryColor = CATEGORY_COLORS[event.category]

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-transparent"
      onClick={onExpand}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("p-2 rounded-lg shrink-0", categoryColor)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug">{event.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(event.timestamp)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.()
            }}
            className="shrink-0"
          >
            <Heart className={cn("w-4 h-4", event.isFavorited && "fill-red-500 text-red-500")} />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground line-clamp-2">{event.description}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className={cn("text-xs", impactColor)}>
            {event.impact.toUpperCase()} IMPACT
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {event.category}
          </Badge>
          {event.affectedPlayers.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {event.affectedPlayers.length} player{event.affectedPlayers.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Affected Players */}
        {event.affectedPlayers.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Players: </span>
            {event.affectedPlayers.slice(0, 3).join(", ")}
            {event.affectedPlayers.length > 3 && ` +${event.affectedPlayers.length - 3} more`}
          </div>
        )}

        {/* Value Changes */}
        {event.previousValue !== undefined && event.currentValue !== undefined && (
          <div className="text-xs bg-muted/50 p-2 rounded flex justify-between">
            <span>
              {event.previousValue} → <strong>{event.currentValue}</strong>
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
