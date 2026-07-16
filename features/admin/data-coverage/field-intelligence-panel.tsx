import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldLifecycleBadge } from '@/features/tournaments/components/field-lifecycle-badge'
import type { FieldIntelligenceReport } from '@/lib/data-coverage/types'
import type { FieldStatus } from '@/lib/tournament-context/types'
import { cn } from '@/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso))
}

function formatSync(iso: string | null): string {
  if (!iso) return 'Never'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

/** Imported vs. expected size, e.g. "144 / 156" or "— / 156" or "144". */
function sizeLabel(imported: number, expected: number | null): string {
  if (expected === null) return imported > 0 ? String(imported) : '—'
  return `${imported > 0 ? imported : '—'} / ${expected}`
}

/** A small headline stat for the panel header. */
function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warning' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          'font-mono text-lg font-semibold tabular-nums',
          tone === 'warning' && value > 0 ? 'text-warning' : 'text-card-foreground',
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Admin Tournament Field Intelligence panel: upcoming/live events with their
 * official-field lifecycle, imported-vs-expected size, and last sync — so an
 * operator can confirm official fields are landing on schedule. Rows flagged
 * `overdue` (release deadline passed with no roster imported) are highlighted as
 * the actionable "needs attention" signal. Lifecycle state comes from the same
 * engine that drives the public Tournament Page banner, so the two never
 * disagree. Renders an honest empty state when no events qualify.
 */
export function FieldIntelligencePanel({ report }: { report: FieldIntelligenceReport }) {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-col gap-4 border-b [.border-b]:pb-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Upcoming & live field lifecycle</CardTitle>
        <div className="flex items-center gap-8">
          <Stat label="Awaiting" value={report.awaitingCount} />
          <Stat label="Confirmed" value={report.confirmedCount} />
          <Stat label="Overdue" value={report.overdueCount} tone="warning" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {report.rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No upcoming or live events to track right now.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">Event</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Field status</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Start</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Imported / expected</th>
                  <th scope="col" className="py-2 font-medium">Last sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.rows.map((row) => (
                  <tr
                    key={row.tournamentId}
                    className={cn(row.overdue && 'bg-warning/5')}
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/tournaments/${row.tournamentId}`}
                        className="font-medium text-card-foreground hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.overdue ? (
                        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-warning">
                          <AlertTriangle className="size-3" aria-hidden />
                          Field overdue — deadline passed, no roster imported
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <FieldLifecycleBadge status={row.fieldStatus as FieldStatus} />
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                      {formatDate(row.startDate)}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-card-foreground">
                      {sizeLabel(row.playersImported, row.expectedPlayers)}
                    </td>
                    <td className="py-3 text-muted-foreground tabular-nums">
                      {formatSync(row.lastSync)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
