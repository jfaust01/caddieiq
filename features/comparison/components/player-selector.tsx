"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface PlayerOption {
  id: string
  name: string
  ranking?: number
  rating?: number
}

interface PlayerSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPlayers: (playerIds: string[], names: string[]) => void
  availablePlayers: PlayerOption[]
  maxPlayers?: number
}

export function PlayerSelector({
  open,
  onOpenChange,
  onSelectPlayers,
  availablePlayers,
  maxPlayers = 4,
}: PlayerSelectorProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<PlayerOption[]>([])

  const filtered = availablePlayers.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      !selected.find(s => s.id === p.id),
  )

  const handleSelect = (player: PlayerOption) => {
    if (selected.length < maxPlayers) {
      setSelected([...selected, player])
    }
  }

  const handleRemove = (playerId: string) => {
    setSelected(selected.filter(p => p.id !== playerId))
  }

  const handleCompare = () => {
    if (selected.length >= 2) {
      onSelectPlayers(
        selected.map(p => p.id),
        selected.map(p => p.name),
      )
      setSelected([])
      setSearch("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Players to Compare</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected players */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1"
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  <button
                    onClick={() => handleRemove(player.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Available players list */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.length > 0 ? (
              filtered.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelect(player)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors",
                    selected.find(s => s.id === player.id) ? "bg-muted" : "",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.name}</span>
                    {player.rating !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {player.rating.toFixed(0)}/100
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No players found
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompare}
              disabled={selected.length < 2}
              className="flex-1"
            >
              Compare ({selected.length}/{maxPlayers})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
