'use client'

import {
  Copy,
  FunctionSquare,
  Pencil,
  Play,
  Save,
  SlidersHorizontal,
  Star,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { UseModelLab } from '../hooks/use-model-lab'
import { metricGroupsByCategory } from '../utils/metric-groups'
import { totalWeight } from '../utils/weights'
import { MetricGroupControl } from './metric-group-control'
import { WeightSummary } from './weight-summary'

interface ModelBuilderProps {
  lab: UseModelLab
  onRename: () => void
}

export function ModelBuilder({ lab, onRename }: ModelBuilderProps) {
  const { working, readOnly, isDirty, summary } = lab

  if (!working || !summary) {
    return null
  }

  const total = totalWeight(working.metrics)
  const categories = metricGroupsByCategory()

  return (
    <section
      aria-label="Model builder"
      className="flex flex-col gap-5 rounded-xl border bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-balance">
                {working.name}
              </h2>
              {working.favorite ? (
                <Star className="size-4 fill-warning text-warning" />
              ) : null}
              <Badge variant={working.origin === 'template' ? 'secondary' : 'outline'}>
                {working.origin === 'template' ? 'Template' : 'Custom model'}
              </Badge>
              {isDirty ? <Badge variant="ghost">Unsaved changes</Badge> : null}
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {working.description}
            </p>
          </div>
          {!readOnly ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRename}
              aria-label="Rename model"
            >
              <Pencil />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={lab.runModel} disabled={lab.isRunning}>
            <Play data-icon="inline-start" />
            {lab.isRunning ? 'Running…' : 'Run model'}
          </Button>
          {readOnly ? (
            <Button
              variant="secondary"
              onClick={() => lab.createFromTemplate(working.templateKey ?? '')}
            >
              <Copy data-icon="inline-start" />
              Duplicate to edit
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={lab.saveModel}
                disabled={!isDirty}
              >
                <Save data-icon="inline-start" />
                Save
              </Button>
              <Button variant="outline" onClick={() => lab.saveVersion()}>
                Save as new version
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Mode switch */}
      <div className="flex items-center gap-1 rounded-lg border bg-surface/60 p-1">
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-sm font-medium text-foreground ring-1 ring-foreground/10',
          )}
        >
          <SlidersHorizontal className="size-4" />
          Weights
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground" />
            }
          >
            <FunctionSquare className="size-4" />
            Formula
            <Badge variant="secondary" className="ml-1">
              Soon
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Formula mode lets you write custom scoring expressions. Coming soon.
          </TooltipContent>
        </Tooltip>
      </div>

      {readOnly ? (
        <p className="rounded-lg border border-dashed bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
          This is a built-in template. Duplicate it to tune weights and save your
          own version.
        </p>
      ) : null}

      {/* Metric groups */}
      <div className="flex flex-col gap-5">
        {categories.map(({ category, groups }) => (
          <div key={category} className="flex flex-col gap-3">
            <h3 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {category}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {groups.map((definition) => {
                const metric = working.metrics.find(
                  (item) => item.key === definition.key,
                )
                if (!metric) return null
                const share =
                  metric.enabled && total > 0
                    ? Math.round((metric.weight / total) * 100)
                    : 0
                return (
                  <MetricGroupControl
                    key={definition.key}
                    definition={definition}
                    metric={metric}
                    share={share}
                    disabled={readOnly}
                    onToggle={(enabled) => lab.toggleMetric(definition.key, enabled)}
                    onWeightChange={(weight) =>
                      lab.setMetricWeight(definition.key, weight)
                    }
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Weight summary + actions */}
      <WeightSummary
        total={summary.totalWeight}
        overweight={summary.overweight}
        disabled={readOnly}
        onReset={lab.resetWeights}
        onNormalize={lab.normalize}
      />
    </section>
  )
}
