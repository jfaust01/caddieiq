import { Trophy } from 'lucide-react'

import { ResourceView } from '@/components/shared/resource-view'

export function RankingsView() {
  return (
    <ResourceView
      eyebrow="Overview"
      title="Rankings"
      description="Live leaderboards ranked by your deployed models. Compare projected finishes across the current field."
      searchPlaceholder="Search rankings..."
      emptyIcon={Trophy}
      emptyTitle="No rankings available"
      emptyDescription="Deploy a model and select an active tournament to generate ranked projections."
    />
  )
}
