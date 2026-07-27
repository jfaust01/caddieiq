"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Search, X } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TournamentTourChip } from "@/features/tournaments/components/tournament-tour-chip"
import { normalizeTournamentStatus, getTournamentStatusTone } from "@/features/tournaments/utils/normalize-tournament-status"
import { formatDateRange } from "@/features/tournaments/utils/format"
import { generateTournamentSlug } from "@/features/tournaments/utils/slug"
import type { TournamentSelectorOption } from "@/features/tournaments/actions/fetch-tournaments-for-selector"

interface TournamentSelectorProps {
  currentTournamentId: string
  currentTournamentName: string
  options: TournamentSelectorOption[]
}

/**
 * Status badge component for dropdown options.
 */
function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeTournamentStatus(status)
  const tone = getTournamentStatusTone(normalized)

  const styles: Record<string, string> = {
    default: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    success: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    muted: "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
    destructive: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  }

  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap", styles[tone])}>
      {normalized}
    </span>
  )
}

/**
 * Tournament selector dropdown for the tournament detail header.
 * 
 * Features:
 * - Large, clickable tournament name as trigger
 * - Colored Tour chips for each option
 * - Status badges
 * - Date ranges
 * - Search when >10 items
 * - Keyboard navigation
 * - Current tournament highlighted
 */
export function TournamentSelector({
  currentTournamentId,
  currentTournamentName,
  options,
}: TournamentSelectorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node && open) {
      setTimeout(() => node.focus(), 0)
    }
  }, [open])

  // Filter tournaments based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    
    const query = searchQuery.toLowerCase()
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(query) ||
        opt.tourName?.toLowerCase().includes(query) ||
        opt.tourCode?.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Show search when more than 10 items
  const showSearch = options.length > 10

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
          break
        case "Enter":
          e.preventDefault()
          if (filteredOptions[highlightedIndex]) {
            handleSelectTournament(filteredOptions[highlightedIndex].id)
          }
          break
        case "Escape":
          e.preventDefault()
          setOpen(false)
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, highlightedIndex, filteredOptions])

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  const handleSelectTournament = (tournamentId: string) => {
    setOpen(false)
    setSearchQuery("")
    router.push(`/tournaments/${generateTournamentSlug(tournamentId)}`)
  }

  const hasNoResults = showSearch && filteredOptions.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "group inline-flex items-center gap-2 px-3 py-2",
          "text-2xl sm:text-3xl font-semibold tracking-tight",
          "rounded-lg border-2 border-transparent",
          "transition-colors duration-200",
          "hover:bg-muted/50 focus:outline-none focus-visible:border-primary",
          "cursor-pointer active:scale-95"
        )}
        title="Click to select tournament"
        type="button"
      >
        <span className="text-pretty break-words">{currentTournamentName}</span>
        <ChevronDown
          size={24}
          className="flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </PopoverTrigger>

      <PopoverContent className="w-[420px] sm:w-full p-3" align="start">
        <div className="flex flex-col gap-3">
          {/* Search Input */}
          {showSearch ? (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm",
                  "bg-muted/50 border border-border rounded-md",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-primary"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : null}

          {/* Tournament Options List */}
          {hasNoResults ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No tournaments found</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredOptions.map((option, index) => {
                const isSelected = option.id === currentTournamentId
                const isHighlighted = index === highlightedIndex

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectTournament(option.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors",
                      "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                      isSelected && "bg-primary text-primary-foreground",
                      isHighlighted && !isSelected && "bg-muted/60",
                      !isSelected && !isHighlighted && "hover:bg-muted/40"
                    )}
                  >
                    {/* First line: Tour chip, name, status */}
                    <div className="flex items-center gap-2 justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {option.tourCode || option.tourName ? (
                          <div className="flex-shrink-0">
                            <TournamentTourChip
                              tour={option.tourCode ? { code: option.tourCode, name: option.tourName } as any : null}
                              variant="compact"
                            />
                          </div>
                        ) : null}
                        <span className="truncate font-medium text-sm">{option.name}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={option.status} />
                      </div>
                    </div>

                    {/* Second line: Date range */}
                    {option.startDate || option.endDate ? (
                      <div className="text-xs text-muted-foreground/70">
                        {formatDateRange(option.startDate, option.endDate)}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
