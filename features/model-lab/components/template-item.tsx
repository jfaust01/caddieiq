'use client'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ModelTemplate } from '../types'
import { activeMetricCount } from '../utils/weights'

interface TemplateItemProps {
  template: ModelTemplate
  active: boolean
  onPreview: () => void
  onUse: () => void
}

export function TemplateItem({
  template,
  active,
  onPreview,
  onUse,
}: TemplateItemProps) {
  const count = activeMetricCount(template.metrics)

  return (
    <div
      className={cn(
        'group/tpl flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors',
        active
          ? 'border-primary/40 bg-accent/60'
          : 'border-transparent hover:bg-muted',
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-0.5 text-left outline-none"
        aria-current={active ? 'true' : undefined}
      >
        <span className="w-full truncate text-sm font-medium text-foreground/90">
          {template.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {count} weighted {count === 1 ? 'metric' : 'metrics'}
        </span>
      </button>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onUse}
        aria-label={`Use ${template.name} template`}
        className="shrink-0 text-muted-foreground opacity-0 group-hover/tpl:opacity-100"
      >
        <Plus />
      </Button>
    </div>
  )
}
