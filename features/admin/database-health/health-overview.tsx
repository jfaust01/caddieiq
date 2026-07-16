import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Overall health status display with percentage and status indicator.
 */
export function HealthOverview({
  status,
  healthPercentage,
  generatedAt,
}: {
  status: "Healthy" | "Warning" | "Critical"
  healthPercentage: number
  generatedAt: string
}) {
  const isHealthy = status === "Healthy"
  const isWarning = status === "Warning"
  const isCritical = status === "Critical"

  const statusIcon =
    isHealthy || isWarning ? (
      <CheckCircle2 className={cn("size-6", isHealthy ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")} />
    ) : (
      <AlertCircle className="size-6 text-destructive" />
    )

  const statusColor = isHealthy ? "emerald" : isWarning ? "amber" : "destructive"
  const bgClass = isHealthy ? "bg-emerald-500/15" : isWarning ? "bg-amber-500/15" : "bg-destructive/15"
  const textClass = isHealthy ? "text-emerald-600 dark:text-emerald-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-destructive"

  return (
    <Card className={cn("p-8", bgClass)}>
      <div className="flex items-start justify-between gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {statusIcon}
            <h2 className="text-2xl font-semibold">Database Health</h2>
          </div>
          <p className={cn("text-sm", textClass)}>
            Overall Status: <span className="font-semibold">{status}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={cn("text-4xl font-bold", textClass)}>{healthPercentage}%</div>
          <div className="flex h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "rounded-full transition-all",
                isHealthy ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-destructive",
              )}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Health Score</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Last updated: {generatedAt.slice(0, 16).replace("T", " ")} UTC</p>
    </Card>
  )
}
