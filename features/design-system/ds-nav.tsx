'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface NavSection {
  id: string
  label: string
}

const sections: NavSection[] = [
  { id: 'colors',      label: 'Colors' },
  { id: 'typography',  label: 'Typography' },
  { id: 'spacing',     label: 'Spacing' },
  { id: 'shadows',     label: 'Shadows' },
  { id: 'animations',  label: 'Animations' },
  { id: 'icons',       label: 'Icons' },
  { id: 'buttons',     label: 'Buttons' },
  { id: 'forms',       label: 'Forms' },
  { id: 'cards',       label: 'Cards' },
  { id: 'badges',      label: 'Badges' },
  { id: 'alerts',      label: 'Alerts' },
  { id: 'tables',      label: 'Tables' },
  { id: 'loading',     label: 'Loading' },
  { id: 'empty-states',label: 'Empty States' },
  { id: 'charts',      label: 'Charts' },
]

interface DSNavProps {
  activeId?: string
}

export function DSNav({ activeId }: DSNavProps) {
  function scrollTo(id: string, e: React.MouseEvent) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <nav aria-label="Design system sections" className="flex flex-col gap-0.5">
      <p className="text-label text-muted-foreground px-2.5 py-1.5 mb-1">Sections</p>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={(e) => scrollTo(s.id, e)}
          className={cn(
            'rounded-md px-2.5 py-1.5 text-sm transition-colors duration-[80ms]',
            activeId === s.id
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}

export { sections }
