'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EntityOption } from './entity-options'

interface ModelOption {
  id: string
  label: string
  methodology: string
  entityKind: 'player' | 'tournament'
}

interface ExplainabilityPickerProps {
  models: ModelOption[]
  playerOptions: EntityOption[]
  tournamentOptions: EntityOption[]
  selectedModelId: string
  selectedEntityId: string | null
}

/**
 * Client-side control strip for the admin debug view. Selecting a model and an
 * entity navigates to `?model=&entityId=`, so the server component re-resolves
 * the canonical Explanation on every change — no client-side model logic.
 */
export function ExplainabilityPicker({
  models,
  playerOptions,
  tournamentOptions,
  selectedModelId,
  selectedEntityId,
}: ExplainabilityPickerProps) {
  const router = useRouter()
  const [modelId, setModelId] = useState(selectedModelId)
  const [entityId, setEntityId] = useState(selectedEntityId ?? '')

  const activeModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? models[0],
    [models, modelId],
  )
  const entityKind = activeModel?.entityKind ?? 'player'
  const entityOptions = entityKind === 'player' ? playerOptions : tournamentOptions

  function onModelChange(nextId: string | null) {
    if (!nextId) return
    setModelId(nextId)
    // Entity kind may change with the model; clear a now-invalid selection.
    const next = models.find((m) => m.id === nextId)
    if (next && next.entityKind !== entityKind) setEntityId('')
  }

  function run() {
    if (!entityId) return
    const params = new URLSearchParams({ model: modelId, entityId })
    router.push(`/admin/explainability?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Model</span>
          <Select value={modelId} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">
            {entityKind === 'player' ? 'Player' : 'Tournament'}
          </span>
          <Select value={entityId} onValueChange={(v) => setEntityId(v ?? '')}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  entityOptions.length
                    ? `Select a ${entityKind}`
                    : `No ${entityKind}s available`
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {entityOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>

        <Button onClick={run} disabled={!entityId}>
          Resolve
        </Button>
      </div>

      {activeModel ? (
        <p className="text-sm text-muted-foreground text-pretty">
          {activeModel.methodology}
        </p>
      ) : null}
    </div>
  )
}
