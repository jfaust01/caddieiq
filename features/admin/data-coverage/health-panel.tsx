import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlatformHealth } from "@/lib/data-coverage/types"

import { HealthStatus } from "./indicators"

function formatMarker(at: string | null): string {
  if (!at) return "Never"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(at))
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
          <CardTitle>Last Successful Imports</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="flex flex-col divide-y divide-border">
            {health.imports.map((marker) => (
              <li key={marker.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium">{marker.label}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatMarker(marker.at)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
