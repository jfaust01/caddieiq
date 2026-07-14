import { Activity } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityEntry } from '@/features/players/types'

interface RecentActivityProps {
  activity: ActivityEntry[]
}

/** Placeholder recent-activity feed. */
export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4">
          {activity.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-hidden="true"
              >
                <Activity className="size-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium leading-snug text-pretty">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <time className="text-xs text-muted-foreground/70">
                  {item.date}
                </time>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
