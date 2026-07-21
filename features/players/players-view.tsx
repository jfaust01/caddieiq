import { PageHeader } from '@/features/ui/shared'
import { PageShell } from '@/components/shared/page-shell'
import { PlayerDirectory } from '@/features/players/components/player-directory'
import { Users } from 'lucide-react'

export function PlayersView() {
  return (
    <PageShell>
      <PageHeader
        title="Players"
        description="Browse the player universe. Search, filter, and explore form, rankings, and statistics."
        icon={<Users className="h-6 w-6" />}
      />
      <PlayerDirectory />
    </PageShell>
  )
}
