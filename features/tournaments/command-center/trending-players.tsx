import type { ReactNode } from "react"
import Link from "next/link"
import { DollarSign, MapPin, TrendingUp } from "lucide-react"

import type { BriefIcon, Trending as TrendingData } from "@/lib/command-center"

const ICONS: Partial<Record<BriefIcon, ReactNode>> = {
  dfs: <DollarSign aria-hidden />,
  odds: <TrendingUp aria-hidden />,
  course: <MapPin aria-hidden />,
  trending: <TrendingUp aria-hidden />,
}

/**
 * Trending widget — the field's standout entrant per category. Categories with
 * no scored leader show an explicit "No data yet" chip rather than a guess.
 */
export function TrendingPlayers({ trending }: { trending: TrendingData }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {trending.categories.map((category) => (
        <div
          key={category.key}
          className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5">
            {ICONS[category.icon] ?? <TrendingUp aria-hidden />}
            {category.title}
          </span>
          {category.player ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/players/${category.player.playerId}`}
                  className="truncate text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {category.player.displayName}
                </Link>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                  {category.player.value}
                </span>
              </div>
              <span className="text-xs leading-relaxed text-muted-foreground text-pretty">
                {category.player.detail}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60">No data yet</span>
          )}
        </div>
      ))}
    </div>
  )
}
