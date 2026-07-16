import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ratingLabel, type CoverageRating } from "@/lib/data-coverage"
import type { HealthState, ImportRunOutcome, TableHealth } from "@/lib/data-coverage/types"

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

const RUN_BADGE_COLOR: Record<ImportRunOutcome, string> = {
  SUCCESS: "bg-success/12 text-success",
  // PARTIAL is the honest state for a knowingly-degraded feed (e.g. trial-tier
  // scrambling) — warning-toned, not a failure.
  PARTIAL: "bg-warning/15 text-warning-foreground",
  FAILURE: "bg-destructive/12 text-destructive",
  never: "bg-muted text-muted-foreground",
}

const RUN_BADGE_LABEL: Record<ImportRunOutcome, string> = {
  SUCCESS: "Success",
  PARTIAL: "Partial",
  FAILURE: "Failed",
  never: "Never run",
}

/** A pill communicating the recorded outcome of a pipeline's last import run. */
export function ImportRunBadge({ outcome }: { outcome: ImportRunOutcome }) {
  return (
    <Badge className={cn("border-transparent", RUN_BADGE_COLOR[outcome])}>
      {RUN_BADGE_LABEL[outcome]}
    </Badge>
  )
}

const TABLE_HEALTH_COLOR: Record<TableHealth, string> = {
  healthy: "bg-success/12 text-success",
  // Legitimately empty for now — informational, not alarming.
  waiting: "bg-primary/12 text-primary",
  // Reserved for an unbuilt sprint — neutral.
  future: "bg-muted text-muted-foreground",
  // Blocked by the provider tier — warning-toned like other restricted states.
  "provider-limited": "bg-warning/15 text-warning-foreground",
  obsolete: "bg-muted-foreground/20 text-muted-foreground line-through",
  // Should hold data but does not — the one genuinely bad state.
  broken: "bg-destructive/12 text-destructive",
}

const TABLE_HEALTH_LABEL: Record<TableHealth, string> = {
  healthy: "Healthy",
  waiting: "Waiting",
  future: "Future",
  "provider-limited": "Provider Limited",
  obsolete: "Obsolete",
  broken: "Broken",
}

/** A pill communicating a table's reconciled inventory health. */
export function TableHealthBadge({ health }: { health: TableHealth }) {
  return (
    <Badge className={cn("border-transparent", TABLE_HEALTH_COLOR[health])}>
      {TABLE_HEALTH_LABEL[health]}
    </Badge>
  )
}

export { TABLE_HEALTH_LABEL }
