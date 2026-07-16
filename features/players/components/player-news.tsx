import { ExternalLink, Newspaper } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlayerNewsItem } from '@/features/players/types'

interface PlayerNewsProps {
  news: PlayerNewsItem[]
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** Format an ISO timestamp for display, or null when unavailable. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date)
}

/** Byline + outlet + date line, omitting whatever the source didn't provide. */
function metaLine(item: PlayerNewsItem): string {
  const date = formatDate(item.publishedAt)
  return [item.outlet, item.author, date].filter(Boolean).join(' · ')
}

/**
 * Recent news about a player, sourced live from the provider news feed and
 * linked to the player at import time. Renders an honest empty state when the
 * provider has no articles for this player rather than fabricating content.
 */
export function PlayerNews({ news }: PlayerNewsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent News</CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent news has been imported for this player yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {news.map((item) => {
              const meta = metaLine(item)
              const headline = (
                <span className="text-sm font-medium leading-snug text-pretty text-foreground">
                  {item.title}
                </span>
              )
              return (
                <li
                  key={item.id}
                  className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    aria-hidden="true"
                  >
                    <Newspaper className="size-4" />
                  </span>
                  <div className="flex flex-col gap-1">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-start gap-1.5 hover:underline"
                      >
                        {headline}
                        <ExternalLink
                          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </a>
                    ) : (
                      headline
                    )}
                    {item.summary ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground text-pretty">
                        {item.summary}
                      </p>
                    ) : null}
                    {meta ? (
                      <p className="text-xs text-muted-foreground/70">{meta}</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
