import { Card, CardContent } from "@/components/ui/card"
import type { DomainSummary } from "@/lib/data-coverage/types"

import { CoverageBar } from "./indicators"

/** A compact tile per platform domain for the at-a-glance summary. */
function SummaryTile({ domain }: { domain: DomainSummary }) {
  return (
    <Card className="gap-0 transition-shadow hover:shadow-md" size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{domain.label}</span>
          <span className="text-sm font-semibold tabular-nums">
            {domain.restricted ? "N/A" : domain.percent === null ? "—" : `${domain.percent}%`}
          </span>
        </div>
        <CoverageBar percent={domain.restricted ? 0 : domain.percent} rating={domain.rating} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {domain.restricted
            ? "Provider restricted"
            : `${domain.verified.toLocaleString("en-US")} / ${domain.total.toLocaleString("en-US")} verified`}
        </span>
      </CardContent>
    </Card>
  )
}

export function SummaryGrid({ summary }: { summary: DomainSummary[] }) {
  return (
    <section
      aria-label="Platform coverage summary"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {summary.map((domain) => (
        <SummaryTile key={domain.id} domain={domain} />
      ))}
    </section>
  )
}
