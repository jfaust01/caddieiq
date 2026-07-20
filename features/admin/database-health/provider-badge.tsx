import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DataProvider } from "@/lib/system-health/database-health"
import { cn } from "@/lib/utils"

interface ProviderBadgeProps {
  provider: DataProvider
}

const PROVIDER_CONFIG = {
  sportsdataio: {
    label: "SportsDataIO",
    emoji: "🟦",
    tooltip: "Tournament schedules, players, fantasy scoring, statistics, rankings, odds and news.",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  golfcourseapi: {
    label: "GolfCourseAPI",
    emoji: "🟩",
    tooltip: "Golf courses, holes, tees, yardages, GPS coordinates, course metadata and specifications.",
    color: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  internal: {
    label: "CaddieIQ",
    emoji: "🟨",
    tooltip: "Data generated internally by CaddieIQ from imported provider data.",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  multiple: {
    label: "Multiple Providers",
    emoji: "🟪",
    tooltip: "Data merged from multiple providers during tournament-to-course matching.",
    color: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const config = PROVIDER_CONFIG[provider]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn("cursor-help whitespace-nowrap", config.color)}>
            <span className="mr-1">{config.emoji}</span>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
