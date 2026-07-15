'use client'

import { FileStack, FolderOpen, Plus, SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchBar } from '@/components/shared/search-bar'

import type { UseModelLab } from '../hooks/use-model-lab'
import { SavedModelItem } from './saved-model-item'
import { TemplateItem } from './template-item'

interface ModelListPanelProps {
  lab: UseModelLab
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

export function ModelListPanel({ lab, onRename, onDelete }: ModelListPanelProps) {
  const activeId = lab.working?.id
  const hasModels = lab.models.length > 0
  const hasResults = lab.filteredModels.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Models</h2>
        <Button size="sm" onClick={lab.createModel}>
          <Plus data-icon="inline-start" />
          New
        </Button>
      </div>

      <SearchBar
        placeholder="Search models..."
        onSearch={lab.setSearch}
        defaultValue={lab.search}
      />

      {/* Saved models */}
      <section className="flex flex-col gap-2" aria-label="Saved models">
        <div className="flex items-center gap-1.5 px-1">
          <FolderOpen className="size-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Saved Models
          </h3>
          {hasModels ? (
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {lab.models.length}
            </span>
          ) : null}
        </div>

        {!hasModels ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-surface/50 px-3 py-6 text-center">
            <FolderOpen className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No models yet</p>
            <p className="text-xs text-muted-foreground text-pretty">
              Create a model or start from a template below.
            </p>
            <Button size="sm" variant="outline" onClick={lab.createModel}>
              <Plus data-icon="inline-start" />
              Create model
            </Button>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-surface/50 px-3 py-6 text-center">
            <SearchX className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No matches</p>
            <p className="text-xs text-muted-foreground text-pretty">
              No saved models match “{lab.search}”.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="flex flex-col gap-1 pr-2">
              {lab.filteredModels.map((model) => (
                <SavedModelItem
                  key={model.id}
                  model={model}
                  active={model.id === activeId}
                  onSelect={() => lab.selectModel(model.id)}
                  onToggleFavorite={() => lab.toggleFavorite(model.id)}
                  onDuplicate={() => lab.duplicateModel(model.id)}
                  onRename={() => onRename(model.id)}
                  onDelete={() => onDelete(model.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </section>

      {/* Templates */}
      <section className="flex flex-col gap-2" aria-label="Built-in templates">
        <div className="flex items-center gap-1.5 px-1">
          <FileStack className="size-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Built-in Templates
          </h3>
        </div>
        <div className="flex flex-col gap-1">
          {lab.templates.map((template) => (
            <TemplateItem
              key={template.key}
              template={template}
              active={activeId === `template-${template.key}`}
              onPreview={() => lab.selectTemplate(template.key)}
              onUse={() => lab.createFromTemplate(template.key)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
