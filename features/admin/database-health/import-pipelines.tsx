'use client'

import { RefreshCw } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ImportPipelineCard } from "@/lib/system-health/database-health"
import { importTournamentsAction } from "./actions/import-tournaments"
import { startTournamentMappingAction } from "./actions/start-tournament-mapping"
import { getTournamentMappingStatusAction } from "./actions/get-tournament-mapping-status"

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
  const [mappingStatus, setMappingStatus] = useState<{
    status: "in_progress" | "completed" | "failed"
    total: number
    alreadyMapped: number
    completed: number
    percentage: number
    created: number
    updated: number
    reused: number
    failed: number
    apiCallsMade: number
    totalDurationMs: number
    message: string
    runId: string
  } | null>(null)
  const [mappingRunId, setMappingRunId] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Poll for mapping status updates
  const pollMappingStatus = useCallback(async () => {
    if (!mappingRunId) return

    try {
      const result = await getTournamentMappingStatusAction(mappingRunId)
      if (result.success && result.data) {
        setMappingStatus(result.data)
        // Stop polling if completed or failed
        if (result.data.status === "completed" || result.data.status === "failed") {
          setIsPolling(false)
          if (pollIntervalId) {
            clearInterval(pollIntervalId)
            setPollIntervalId(null)
          }
        }
      } else if (result.error) {
        console.error("Error fetching mapping status:", result.error)
        setIsPolling(false)
      }
    } catch (error) {
      console.error("Error polling mapping status:", error)
    }
  }, [mappingRunId, pollIntervalId])

  // Start polling when mapping begins
  const startMappingPolling = useCallback((runId: string) => {
    setMappingRunId(runId)
    setIsPolling(true)
    // Poll immediately
    pollMappingStatus()
    // Then set up interval for every 2 seconds
    const interval = setInterval(pollMappingStatus, 2000)
    setPollIntervalId(interval)
  }, [pollMappingStatus])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId)
      }
    }
  }, [pollIntervalId])

  const handleRefresh = async (pipelineName: string) => {
    setLoadingPipeline(pipelineName)
    setRefreshResult(null)

    try {
      if (pipelineName === "Tournaments") {
        // Step 1: Run tournament import
        const importResult = await importTournamentsAction()
        if (importResult.success) {
          setRefreshResult({
            pipeline: pipelineName,
            success: true,
            message: `Tournament import completed with ${importResult.data?.summary?.inserted || 0} new tournaments. Starting course mapping in background...`,
          })

          // Step 2: Start background mapping job
          const mappingStartResult = await startTournamentMappingAction()
          if (mappingStartResult.success && mappingStartResult.data?.runId) {
            // Step 3: Begin polling for mapping status with the run ID
            startMappingPolling(mappingStartResult.data.runId)
          } else {
            setRefreshResult({
              pipeline: pipelineName,
              success: false,
              message: "Failed to start mapping workflow - no run ID returned",
            })
          }
        } else {
          setRefreshResult({
            pipeline: pipelineName,
            success: false,
            message: importResult.error || "Import failed",
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
              disabled={loadingPipeline !== null}
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

      {/* Mapping Status Notification */}
      {mappingStatus && (
        <Card className={cn(
          "p-4",
          mappingStatus.status === "in_progress" ? "border-blue-500/50 bg-blue-500/10" :
          mappingStatus.status === "completed" ? "border-emerald-500/50 bg-emerald-500/10" :
          "border-destructive/50 bg-destructive/10"
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className={cn(
                "font-semibold",
                mappingStatus.status === "in_progress" ? "text-blue-700 dark:text-blue-300" :
                mappingStatus.status === "completed" ? "text-emerald-700 dark:text-emerald-300" :
                "text-destructive"
              )}>
                {mappingStatus.status === "in_progress" && "Course Mapping in Progress"}
                {mappingStatus.status === "completed" && "Course Mapping Completed"}
                {mappingStatus.status === "failed" && "Course Mapping Failed"}
              </h4>
              <p className={cn(
                "mt-1 text-xs",
                mappingStatus.status === "in_progress" ? "text-blue-600 dark:text-blue-400" :
                mappingStatus.status === "completed" ? "text-emerald-600 dark:text-emerald-400" :
                "text-destructive/80"
              )}>
                {mappingStatus.message}
              </p>

              <div className="mt-3 space-y-2">
                {/* Progress bar - only show for in_progress */}
                {mappingStatus.status === "in_progress" && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Processing unmapped:</span>
                      <span className="font-mono text-xs">
                        {mappingStatus.completed}/{mappingStatus.total - mappingStatus.alreadyMapped} ({mappingStatus.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${mappingStatus.percentage}%` }}
                      />
                    </div>
                  </>
                )}

                {/* Summary metrics - always show */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="text-muted-foreground">
                    <span className="block">Already Valid:</span>
                    <span className="font-mono font-semibold">{mappingStatus.alreadyMapped}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="block">Created:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{mappingStatus.created}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="block">Updated:</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{mappingStatus.updated}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="block">Failed:</span>
                    <span className="font-mono font-semibold text-destructive">{mappingStatus.failed}</span>
                  </div>
                </div>

                {/* Show API calls and duration for completed */}
                {(mappingStatus.status === "completed" || mappingStatus.status === "failed") && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-muted">
                    <div className="text-muted-foreground pt-2">
                      <span className="block">API Calls:</span>
                      <span className="font-mono font-semibold">{mappingStatus.apiCallsMade}</span>
                    </div>
                    <div className="text-muted-foreground pt-2">
                      <span className="block">Duration:</span>
                      <span className="font-mono font-semibold">{(mappingStatus.totalDurationMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {mappingStatus.status === "in_progress" && (
              <RefreshCw className="size-5 animate-spin flex-shrink-0 text-blue-500 mt-1" />
            )}
            {mappingStatus.status === "completed" && (
              <div className="text-2xl flex-shrink-0 text-emerald-600 dark:text-emerald-400">✓</div>
            )}
            {mappingStatus.status === "failed" && (
              <div className="text-2xl flex-shrink-0 text-destructive">✕</div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
