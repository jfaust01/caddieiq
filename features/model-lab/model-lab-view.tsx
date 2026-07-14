'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'

import { useModelLab } from './hooks/use-model-lab'
import { ModelListPanel } from './components/model-list-panel'
import { ModelBuilder } from './components/model-builder'
import { ModelPreviewPanel } from './components/model-preview-panel'
import { RenameModelDialog } from './components/rename-model-dialog'
import { DeleteModelDialog } from './components/delete-model-dialog'
import type { Model } from './types'

interface ModelLabViewProps {
  /** Optional deep-linked model id from the route. */
  initialModelId?: string
}

/**
 * Model Lab workspace: a three-column builder for composing custom ranking
 * models. Left = saved models + templates, center = the weight builder, right =
 * a live mock ranking preview (via the Ranking Engine), summary, AI-analysis
 * placeholder, and change history.
 *
 * All state is in-memory for v1 (see `useModelLab`).
 * TODO(data): persist models per user once the database milestone lands.
 */
export function ModelLabView({ initialModelId }: ModelLabViewProps) {
  const lab = useModelLab(initialModelId)

  const [renameTarget, setRenameTarget] = useState<Model | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Model | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function openRename(id: string) {
    const target = lab.models.find((model) => model.id === id) ?? null
    setRenameTarget(target)
    setRenameOpen(true)
  }

  function openRenameActive() {
    if (lab.working) {
      setRenameTarget(lab.working)
      setRenameOpen(true)
    }
  }

  function openDelete(id: string) {
    const target = lab.models.find((model) => model.id === id) ?? null
    setDeleteTarget(target)
    setDeleteOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Model Lab"
        description="Compose custom ranking models by weighting metric groups, then preview the field in real time."
      />

      <p data-ml-debug className="text-xs text-muted-foreground">
        {debug}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* Left: saved models + templates */}
        <ModelListPanel lab={lab} onRename={openRename} onDelete={openDelete} />

        {/* Center: builder */}
        <ModelBuilder lab={lab} onRename={openRenameActive} />

        {/* Right: preview + analysis (stacks under center below xl) */}
        <div className="lg:col-span-2 xl:col-span-1">
          {lab.working && lab.summary && lab.preview ? (
            <ModelPreviewPanel
              summary={lab.summary}
              preview={lab.preview}
              changes={lab.changes}
              isLoading={lab.isRunning}
            />
          ) : null}
        </div>
      </div>

      <RenameModelDialog
        model={renameTarget}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onSubmit={(name, description) => {
          if (renameTarget) lab.renameModel(renameTarget.id, name, description)
        }}
      />

      <DeleteModelDialog
        model={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          if (deleteTarget) lab.deleteModel(deleteTarget.id)
        }}
      />
    </div>
  )
}
