import { PageHeader } from '@/features/ui/shared'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentDirectory } from '@/features/tournaments/components/tournament-directory'
import { Flag } from 'lucide-react'

export function TournamentsView() {
  return (
    <PageShell>
      <PageHeader
        title="Tournaments"
        description="Browse events that power your models and analytics. Search by name and filter by status, tour, or season."
        icon={<Flag className="h-6 w-6" />}
      />
      <TournamentDirectory />
    </PageShell>
  )
}
