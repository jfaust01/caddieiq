"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SURFACE SIMPLIFICATION PRIMITIVES
 * 
 * These components establish clear 3-level hierarchy without over-boxing:
 * LEVEL 1: Page background
 * LEVEL 2: Major section container
 * LEVEL 3: Internal rows/subsections (using spacing, dividers, background variation)
 */

/**
 * SectionContainer — LEVEL 2
 * Major section with subtle border and minimal background contrast.
 * Use for: Tournament cards, Player summaries, Course overview, Data tables, etc.
 */
interface SectionContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SectionContainer({ className, ...props }: SectionContainerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-foreground/10 bg-card/50 overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * SectionHeader — Internal text header (no border)
 * Use for: Section titles inside containers
 */
interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-4 py-3", className)} {...props}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/**
 * MetricGrid — Internal row group (no borders)
 * Use for: Metric/data groups that don't need individual cards
 */
interface MetricGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | "auto"
  children: React.ReactNode
}

export function MetricGrid({
  columns = 4,
  className,
  ...props
}: MetricGridProps) {
  return (
    <div
      className={cn(
        columns === "auto"
          ? "grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3"
          : `grid grid-cols-${columns} gap-3`,
        className
      )}
      {...props}
    />
  )
}

/**
 * MetricItem — Single metric display (no card/border)
 * Use for: Individual metric within a MetricGrid
 */
interface MetricItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  hint?: string
  highlight?: boolean
}

export function MetricItem({
  label,
  value,
  hint,
  highlight = false,
  className,
  ...props
}: MetricItemProps) {
  return (
    <div
      className={cn(
        "rounded-md p-3 transition-colors",
        highlight ? "bg-muted/80" : "bg-transparent hover:bg-muted/40",
        className
      )}
      {...props}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

/**
 * DetailRow — Single row with left label + right content (no border/card)
 * Use for: Key/value pairs, settings, inline details
 */
interface DetailRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  children: React.ReactNode
  highlight?: boolean
}

export function DetailRow({
  label,
  children,
  highlight = false,
  className,
  ...props
}: DetailRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 transition-colors",
        highlight ? "bg-muted/60" : "hover:bg-muted/20",
        className
      )}
      {...props}
    >
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  )
}

/**
 * Divider — Thin internal separator (not a border)
 * Use for: Separating internal content groups
 */
interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  variant?: "default" | "subtle"
}

export function Divider({ variant = "default", className, ...props }: DividerProps) {
  return (
    <hr
      className={cn(
        "border-0 bg-foreground/10",
        variant === "subtle" && "bg-foreground/5",
        "h-px",
        className
      )}
      {...props}
    />
  )
}

/**
 * SectionFooter — Footer action area (no separate card/border)
 * Use for: Actions at bottom of section (buttons, links)
 */
interface SectionFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SectionFooter({
  className,
  children,
  ...props
}: SectionFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 border-t border-foreground/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * MetadataRow — Compact label/value pair (typically horizontal)
 * Use for: Secondary information, tags, badges
 */
interface MetadataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{ label: string; value: React.ReactNode }>
}

export function MetadataRow({ items, className, ...props }: MetadataRowProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)} {...props}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</span>
          <span className="text-sm font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * StatusRow — Row with left content + right status indicator
 * Use for: Items with status badges, health indicators
 */
interface StatusRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  status?: React.ReactNode
  children?: React.ReactNode
}

export function StatusRow({
  label,
  status,
  children,
  className,
  ...props
}: StatusRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-3 hover:bg-muted/20 transition-colors",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {children && <p className="text-xs text-muted-foreground mt-1">{children}</p>}
      </div>
      {status && <div className="flex-shrink-0">{status}</div>}
    </div>
  )
}
