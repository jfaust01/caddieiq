import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentDetailTabs } from '@/features/tournaments/components/tournament-detail-tabs'
import { TournamentField } from '@/features/tournaments/components/tournament-field'
import { FieldRankingLeaders } from '@/features/tournaments/components/field-ranking-leaders'
import { TournamentHero } from '@/features/tournaments/components/tournament-hero'
import { TournamentIntelligence } from '@/features/tournaments/components/tournament-intelligence'
import { TournamentOverview } from '@/features/tournaments/components/tournament-overview'
import { TournamentSidebar } from '@/features/tournaments/components/tournament-sidebar'
import { tournamentService } from '@/features/tournaments/services/tournament-service'
import type { TournamentSummary } from '@/features/tournaments/types'

interface TournamentDetailViewProps {
  tournament: TournamentSummary
}

/**
 * Tournament research hub. Organized for decisions, not database fields: a hero
 * that answers "what/how big/what conditions" at a glance, an intelligence
 * layer that frames why the event matters, quick-navigation tabs, and a live
 * Overview + Field of the verified facts alongside a research sidebar. Sections
 * without imported data render intentional "Coming soon" placeholders rather
 * than broken layouts, and never expose raw ids or internal timestamps.
 */
export async function TournamentDetailView({ tournament }: TournamentDetailViewProps) {
  // The field powers both the hero "Field size" stat and the Field tab. Field
  // news reads through the request-cached field, so it adds no extra roster
  // query — only the news lookup itself.
  const [field, fieldNews] = await Promise.all([
    tournamentService.getTournamentField(tournament.id),
    tournamentService.getFieldNews(tournament.id),
  ])

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

      <TournamentHero tournament={tournament} fieldSize={field.size} />

      <TournamentIntelligence />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TournamentDetailTabs
            overview={
              <div className="flex flex-col gap-6">
                <TournamentOverview tournament={tournament} />
                <FieldRankingLeaders leaders={field.rankingLeaders} />
              </div>
            }
            field={<TournamentField field={field} />}
            fieldCount={field.size}
          />
        </div>
        <aside className="lg:col-span-1" aria-label="Tournament research">
          <TournamentSidebar
            tournament={tournament}
            fieldNews={fieldNews}
            hasField={field.size > 0}
          />
        </aside>
      </div>
    </PageShell>
  )
}
