'use client'

import { Copy, MoreVertical, Pencil, Star, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { Model } from '../types'
import { activeMetricCount } from '../utils/weights'

interface SavedModelItemProps {
  model: Model
  active: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
}

export function SavedModelItem({
  model,
  active,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onRename,
  onDelete,
}: SavedModelItemProps) {
  const active_ = activeMetricCount(model.metrics)

  return (
    <div
      className={cn(
        'group/item flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors',
        active
          ? 'border-primary/40 bg-accent/60'
          : 'border-transparent hover:bg-muted',
      )}
    >
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={model.favorite ? 'Remove favorite' : 'Mark favorite'}
        aria-pressed={model.favorite}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-warning focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Star
          className={cn('size-3.5', model.favorite && 'fill-warning text-warning')}
        />
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-0.5 text-left outline-none"
        aria-current={active ? 'true' : undefined}
      >
        <span
          className={cn(
            'w-full truncate text-sm font-medium',
            active ? 'text-foreground' : 'text-foreground/90',
          )}
        >
          {model.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {active_} active {active_ === 1 ? 'metric' : 'metrics'}
          {model.versions.length > 0
            ? ` · ${model.versions.length} ${model.versions.length === 1 ? 'version' : 'versions'}`
            : ''}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground opacity-0 group-hover/item:opacity-100 aria-expanded:opacity-100"
              aria-label={`Actions for ${model.name}`}
            />
          }
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onRename}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleFavorite}>
            <Star />
            {model.favorite ? 'Unfavorite' : 'Favorite'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
