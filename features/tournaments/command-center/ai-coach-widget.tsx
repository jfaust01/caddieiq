import Link from "next/link"

import type { CoachRecommendations } from "@/lib/command-center"

/**
 * AI Coach widget — explainable, bucketed recommendations. Every pick's reason
 * is echoed from the source board, so the coach never introduces a new claim.
 * Renders an honest empty state when no board produced a recommendation.
 */
export function AiCoachWidget({ coach }: { coach: CoachRecommendations }) {
  if (coach.groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        The coach turns the DFS Value and Course Fit boards into plays. Recommendations appear once
        those models can score this field.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {coach.groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold tracking-tight">{group.title}</h3>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {group.picks.map((pick) => (
              <li
                key={`${group.key}-${pick.playerId}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-2.5"
              >
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`/players/${pick.playerId}`}
                    className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {pick.displayName}
                  </Link>
                  <span className="text-xs leading-relaxed text-muted-foreground text-pretty">
                    {pick.reason}
                  </span>
                </div>
                {pick.confidence ? (
                  <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[0.625rem] font-medium capitalize text-muted-foreground">
                    {pick.confidence}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
