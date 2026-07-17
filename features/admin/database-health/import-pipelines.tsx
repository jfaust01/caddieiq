'use client'

import { RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ImportPipelineCard } from "@/lib/system-health/database-health"
import { importTournamentsAction } from "./actions/import-tournaments"

/**
 * Display import pipeline cards with status, recency, and performance metrics.
 */
export function ImportPipelines({ pipelines }: { pipelines: ImportPipelineCard[] }) {
  const [mounted, setMounted] = useState(false)
  const [loadingPipeline, setLoadingPipeline] = useState<string | null>(null)
  const [refreshResult, setRefreshResult] = useState<{
    pipeline: string
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = async (pipelineName: string) => {
    setLoadingPipeline(pipelineName)
    setRefreshResult(null)

    try {
      if (pipelineName === "Tournaments") {
        const result = await importTournamentsAction()
        if (result.success) {
          setRefreshResult({
            pipeline: pipelineName,
            success: true,
            message: `Tournament import completed. ${result.data?.mapping ? `Created ${result.data.mapping.mappingsCreated} mappings, reused ${result.data.mapping.mappingsReused}.` : ""}`,
          })
        } else {
          setRefreshResult({
            pipeline: pipelineName,
            success: false,
            message: result.error || "Import failed",
          })
        }
      }
      // Add other pipeline handlers here as needed
    } catch (error) {
      setRefreshResult({
        pipeline: pipelineName,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoadingPipeline(null)
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      case "Waiting":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      case "Expected Empty":
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400"
      case "Import Pending":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      case "Error":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400"
      case "Critical":
        return "bg-destructive/15 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return "Never run"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return dateStr.slice(0, 10)
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—"
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pipelines.map((pipeline) => (
        <Card key={pipeline.name} className="flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="font-semibold">{pipeline.name}</h3>
            <Badge className={cn("flex-shrink-0", getStatusColor(pipeline.status))}>{pipeline.status}</Badge>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Run:</span>
              <span className="font-mono text-xs">
                {mounted ? formatLastRun(pipeline.lastRunAt) : pipeline.lastRunAt?.slice(0, 10) || "Never run"}
              </span>
            </div>

            {pipeline.durationMs !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-mono text-xs">{formatDuration(pipeline.durationMs)}</span>
              </div>
            )}

            {pipeline.rowsImported !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rows Imported:</span>
                <span className="font-mono text-xs">{pipeline.rowsImported.toLocaleString()}</span>
              </div>
            )}

            {pipeline.errors !== null && pipeline.errors > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Errors:</span>
                <span className="font-mono text-xs text-destructive">{pipeline.errors}</span>
              </div>
            )}
          </div>

          {/* Manual Refresh */}
          {pipeline.supportsManualRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="mt-auto gap-2"
              disabled={pipeline.status === "Error" || loadingPipeline !== null}
              onClick={() => handleRefresh(pipeline.name)}
              title="Trigger manual import for this pipeline"
            >
              <RefreshCw className={cn("size-4", loadingPipeline === pipeline.name && "animate-spin")} />
              {loadingPipeline === pipeline.name ? "Importing..." : "Refresh"}
            </Button>
          )}
        </Card>
      ))}

      {/* Result Notification */}
      {refreshResult && (
        <Card className={cn("p-4", refreshResult.success ? "border-emerald-500/50 bg-emerald-500/10" : "border-destructive/50 bg-destructive/10")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className={cn("font-semibold", refreshResult.success ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>
                {refreshResult.pipeline} Import {refreshResult.success ? "Completed" : "Failed"}
              </h4>
              <p className={cn("mt-1 text-sm", refreshResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-destructive/80")}>
                {refreshResult.message}
              </p>
            </div>
            <button
              onClick={() => setRefreshResult(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
