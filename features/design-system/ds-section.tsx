import * as React from 'react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

/* ─── Section wrapper ────────────────────────────────────────────────────────── */

interface DSSectionProps {
  id: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function DSSection({ id, title, description, children, className }: DSSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-8', className)}>
      <div className="mb-6">
        <h2 className="text-h2 text-foreground">{title}</h2>
        {description && (
          <p className="mt-1.5 text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
      <Separator className="mt-10" />
    </section>
  )
}

/* ─── Subsection ─────────────────────────────────────────────────────────────── */

interface DSSubsectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function DSSubsection({ title, children, className }: DSSubsectionProps) {
  return (
    <div className={cn('mb-8', className)}>
      <h3 className="text-h4 text-foreground mb-3">{title}</h3>
      {children}
    </div>
  )
}

/* ─── Preview row ────────────────────────────────────────────────────────────── */

interface DSPreviewProps {
  label?: string
  children: React.ReactNode
  className?: string
  code?: string
}

export function DSPreview({ label, children, className, code: _code }: DSPreviewProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <span className="text-label text-muted-foreground">{label}</span>}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 ring-0">
        {children}
      </div>
    </div>
  )
}

/* ─── Grid layout helper ─────────────────────────────────────────────────────── */

export function DSGrid({
  cols = 2,
  children,
  className,
}: {
  cols?: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-3',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ─── Color swatch ───────────────────────────────────────────────────────────── */

interface ColorSwatchProps {
  name: string
  variable: string
  foreground?: string
}

export function ColorSwatch({ name, variable, foreground }: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-12 w-full rounded-lg ring-1 ring-foreground/8"
        style={{ background: `var(${variable})` }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-small font-medium">{name}</span>
        <span className="text-caption text-muted-foreground font-mono">{variable}</span>
        {foreground && (
          <span className="text-caption text-muted-foreground font-mono">{foreground}</span>
        )}
      </div>
    </div>
  )
}

/* ─── Token row ──────────────────────────────────────────────────────────────── */

export function TokenRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-small text-muted-foreground">{label}</span>
      <span className={cn('text-small', mono && 'font-mono text-foreground/80')}>{value}</span>
    </div>
  )
}
