'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ImportRunHealth, PlatformHealth } from "@/lib/data-coverage/types"

import { HealthStatus, ImportRunBadge } from "./indicators"

function formatWhen(at: string | null): string {
  if (!at) return "Never run"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(at))
}

function formatDuration(ms: number | null): string | null {
  if (ms == null) return null
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

/**
 * Compact, honest per-run detail line. Prefers the recorded error (only present
 * when the run actually failed or a feed is knowingly degraded), otherwise the
 * run summary, otherwise the row-count deltas. Never fabricates a status.
 */
function runDetail(run: ImportRunHealth): string | null {
  if (run.outcome === "never") return "No import has been recorded for this pipeline yet."
  if (run.error) return run.error
  if (run.summary) return run.summary
  const parts: string[] = []
  if (run.inserted != null) parts.push(`${run.inserted} inserted`)
  if (run.updated != null) parts.push(`${run.updated} updated`)
  if (run.skipped != null && run.skipped > 0) parts.push(`${run.skipped} skipped`)
  if (run.failed != null && run.failed > 0) parts.push(`${run.failed} failed`)
  return parts.length > 0 ? parts.join(", ") : null
}

export function HealthPanel({ health }: { health: PlatformHealth }) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="gap-0">
        <CardHeader className="border-b [.border-b]:pb-4">
          <CardTitle>Provider Health</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="flex flex-col divide-y divide-border">
            {health.checks.map((check) => (
              <li key={check.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{check.label}</span>
                  <span className="text-xs text-muted-foreground text-pretty">{check.detail}</span>
                </div>
                <HealthStatus state={check.state} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="gap-0">
        <CardHeader className="border-b [.border-b]:pb-4">
          <CardTitle>Import Run History</CardTitle>
          <p className="text-xs text-muted-foreground text-pretty">
            The recorded outcome of each pipeline&apos;s most recent run — read from the import-run
            audit trail, never inferred from row timestamps.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="flex flex-col divide-y divide-border">
            {health.runs.map((run) => {
              const duration = formatDuration(run.durationMs)
              const detail = runDetail(run)
              return (
                <li key={run.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{run.label}</span>
                    <ImportRunBadge outcome={run.outcome} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground text-pretty">
                      {detail ?? "No detail recorded."}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatWhen(run.at)}
                      {duration ? ` · ${duration}` : ""}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
