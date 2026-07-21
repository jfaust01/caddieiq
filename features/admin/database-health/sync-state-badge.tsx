import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SyncState } from "@/lib/system-health/database-health"
import { cn } from "@/lib/utils"

interface SyncStateBadgeProps {
  syncState: SyncState
}

const SYNC_STATE_CONFIG = {
  synced: {
    label: "Synced",
    icon: "✅",
    tooltip: "Data successfully imported and up-to-date.",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  "awaiting-import": {
    label: "Awaiting Import",
    icon: "⏳",
    tooltip: "Data available but import has not run yet.",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  "pending-verification": {
    label: "Pending Verification",
    icon: "⚠️",
    tooltip: "Data import requires manual verification before processing.",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  "not-generated": {
    label: "Not Generated",
    icon: "⚙️",
    tooltip: "Data will be generated when upstream tables are populated.",
    color: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  },
  error: {
    label: "Error",
    icon: "❌",
    tooltip: "An error occurred during import or generation.",
    color: "bg-destructive/15 text-destructive",
  },
}

export function SyncStateBadge({ syncState }: SyncStateBadgeProps) {
  const config = SYNC_STATE_CONFIG[syncState]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("cursor-help whitespace-nowrap", config.color)}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
