import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getProviderInfo, type DataProvider } from "@/lib/data-coverage/provider-config"

/**
 * Provider badge component that displays the data source for a table.
 * Includes a tooltip with provider details.
 */
export function ProviderBadge({ provider }: { provider: DataProvider }) {
  const info = getProviderInfo(provider)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn("border-transparent cursor-help", info.color)}>
            <span className="mr-1.5">{info.badge}</span>
            {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{info.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
