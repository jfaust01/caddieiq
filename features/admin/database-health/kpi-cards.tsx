import { Database, Users, Clock, XCircle } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { DatabaseKpis } from "@/lib/system-health/database-health"

/**
 * Key performance indicator cards showing database metrics.
 */
export function KpiCards({ kpis }: { kpis: DatabaseKpis }) {
  const formatLastImport = (dateStr: string | null) => {
    if (!dateStr) return "Never"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const kpiItems = [
    {
      icon: Database,
      label: "Total Rows",
      value: kpis.totalRows.toLocaleString(),
      hint: `${kpis.totalTables} tables`,
    },
    {
      icon: Clock,
      label: "Last Import",
      value: formatLastImport(kpis.lastImportAt),
      hint: kpis.lastSuccessfulImportAt ? formatLastImport(kpis.lastSuccessfulImportAt) : "Never",
      hintLabel: "Last successful",
    },
    {
      icon: XCircle,
      label: "Failed (24h)",
      value: kpis.failedImportsLast24h.toString(),
      hint: kpis.averageImportDurationMs ? `Avg ${Math.round(kpis.averageImportDurationMs / 1000)}s` : "N/A",
      hintLabel: "Avg duration",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {kpiItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">{item.label}</span>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-semibold">{item.value}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.hintLabel || "Detail"}</span>
              <span>{item.hint}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
