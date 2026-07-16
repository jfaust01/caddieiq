import Link from "next/link"
import { AlertCircle, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { CaddieAnswer, CaddieConfidence } from "@/lib/caddie/types"

const CONFIDENCE_STYLE: Record<CaddieConfidence, { label: string; className: string }> = {
  high: { label: "High confidence", className: "bg-primary/10 text-primary" },
  medium: { label: "Medium confidence", className: "bg-secondary text-secondary-foreground" },
  low: { label: "Low confidence", className: "bg-muted text-muted-foreground" },
  unavailable: { label: "No data", className: "bg-muted text-muted-foreground" },
}

/**
 * Renders one grounded Caddie answer: headline, summary, supporting bullets,
 * linked player chips, and the citation/confidence footer that proves the
 * answer came from a verified engine (never a fabricated number).
 */
export function CaddieAnswerCard({ answer }: { answer: CaddieAnswer }) {
  const confidence = CONFIDENCE_STYLE[answer.confidence]

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-balance">{answer.headline}</h3>
          <Badge className={cn("shrink-0", confidence.className)}>{confidence.label}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{answer.summary}</p>
      </div>

      {answer.isEmpty ? (
        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            This data hasn&apos;t been imported for this event yet. The Caddie only answers from
            verified intelligence, so it won&apos;t guess.
          </span>
        </div>
      ) : (
        answer.bullets.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {answer.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )
      )}

      {answer.entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {answer.entities.map((entity) =>
            entity.href ? (
              <Link
                key={entity.playerId}
                href={entity.href}
                className="inline-flex items-center gap-1 rounded-4xl border border-border px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                {entity.label}
                {entity.detail && <span className="text-muted-foreground">· {entity.detail}</span>}
                <ArrowUpRight className="size-3 text-muted-foreground" aria-hidden />
              </Link>
            ) : (
              <span
                key={entity.playerId}
                className="inline-flex items-center gap-1 rounded-4xl border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {entity.label}
                {entity.detail && <span>· {entity.detail}</span>}
              </span>
            ),
          )}
        </div>
      )}

      {answer.citations.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
          {answer.citations.map((citation, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span className="font-medium text-foreground">Source:</span> {citation.engine}
              {citation.detail && <span>({citation.detail})</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
