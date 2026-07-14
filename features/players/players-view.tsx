import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { PlayerDirectory } from '@/features/players/components/player-directory'

export function PlayersView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Data"
        title="Players"
        description="Browse the player universe that powers your models and rankings. Search, filter, and open a profile to explore form, rankings, and statistics."
      />
      <PlayerDirectory />
    </PageShell>
  )
}
