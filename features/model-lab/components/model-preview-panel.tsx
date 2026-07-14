'use client'

import type { ModelChange, ModelPreview, ModelSummary } from '../types'
import { ModelSummaryCards } from './model-summary-cards'
import { RankingPreview } from './ranking-preview'
import { RecentChanges } from './recent-changes'
import { AiInsightCard } from './ai-insight-card'

interface ModelPreviewPanelProps {
  summary: ModelSummary
  preview: ModelPreview
  changes: ModelChange[]
  isLoading?: boolean
}

/**
 * Right column of the Model Lab workspace: summary cards, the live mock ranking
 * preview, an AI-analysis placeholder, and the recent-changes feed.
 */
export function ModelPreviewPanel({
  summary,
  preview,
  changes,
  isLoading = false,
}: ModelPreviewPanelProps) {
  return (
    <aside
      className="flex flex-col gap-4"
      aria-label="Model preview and analysis"
    >
      <ModelSummaryCards summary={summary} />
      <RankingPreview rows={preview.rows} isLoading={isLoading} />
      <AiInsightCard />
      <RecentChanges changes={changes} />
    </aside>
  )
}
