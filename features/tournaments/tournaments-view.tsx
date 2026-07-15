import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentDirectory } from '@/features/tournaments/components/tournament-directory'

export function TournamentsView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Data"
        title="Tournaments"
        description="Browse the events that power your models and analytics. Search by name and filter by status, tour, or season to find a tournament."
      />
      <TournamentDirectory />
    </PageShell>
  )
}
