import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ratingLabel, type CoverageRating } from "@/lib/data-coverage"
import type { HealthState } from "@/lib/data-coverage/types"

/** Fill color per rating for the coverage bar. */
const BAR_COLOR: Record<CoverageRating, string> = {
  excellent: "bg-success",
  good: "bg-primary",
  partial: "bg-warning",
  "needs-attention": "bg-destructive",
  restricted: "bg-muted-foreground/50",
}

/** Text + subtle background per rating for the badge. */
const BADGE_COLOR: Record<CoverageRating, string> = {
  excellent: "bg-success/12 text-success",
  good: "bg-primary/12 text-primary",
  partial: "bg-warning/15 text-warning-foreground",
  "needs-attention": "bg-destructive/12 text-destructive",
  restricted: "bg-muted text-muted-foreground",
}

/** A themed, accessible progress bar for a coverage percentage. */
export function CoverageBar({
  percent,
  rating,
  className,
}: {
  percent: number | null
  rating: CoverageRating
  className?: string
}) {
  const width = percent ?? 0
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={percent ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Coverage ${percent === null ? "unknown" : `${percent} percent`}`}
    >
      <div
        className={cn("h-full rounded-full transition-all", BAR_COLOR[rating])}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

/** A pill communicating the rating band (Excellent / Good / … / Restricted). */
export function RatingBadge({ rating }: { rating: CoverageRating }) {
  return (
    <Badge className={cn("border-transparent", BADGE_COLOR[rating])}>
      {ratingLabel(rating)}
    </Badge>
  )
}

const HEALTH_DOT: Record<HealthState, string> = {
  healthy: "bg-success",
  connected: "bg-success",
  restricted: "bg-warning",
  "not-configured": "bg-muted-foreground/50",
  unreachable: "bg-destructive",
}

const HEALTH_LABEL: Record<HealthState, string> = {
  healthy: "Healthy",
  connected: "Connected",
  restricted: "Restricted",
  "not-configured": "Not Configured",
  unreachable: "Unreachable",
}

/** A small status dot + label for platform-health rows. */
export function HealthStatus({ state }: { state: HealthState }) {
  return (
    <span className="flex items-center gap-2 text-sm font-medium">
      <span className={cn("size-2 shrink-0 rounded-full", HEALTH_DOT[state])} aria-hidden />
      {HEALTH_LABEL[state]}
    </span>
  )
}
