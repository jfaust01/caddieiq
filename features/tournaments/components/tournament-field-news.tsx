import { ExternalLink, Newspaper } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TournamentNewsItem } from '@/features/tournaments/types'

interface TournamentFieldNewsProps {
  news: TournamentNewsItem[]
}

/** Format an ISO timestamp for display using UTC, or null when unavailable. Avoids hydration mismatch from locale-dependent formatting. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  
  return `${month} ${day}, ${year}`
}

/** Outlet + date line, omitting whatever the source didn't provide. */
function metaLine(item: TournamentNewsItem): string {
  return [item.outlet, formatDate(item.publishedAt)].filter(Boolean).join(' · ')
}

/**
 * Tournament-hub research rail: recent news about players in this event's
 * field, sourced live from the provider news feed. Each headline is attributed
 * to its field player (linked to the player profile). Never rendered when the
 * field has no linked news — the sidebar shows its placeholder instead — so
 * this component always has at least one item and never fabricates content.
 */
export function TournamentFieldNews({ news }: TournamentFieldNewsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="size-4 text-muted-foreground" aria-hidden="true" />
          Field news
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <Link
                  href={`/players/${item.playerId}`}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  {item.playerName}
                </Link>
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
                {meta ? <p className="text-xs text-muted-foreground/70">{meta}</p> : null}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
