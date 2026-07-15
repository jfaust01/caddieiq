import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentDetailTabs } from '@/features/tournaments/components/tournament-detail-tabs'
import { TournamentHero } from '@/features/tournaments/components/tournament-hero'
import { TournamentIntelligence } from '@/features/tournaments/components/tournament-intelligence'
import { TournamentOverview } from '@/features/tournaments/components/tournament-overview'
import { TournamentSidebar } from '@/features/tournaments/components/tournament-sidebar'
import type { TournamentSummary } from '@/features/tournaments/types'

interface TournamentDetailViewProps {
  tournament: TournamentSummary
}

/**
 * Tournament research hub. Organized for decisions, not database fields: a hero
 * that answers "what/how big/what conditions" at a glance, an intelligence
 * layer that frames why the event matters, quick-navigation tabs, and a live
 * Overview of the verified facts alongside a research sidebar. Sections without
 * imported data render intentional "Coming soon" placeholders rather than
 * broken layouts, and never expose raw ids or internal timestamps.
 */
export function TournamentDetailView({ tournament }: TournamentDetailViewProps) {
  return (
    <PageShell>
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        nativeButton={false}
        render={
          <Link href="/tournaments">
            <ChevronLeft data-icon="inline-start" />
            All tournaments
          </Link>
        }
      />

      <TournamentHero tournament={tournament} />

      <TournamentIntelligence />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TournamentDetailTabs overview={<TournamentOverview tournament={tournament} />} />
        </div>
        <aside className="lg:col-span-1" aria-label="Tournament research">
          <TournamentSidebar tournament={tournament} />
        </aside>
      </div>
    </PageShell>
  )
}
