'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  MetricGroupKey,
  Model,
  ModelChange,
  ModelPreview,
  ModelSummary,
} from '../types'
import { MODEL_TEMPLATES } from '../templates'
import { createSeedModels } from '../services/seed'
import {
  buildModelSummary,
  runModelPreview,
} from '../services/model-lab-service'
import { buildMetrics, normalizeWeights } from '../utils/weights'
import { createId } from '../utils/helpers'

const PREVIEW_LIMIT = 12

/** Deep-ish clone of a model so edits never mutate the saved copy. */
function cloneModel(model: Model): Model {
  return {
    ...model,
    metrics: model.metrics.map((metric) => ({ ...metric })),
    versions: model.versions.map((version) => ({
      ...version,
      metrics: version.metrics.map((metric) => ({ ...metric })),
    })),
  }
}

export interface UseModelLab {
  models: Model[]
  filteredModels: Model[]
  templates: typeof MODEL_TEMPLATES
  working: Model | null
  readOnly: boolean
  isDirty: boolean
  summary: ModelSummary | null
  preview: ModelPreview | null
  isRunning: boolean
  changes: ModelChange[]
  search: string
  setSearch: (value: string) => void
  selectModel: (id: string) => void
  selectTemplate: (key: string) => void
  createModel: () => void
  createFromTemplate: (key: string) => void
  duplicateModel: (id: string) => void
  renameModel: (id: string, name: string, description: string) => void
  deleteModel: (id: string) => void
  toggleFavorite: (id: string) => void
  setMetricWeight: (key: MetricGroupKey, weight: number) => void
  toggleMetric: (key: MetricGroupKey, enabled: boolean) => void
  resetWeights: () => void
  normalize: () => void
  saveModel: () => void
  saveVersion: (note?: string) => void
  runModel: () => void
}

export function useModelLab(initialModelId?: string): UseModelLab {
  const [models, setModels] = useState<Model[]>(() => createSeedModels())
  const [working, setWorking] = useState<Model | null>(null)
  const [readOnly, setReadOnly] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<ModelPreview | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [changesByModel, setChangesByModel] = useState<
    Record<string, ModelChange[]>
  >({})

  const runToken = useRef(0)

  const recordChange = useCallback(
    (modelId: string, label: string, detail?: string) => {
      setChangesByModel((prev) => {
        const entry: ModelChange = {
          id: createId('chg'),
          label,
          detail,
          at: new Date().toISOString(),
        }
        const existing = prev[modelId] ?? []
        return { ...prev, [modelId]: [entry, ...existing].slice(0, 8) }
      })
    },
    [],
  )

  /** Run the working model through the engine and store the preview. */
  const executeRun = useCallback(async (model: Model) => {
    const token = ++runToken.current
    setIsRunning(true)
    try {
      const result = await runModelPreview(model, { limit: PREVIEW_LIMIT })
      if (token === runToken.current) setPreview(result)
    } catch (error) {
      console.log('[v0] runModelPreview failed:', error)
      if (token === runToken.current) setPreview(null)
    } finally {
      if (token === runToken.current) setIsRunning(false)
    }
  }, [])

  // Select the initial model (deep link) or the first saved model on mount.
  // Note: state updates happen first and synchronously; the engine run is
  // scheduled separately so a rejection can never discard the selection.
  useEffect(() => {
    ;(globalThis as Record<string, unknown>).__mlEffect = `ran models=${models.length}`
    if (working) return
    const target =
      (initialModelId && models.find((model) => model.id === initialModelId)) ||
      models[0]
    ;(globalThis as Record<string, unknown>).__mlEffect = `target=${target?.id ?? 'none'}`
    if (!target) return
    const clone = cloneModel(target)
    setWorking(clone)
    setReadOnly(false)
    setIsDirty(false)
    void Promise.resolve().then(() => executeRun(clone))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectModel = useCallback(
    (id: string) => {
      const target = models.find((model) => model.id === id)
      if (!target) return
      const clone = cloneModel(target)
      setWorking(clone)
      setReadOnly(false)
      setIsDirty(false)
      void executeRun(clone)
    },
    [models, executeRun],
  )

  const selectTemplate = useCallback(
    (key: string) => {
      const template = MODEL_TEMPLATES.find((item) => item.key === key)
      if (!template) return
      const previewModel: Model = {
        id: `template-${template.key}`,
        name: template.name,
        description: template.description,
        origin: 'template',
        templateKey: template.key,
        favorite: false,
        metrics: template.metrics.map((metric) => ({ ...metric })),
        versions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setWorking(previewModel)
      setReadOnly(true)
      setIsDirty(false)
      void executeRun(previewModel)
    },
    [executeRun],
  )

  const insertModel = useCallback(
    (model: Model, changeLabel: string) => {
      setModels((prev) => [model, ...prev])
      recordChange(model.id, changeLabel)
      const clone = cloneModel(model)
      setWorking(clone)
      setReadOnly(false)
      setIsDirty(false)
      void executeRun(clone)
    },
    [executeRun, recordChange],
  )

  const createModel = useCallback(() => {
    const now = new Date().toISOString()
    const model: Model = {
      id: createId('model'),
      name: 'Untitled Model',
      description: 'A fresh model — enable metric groups and tune their weights.',
      origin: 'custom',
      favorite: false,
      metrics: buildMetrics({ 'strokes-gained': 25, 'recent-form': 25 }),
      versions: [],
      createdAt: now,
      updatedAt: now,
    }
    insertModel(model, 'Created model')
    toast.success('Model created')
  }, [insertModel])

  const createFromTemplate = useCallback(
    (key: string) => {
      const template = MODEL_TEMPLATES.find((item) => item.key === key)
      if (!template) return
      const now = new Date().toISOString()
      const model: Model = {
        id: createId('model'),
        name: template.name,
        description: template.description,
        origin: 'custom',
        templateKey: template.key,
        favorite: false,
        metrics: template.metrics.map((metric) => ({ ...metric })),
        versions: [
          {
            id: createId('v'),
            label: 'v1',
            note: `Created from the ${template.name} template.`,
            metrics: template.metrics.map((metric) => ({ ...metric })),
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      }
      insertModel(model, 'Created from template')
      toast.success(`Created "${template.name}" from template`)
    },
    [insertModel],
  )

  const duplicateModel = useCallback(
    (id: string) => {
      const source = models.find((model) => model.id === id)
      if (!source) return
      const now = new Date().toISOString()
      const model: Model = {
        ...cloneModel(source),
        id: createId('model'),
        name: `${source.name} (Copy)`,
        origin: 'custom',
        favorite: false,
        versions: [],
        createdAt: now,
        updatedAt: now,
      }
      insertModel(model, 'Duplicated model')
      toast.success('Model duplicated')
    },
    [models, insertModel],
  )

  const renameModel = useCallback(
    (id: string, name: string, description: string) => {
      const trimmed = name.trim() || 'Untitled Model'
      const now = new Date().toISOString()
      setModels((prev) =>
        prev.map((model) =>
          model.id === id
            ? { ...model, name: trimmed, description, updatedAt: now }
            : model,
        ),
      )
      setWorking((current) =>
        current && current.id === id
          ? { ...current, name: trimmed, description }
          : current,
      )
      recordChange(id, 'Renamed model', trimmed)
      toast.success('Model updated')
    },
    [recordChange],
  )

  const deleteModel = useCallback(
    (id: string) => {
      const removed = models.find((model) => model.id === id)
      setModels((prev) => prev.filter((model) => model.id !== id))
      setChangesByModel((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setWorking((current) => {
        if (current && current.id === id) {
          const remaining = models.filter((model) => model.id !== id)
          const next = remaining[0] ? cloneModel(remaining[0]) : null
          if (next) {
            setReadOnly(false)
            setIsDirty(false)
            void executeRun(next)
          } else {
            setPreview(null)
          }
          return next
        }
        return current
      })
      if (removed) toast.success(`Deleted "${removed.name}"`)
    },
    [models, executeRun],
  )

  const toggleFavorite = useCallback((id: string) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id ? { ...model, favorite: !model.favorite } : model,
      ),
    )
    setWorking((current) =>
      current && current.id === id
        ? { ...current, favorite: !current.favorite }
        : current,
    )
  }, [])

  const editMetrics = useCallback(
    (updater: (metrics: Model['metrics']) => Model['metrics']) => {
      setWorking((current) => {
        if (!current || current.origin === 'template') return current
        setIsDirty(true)
        return { ...current, metrics: updater(current.metrics) }
      })
    },
    [],
  )

  const setMetricWeight = useCallback(
    (key: MetricGroupKey, weight: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(weight)))
      editMetrics((metrics) =>
        metrics.map((metric) =>
          metric.key === key
            ? { ...metric, weight: clamped, enabled: clamped > 0 ? true : metric.enabled }
            : metric,
        ),
      )
    },
    [editMetrics],
  )

  const toggleMetric = useCallback(
    (key: MetricGroupKey, enabled: boolean) => {
      editMetrics((metrics) =>
        metrics.map((metric) =>
          metric.key === key ? { ...metric, enabled } : metric,
        ),
      )
    },
    [editMetrics],
  )

  const resetWeights = useCallback(() => {
    setWorking((current) => {
      if (!current || current.origin === 'template') return current
      const saved = models.find((model) => model.id === current.id)
      if (!saved) return current
      setIsDirty(false)
      const restored = { ...current, metrics: saved.metrics.map((m) => ({ ...m })) }
      void executeRun(restored)
      return restored
    })
    toast('Weights reset to the last saved values')
  }, [models, executeRun])

  const normalize = useCallback(() => {
    editMetrics((metrics) => normalizeWeights(metrics))
    toast('Weights normalized to 100%')
  }, [editMetrics])

  const saveModel = useCallback(() => {
    setWorking((current) => {
      if (!current || current.origin === 'template') return current
      const now = new Date().toISOString()
      const saved = { ...current, updatedAt: now }
      setModels((prev) => {
        const exists = prev.some((model) => model.id === current.id)
        return exists
          ? prev.map((model) => (model.id === current.id ? saved : model))
          : [saved, ...prev]
      })
      recordChange(current.id, 'Saved model')
      setIsDirty(false)
      toast.success('Model saved')
      return current
    })
  }, [recordChange])

  const saveVersion = useCallback(
    (note?: string) => {
      setWorking((current) => {
        if (!current || current.origin === 'template') return current
        const now = new Date().toISOString()
        const label = `v${current.versions.length + 1}`
        const version = {
          id: createId('v'),
          label,
          note,
          metrics: current.metrics.map((metric) => ({ ...metric })),
          createdAt: now,
        }
        const updated = {
          ...current,
          versions: [...current.versions, version],
          updatedAt: now,
        }
        setModels((prev) => {
          const exists = prev.some((model) => model.id === current.id)
          return exists
            ? prev.map((model) => (model.id === current.id ? updated : model))
            : [updated, ...prev]
        })
        recordChange(current.id, `Saved ${label}`, note)
        setIsDirty(false)
        toast.success(`Saved version ${label}`)
        return updated
      })
    },
    [recordChange],
  )

  const runModel = useCallback(() => {
    if (working) void executeRun(working)
  }, [working, executeRun])

  const filteredModels = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return models
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query),
    )
  }, [models, search])

  const summary = useMemo(
    () => (working ? buildModelSummary(working) : null),
    [working],
  )

  const changes = useMemo(
    () => (working ? changesByModel[working.id] ?? [] : []),
    [working, changesByModel],
  )

  return {
    models,
    filteredModels,
    templates: MODEL_TEMPLATES,
    working,
    readOnly,
    isDirty,
    summary,
    preview,
    isRunning,
    changes,
    search,
    setSearch,
    selectModel,
    selectTemplate,
    createModel,
    createFromTemplate,
    duplicateModel,
    renameModel,
    deleteModel,
    toggleFavorite,
    setMetricWeight,
    toggleMetric,
    resetWeights,
    normalize,
    saveModel,
    saveVersion,
    runModel,
  }
}
