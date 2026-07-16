import type { ReactNode } from "react"
import { CloudSun, DollarSign, MapPin, Target, TrendingUp, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import type { BriefIcon, BriefTone, MorningBrief as MorningBriefData } from "@/lib/command-center"

const ICONS: Record<BriefIcon, ReactNode> = {
  weather: <CloudSun aria-hidden />,
  odds: <TrendingUp aria-hidden />,
  dfs: <DollarSign aria-hidden />,
  field: <Users aria-hidden />,
  trending: <TrendingUp aria-hidden />,
  course: <MapPin aria-hidden />,
  skill: <Target aria-hidden />,
}

const TONE_DOT: Record<BriefTone, string> = {
  positive: "bg-primary",
  neutral: "bg-muted-foreground",
  caution: "bg-destructive",
}

/**
 * Morning Brief widget — the handful of verified headlines worth knowing right
 * now. Renders an honest empty state when no source engine produced a signal.
 */
export function MorningBrief({ brief }: { brief: MorningBriefData }) {
  if (brief.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No intelligence has been imported for this event yet. Headlines will appear here as field,
        odds, DFS, weather, and course-fit data lands.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {brief.items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-3.5">
            {ICONS[item.icon]}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[item.tone])} aria-hidden />
              {item.label}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground text-pretty">
              {item.detail}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
