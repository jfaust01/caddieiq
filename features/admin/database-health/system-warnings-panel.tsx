import { AlertCircle, AlertTriangle, Info } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SystemWarning } from "@/lib/system-health/database-health"

/**
 * Display system warnings with severity indicators and suggested actions.
 */
export function SystemWarningsPanel({ warnings }: { warnings: SystemWarning[] }) {
  const getCriticalCount = () => warnings.filter((w) => w.severity === "critical").length
  const getWarningCount = () => warnings.filter((w) => w.severity === "warning").length

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="size-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
      case "info":
        return <Info className="size-5 text-blue-600 dark:text-blue-400" />
      default:
        return null
    }
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/15 text-destructive"
      case "warning":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      case "info":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Card className="bg-destructive/15 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide uppercase text-destructive">Critical Issues</span>
            <span className="text-xl font-bold text-destructive">{getCriticalCount()}</span>
          </div>
        </Card>
        <Card className="bg-amber-500/15 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide uppercase text-amber-600 dark:text-amber-400">Warnings</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{getWarningCount()}</span>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {warnings.map((warning) => (
          <Card key={warning.id} className="p-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 pt-0.5">{getSeverityIcon(warning.severity)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{warning.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{warning.reason}</p>
                  </div>
                  <Badge className={cn("flex-shrink-0", getSeverityBadgeClass(warning.severity))}>
                    {warning.severity.charAt(0).toUpperCase() + warning.severity.slice(1)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Suggested Action:</span>
                  <span className="text-xs text-muted-foreground">{warning.suggestedAction}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
