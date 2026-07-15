import { CircleCheck, CircleDashed, CircleSlash, Info, Lock } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CoverageSection } from "@/lib/data-coverage/types"

import { CoverageBar, RatingBadge } from "./indicators"

/** The verified / pending / missing legend shared by every section. */
function BreakdownRow({ breakdown }: { breakdown: CoverageSection["breakdown"] }) {
  const items = [
    { icon: CircleCheck, label: "Verified", value: breakdown.verified, className: "text-success" },
    { icon: CircleDashed, label: "Pending", value: breakdown.pending, className: "text-warning-foreground" },
    { icon: CircleSlash, label: "Missing", value: breakdown.missing, className: "text-muted-foreground" },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(({ icon: Icon, label, value, className }) => (
        <div key={label} className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className={cn("flex items-center gap-1.5 text-xs font-medium", className)}>
            <Icon className="size-3.5" />
            {label}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {value.toLocaleString("en-US")}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CoverageSectionCard({ section }: { section: CoverageSection }) {
  const isRestricted = Boolean(section.restrictedReason)

  return (
    <Card className="gap-0">
      <CardHeader className="border-b [.border-b]:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold tracking-tight">{section.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {section.description}
            </p>
          </div>
          <RatingBadge rating={section.rating} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {isRestricted ? (
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <p className="text-pretty">{section.restrictedReason}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-muted-foreground">Coverage</span>
              <span className="text-2xl font-semibold tabular-nums">
                {section.percent === null ? "—" : `${section.percent}%`}
              </span>
            </div>
            <CoverageBar percent={section.percent} rating={section.rating} />
          </div>
        )}

        <BreakdownRow breakdown={section.breakdown} />

        <dl className="flex flex-col divide-y divide-border">
          {section.metrics.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="flex flex-col gap-0.5">
                <dt className="text-sm font-medium">{metric.label}</dt>
                {metric.hint ? (
                  <span className="text-xs text-muted-foreground text-pretty">{metric.hint}</span>
                ) : null}
              </div>
              <dd className="flex shrink-0 items-baseline gap-2 text-right">
                {metric.percent !== undefined && metric.percent !== null ? (
                  <span className="text-xs text-muted-foreground tabular-nums">{metric.percent}%</span>
                ) : null}
                <span className="text-sm font-semibold tabular-nums">{metric.value}</span>
              </dd>
            </div>
          ))}
        </dl>

        {section.note ? (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-warning-foreground" />
            <p className="text-pretty">{section.note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
