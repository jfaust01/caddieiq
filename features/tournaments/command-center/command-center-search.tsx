"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GitCompareArrows, LayoutGrid, ListOrdered, Newspaper, Search, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export interface SearchPlayer {
  id: string
  name: string
}

export interface SearchNews {
  id: string
  title: string
  playerId: string
}

interface CommandCenterSearchProps {
  tournamentId: string
  players: SearchPlayer[]
  news: SearchNews[]
}

/**
 * Command Center global search (⌘K). Scoped to this tournament: jump to any
 * field player, open a related news player, or fire a quick navigation action.
 * Opens via the header button or the ⌘K / Ctrl-K shortcut.
 */
export function CommandCenterSearch({ tournamentId, players, news }: CommandCenterSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <Search data-icon="inline-start" />
        <span>Search</span>
        <CommandShortcut className="ml-1">⌘K</CommandShortcut>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Tournament search"
        description="Search players, news, and quick actions for this tournament."
      >
        <CommandInput placeholder="Search players, news, actions..." />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>

          <CommandGroup heading="Quick actions">
            <CommandItem value="compare players" onSelect={() => go("/compare")}>
              <GitCompareArrows />
              Compare players
            </CommandItem>
            <CommandItem value="open rankings" onSelect={() => go("/rankings")}>
              <ListOrdered />
              Open rankings
            </CommandItem>
            <CommandItem value="view analytics" onSelect={() => go("/analytics")}>
              <LayoutGrid />
              View analytics
            </CommandItem>
          </CommandGroup>

          {players.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Players in field">
                {players.map((player) => (
                  <CommandItem
                    key={player.id}
                    value={`player ${player.name}`}
                    onSelect={() => go(`/players/${player.id}`)}
                  >
                    <User />
                    {player.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {news.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Field news">
                {news.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`news ${item.title}`}
                    onSelect={() => go(`/players/${item.playerId}`)}
                  >
                    <Newspaper />
                    <span className="truncate">{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
