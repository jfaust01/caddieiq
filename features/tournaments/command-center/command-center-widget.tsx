"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface CommandCenterWidgetProps {
  /** Stable id used to persist collapse state (localStorage key `cc:widget:<id>`). */
  id: string
  title: string
  icon?: ReactNode
  subtitle?: string
  /** Optional short chip on the right (e.g. a confidence label). */
  chip?: string
  /** Start collapsed by default (persisted state still wins once hydrated). */
  defaultCollapsed?: boolean
  children: ReactNode
  className?: string
}

/**
 * Collapsible card shell for a Command Center widget. Collapse state is
 * persisted per-widget to `localStorage` so a user's dashboard layout survives
 * reloads. The header is a real button with `aria-expanded`, so the widget is
 * fully keyboard operable and screen-reader friendly.
 */
export function CommandCenterWidget({
  id,
  title,
  icon,
  subtitle,
  chip,
  defaultCollapsed = false,
  children,
  className,
}: CommandCenterWidgetProps) {
  const storageKey = `cc:widget:${id}`
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [hydrated, setHydrated] = useState(false)

  // Restore persisted collapse state after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored !== null) setCollapsed(stored === "1")
    } catch {
      // Ignore storage access errors (private mode, etc.).
    }
    setHydrated(true)
  }, [storageKey])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0")
      } catch {
        // Ignore storage write failures.
      }
      return next
    })
  }

  const regionId = `cc-widget-body-${id}`

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-card/50 text-card-foreground",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={regionId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
          {subtitle ? (
            <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
        {chip ? (
          <span className="hidden shrink-0 rounded-full border border-foreground/10 bg-muted/40 px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground sm:inline">
            {chip}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            collapsed && "-rotate-90",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={regionId}
        hidden={hydrated && collapsed}
        className="border-t border-foreground/5 px-4 py-4"
      >
        {children}
      </div>
    </section>
  )
}
