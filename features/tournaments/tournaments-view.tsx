import { PageShell } from '@/components/shared/page-shell'
import { TournamentDirectory } from '@/features/tournaments/components/tournament-directory'

export function TournamentsView() {
  return (
    <PageShell>
      <TournamentDirectory />
    </PageShell>
  )
}
