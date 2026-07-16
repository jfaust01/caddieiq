import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  MapPin,
  Radio,
  XCircle,
} from "lucide-react"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionHeader } from "@/components/shared/section-header"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type {
  ForecastableTournament,
  WeatherHealthReport,
  WeatherRunSummary,
} from "@/lib/system-health/weather-health"

/** Deterministic UTC stamp so server/client render identically. */
function utc(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`
}

type Tone = "ok" | "warn" | "error" | "muted"

const TONE_CLASS: Record<Tone, string> = {
  ok: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warn: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  error: "border-transparent bg-destructive/15 text-destructive",
  muted: "border-transparent bg-muted text-muted-foreground",
}

function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <Badge className={cn("font-medium", TONE_CLASS[tone])}>{children}</Badge>
}

/** A labelled status tile used in the top overview grid. */
function StatusTile({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Radio
  label: string
  value: string
  tone: Tone
  hint?: string
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2.5 rounded-full",
            tone === "ok" && "bg-emerald-500",
            tone === "warn" && "bg-amber-500",
            tone === "error" && "bg-destructive",
            tone === "muted" && "bg-muted-foreground/40",
          )}
          aria-hidden
        />
        <span className="text-lg font-semibold tracking-tight">{value}</span>
      </div>
      {hint ? <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
    </Card>
  )
}

/** A compact labelled figure in the forecast-window throughput strip. */
function WindowStat({
  label,
  value,
  tone,
  hint,
}: {
  label: string
  value: string
  tone?: "ok" | "warn"
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-xl font-semibold tabular-nums tracking-tight",
          tone === "ok" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

function runStatusTone(status: string): Tone {
  if (status === "SUCCESS") return "ok"
  if (status === "PARTIAL") return "warn"
  if (status === "FAILED") return "error"
  return "muted"
}

function RunRow({ run }: { run: WeatherRunSummary }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono text-xs">{utc(run.startedAt)}</TableCell>
      <TableCell>
        <StatusBadge tone={runStatusTone(run.status)}>{run.status}</StatusBadge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{run.processed}</TableCell>
      <TableCell className="text-right tabular-nums">{run.updated}</TableCell>
      <TableCell className="text-right tabular-nums">{run.skipped}</TableCell>
      <TableCell className="text-right tabular-nums">
        <span className={run.failed > 0 ? "font-semibold text-destructive" : undefined}>
          {run.failed}
        </span>
      </TableCell>
      <TableCell className="max-w-md text-sm text-muted-foreground">
        {run.error ? (
          <span className="text-destructive">{run.error}</span>
        ) : (
          (run.summary ?? "—")
        )}
      </TableCell>
    </TableRow>
  )
}

function coverageTone(t: ForecastableTournament): Tone {
  if (t.hasSnapshot) return "ok"
  if (t.coordinateConfidence === null) return "error"
  return "warn"
}

function coverageLabel(t: ForecastableTournament): string {
  if (t.hasSnapshot) return "Forecast loaded"
  if (t.coordinateConfidence === null) return "Host not located"
  return "Awaiting import"
}

/**
 * Internal System Health dashboard for the weather subsystem. Answers, at a
 * glance, why weather data is or isn't flowing: is the scheduler wired, does the
 * provider respond, how much data exists, did recent runs succeed, and which
 * forecastable events are still uncovered. Every value is read live and honest.
 */
export function SystemHealthView({ report }: { report: WeatherHealthReport }) {
  const { scheduler, provider, rows, recentRuns, forecastable, windowStats, nextRun, nearestUpcoming } =
    report

  const schedulerReady = scheduler.scheduleConfigured && scheduler.secretConfigured
  const schedulerTone: Tone = schedulerReady ? "ok" : scheduler.scheduleConfigured ? "warn" : "error"
  const schedulerValue = schedulerReady
    ? "Scheduled"
    : scheduler.scheduleConfigured
      ? "Missing secret"
      : "Not scheduled"

  const providerTone: Tone = provider.ok ? "ok" : "error"
  const rowsTone: Tone = rows.snapshots > 0 ? "ok" : "muted"

  const uncovered = forecastable.filter((t) => !t.hasSnapshot)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Internal diagnostics"
        title="System Health — Weather"
        description="Live status of the weather ingestion pipeline: scheduler, provider connectivity, stored data, recent runs, and forecast-window coverage. Every value is read live; empty states are explained, never hidden."
      />

      <section aria-label="Weather subsystem status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatusTile
          icon={CalendarClock}
          label="Scheduler"
          value={schedulerValue}
          tone={schedulerTone}
          hint={
            scheduler.scheduleConfigured
              ? scheduler.secretConfigured
                ? `Cron ${scheduler.cronExpression} · authorized`
                : "Cron exists but CRON_SECRET is unset, so scheduled runs cannot authorize."
              : "No weather cron in vercel.json — imports only run when triggered manually."
          }
        />
        <StatusTile
          icon={Radio}
          label="Provider"
          value={provider.ok ? "Reachable" : "Unreachable"}
          tone={providerTone}
          hint={
            provider.ok
              ? `OpenWeather responded in ${provider.latencyMs}ms with ${provider.periods} periods.`
              : (provider.error ?? "OpenWeather did not respond.")
          }
        />
        <StatusTile
          icon={Database}
          label="Stored data"
          value={`${rows.snapshots} snapshots`}
          tone={rowsTone}
          hint={`${rows.periods} forecast periods across all tournaments.`}
        />
        <StatusTile
          icon={Clock}
          label="Last run"
          value={report.lastRun ? report.lastRun.status : "Never"}
          tone={report.lastRun ? runStatusTone(report.lastRun.status) : "muted"}
          hint={
            report.lastRun
              ? utc(report.lastRun.startedAt)
              : "The weather importer has never run. Trigger it manually or wait for the schedule."
          }
        />
        <StatusTile
          icon={CalendarClock}
          label="Next run"
          value={
            nextRun.inHours != null
              ? nextRun.inHours <= 1
                ? "Within the hour"
                : `in ${nextRun.inHours}h`
              : scheduler.scheduleConfigured
                ? "Scheduled"
                : "Not scheduled"
          }
          tone={nextRun.at ? "ok" : scheduler.scheduleConfigured ? "warn" : "muted"}
          hint={
            nextRun.at
              ? `Next scheduled import at ${utc(nextRun.at)}.`
              : scheduler.cronExpression
                ? `Cron ${scheduler.cronExpression} runs on a non-daily schedule.`
                : "No cron configured, so the importer only runs when triggered manually."
          }
        />
      </section>

      <section aria-label="Forecast-window throughput">
        <Card className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3 lg:grid-cols-5">
          <WindowStat label="Forecast window" value={`~${windowStats.horizonDays} days`} />
          <WindowStat label="Eligible events" value={String(windowStats.eligible)} />
          <WindowStat
            label="Imported"
            value={`${windowStats.imported} / ${windowStats.eligible}`}
            tone={windowStats.uncovered === 0 && windowStats.eligible > 0 ? "ok" : undefined}
          />
          <WindowStat
            label="Skipped (unlocated)"
            value={String(windowStats.skipped)}
            tone={windowStats.skipped > 0 ? "warn" : undefined}
          />
          <WindowStat
            label="Avg import time"
            value={
              windowStats.avgImportDurationMs != null
                ? `${windowStats.avgImportDurationMs} ms`
                : "—"
            }
            hint={
              windowStats.avgImportDurationMs != null
                ? `over ${windowStats.durationSampleSize} stored import${windowStats.durationSampleSize === 1 ? "" : "s"} (7d)`
                : "no stored imports in the last 7 days"
            }
          />
        </Card>
      </section>

      <section aria-label="Forecast-window coverage" className="flex flex-col gap-4">
        <SectionHeader
          title="Forecast-window coverage"
          description="Tournaments within OpenWeather's ~5-day forecast reach — the events the importer should be covering right now. Each row shows whether its host venue is located and whether a forecast is loaded."
        />
        {forecastable.length === 0 ? (
          <Card className="flex items-start gap-3 p-5">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="font-medium">No events in the forecast window</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {nearestUpcoming
                  ? `Nearest event "${nearestUpcoming.name}" starts in ${nearestUpcoming.daysOut} days (${utc(nearestUpcoming.startDate)}), beyond the ~5-day horizon. An empty weather table is expected right now — this is off-season behavior, not a failure.`
                  : "No upcoming tournaments are scheduled, so there is nothing to forecast."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {uncovered.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {uncovered.length} of {forecastable.length} forecastable event
                {forecastable.length === 1 ? "" : "s"} not yet covered.
              </p>
            ) : null}
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Starts</TableHead>
                    <TableHead>Host venue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecastable.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        in {t.daysOut} day{t.daysOut === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          {t.hostCourseName ?? "No host course"}
                          {t.coordinateConfidence === "APPROXIMATE" ? (
                            <span className="text-xs text-muted-foreground">(city-level)</span>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={coverageTone(t)}>
                          {t.hasSnapshot ? (
                            <CheckCircle2 className="mr-1 size-3.5" aria-hidden />
                          ) : coverageTone(t) === "error" ? (
                            <XCircle className="mr-1 size-3.5" aria-hidden />
                          ) : (
                            <AlertTriangle className="mr-1 size-3.5" aria-hidden />
                          )}
                          {coverageLabel(t)}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </section>

      <section aria-label="Recent import runs" className="flex flex-col gap-4">
        <SectionHeader
          title="Recent import runs"
          description="The last ten weather import runs, newest first. A zero-consideration run is annotated with the reason, so an empty window is never mistaken for a failure."
        />
        {recentRuns.length === 0 ? (
          <Card className="flex items-start gap-3 p-5">
            <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="font-medium">No import runs recorded</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The weather importer has not run yet. It runs on the daily schedule, or can be
                triggered manually at <code className="text-xs">/api/imports/weather</code>.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Considered</TableHead>
                  <TableHead className="text-right">Stored</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </PageShell>
  )
}
