import { PageHeader } from '@/features/ui/shared'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentDirectory } from '@/features/tournaments/components/tournament-directory'
import { Flag, Calendar, Users, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function TournamentsView() {
  return (
    <PageShell>
      <PageHeader
        title="Tournaments"
        description="Schedule, fields, and event context for upcoming tournaments."
        icon={<Flag className="h-6 w-6" />}
      />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-foreground/60">This Week</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-foreground/60">Avg Field</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-foreground/60">Avg Purse</p>
                <p className="text-2xl font-bold">$9M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flag className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-foreground/60">This Season</p>
                <p className="text-2xl font-bold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TournamentDirectory />
    </PageShell>
  )
}
