"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, Star } from "lucide-react"

interface FieldMember {
  playerId: string
  playerName: string
}

interface PersonalizationWidgetProps {
  /** Players in this tournament's field, used to cross-reference saved lists. */
  field: FieldMember[]
}

function readIds(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []
  } catch {
    return []
  }
}

/**
 * Personalization — surfaces the user's favorited and tracked players that are
 * actually competing in this tournament. Reads the same localStorage keys the
 * Decision Workspace writes (`player-favorites`, `player-tracking`).
 */
export function PersonalizationWidget({ field }: PersonalizationWidgetProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [trackedIds, setTrackedIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setFavoriteIds(readIds("player-favorites"))
    setTrackedIds(readIds("player-tracking"))
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading your saved players…</p>
  }

  const favorites = field.filter((m) => favoriteIds.includes(m.playerId))
  const tracked = field.filter((m) => trackedIds.includes(m.playerId))

  if (favorites.length === 0 && tracked.length === 0) {
    return (
      <p className="text-sm text-pretty text-muted-foreground">
        No favorited or tracked players in this field yet. Open a player and use the Decision
        Workspace to star or track them — they&apos;ll show up here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {favorites.length > 0 ? (
        <PlayerGroup
          icon={<Star className="size-4 text-primary" aria-hidden />}
          label="Favorites in this field"
          members={favorites}
        />
      ) : null}
      {tracked.length > 0 ? (
        <PlayerGroup
          icon={<Eye className="size-4 text-primary" aria-hidden />}
          label="Tracked in this field"
          members={tracked}
        />
      ) : null}
    </div>
  )
}

function PlayerGroup({
  icon,
  label,
  members,
}: {
  icon: React.ReactNode
  label: string
  members: FieldMember[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        <span>{label}</span>
        <span className="text-muted-foreground">({members.length})</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {members.map((m) => (
          <li key={m.playerId}>
            <Link
              href={`/players/${m.playerId}`}
              className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {m.playerName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
