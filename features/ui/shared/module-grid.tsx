import React from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ModuleItem {
  id: string
  title: string
  icon?: React.ReactNode
  content: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  removable?: boolean
  onRemove?: () => void
  footer?: React.ReactNode
}

export interface ModuleGridProps {
  modules: ModuleItem[]
  onStateChange?: (state: Record<string, boolean>) => void
  className?: string
  gridCols?: 'auto' | '1' | '2' | '3' | '4'
}

export function ModuleGrid({
  modules,
  onStateChange,
  className = '',
  gridCols = 'auto',
}: ModuleGridProps) {
  const [collapsedState, setCollapsedState] = React.useState<
    Record<string, boolean>
  >(
    modules.reduce(
      (acc, m) => ({
        ...acc,
        [m.id]: m.defaultCollapsed ?? false,
      }),
      {}
    )
  )

  const toggleCollapsed = (id: string) => {
    setCollapsedState((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      onStateChange?.(next)
      return next
    })
  }

  const gridColsClass = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-4',
  }

  return (
    <div className={`grid ${gridColsClass[gridCols]} gap-4 ${className}`}>
      {modules.map((module) => (
        <div
          key={module.id}
          className="rounded-lg border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Module header */}
          <div className="flex items-center justify-between gap-2 p-4 border-b border-border/30 bg-muted/20">
            <div className="flex items-center gap-2 min-w-0">
              {module.icon && (
                <span className="flex-shrink-0 text-primary">{module.icon}</span>
              )}
              <h3 className="font-semibold text-sm truncate">{module.title}</h3>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {module.collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleCollapsed(module.id)}
                  aria-label={
                    collapsedState[module.id] ? 'Expand' : 'Collapse'
                  }
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      collapsedState[module.id] ? '-rotate-90' : ''
                    }`}
                  />
                </Button>
              )}

              {module.removable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={module.onRemove}
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Module content */}
          {!collapsedState[module.id] && (
            <>
              <div className="p-4">{module.content}</div>
              {module.footer && (
                <div className="px-4 py-3 border-t border-border/30 bg-muted/10 text-xs text-muted-foreground">
                  {module.footer}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
