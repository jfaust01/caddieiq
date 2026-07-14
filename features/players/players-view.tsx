import { Plus, Users } from 'lucide-react'

import { ResourceView } from '@/components/shared/resource-view'
import { Button } from '@/components/ui/button'

export function PlayersView() {
  return (
    <ResourceView
      eyebrow="Data"
      title="Players"
      description="Browse and manage the player universe that powers your models and rankings."
      searchPlaceholder="Search players..."
      emptyIcon={Users}
      emptyTitle="No players yet"
      emptyDescription="Your player universe is empty. Import a roster or add players to begin building models."
      actions={
        <Button>
          <Plus data-icon="inline-start" />
          Add player
        </Button>
      }
    />
  )
}
