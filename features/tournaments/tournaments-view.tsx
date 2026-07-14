import { Flag, Plus } from 'lucide-react'

import { ResourceView } from '@/components/shared/resource-view'
import { Button } from '@/components/ui/button'

export function TournamentsView() {
  return (
    <ResourceView
      eyebrow="Data"
      title="Tournaments"
      description="Manage events, fields, and scheduling context used across your analytics."
      searchPlaceholder="Search tournaments..."
      emptyIcon={Flag}
      emptyTitle="No tournaments yet"
      emptyDescription="Add an event to track fields, schedules, and the context your models rely on."
      actions={
        <Button>
          <Plus data-icon="inline-start" />
          Add tournament
        </Button>
      }
    />
  )
}
