import Link from 'next/link'
import type { TournamentSummary } from '@/features/tournaments/types'

interface FeaturedTournamentHeroProps {
  tournament: TournamentSummary | null
  status: 'live' | 'upcoming' | 'completed'
}

export function FeaturedTournamentHero({ tournament, status }: FeaturedTournamentHeroProps) {
  if (!tournament) {
    return (
      <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-6">
        <div className="text-center text-sm text-white/40">
          No {status} tournaments available
        </div>
      </div>
    )
  }

  const statusLabel = {
    live: { badge: 'LIVE', color: 'bg-emerald-500/20 text-emerald-400' },
    upcoming: { badge: 'UPCOMING', color: 'bg-blue-500/20 text-blue-400' },
    completed: { badge: 'COMPLETED', color: 'bg-gray-500/20 text-gray-400' },
  }[status]

  const route = `/tournaments/${tournament.slug}`

  return (
    <Link href={route}>
      <div className="group rounded-lg border border-white/[0.055] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-6 transition-all hover:border-white/[0.1] hover:from-white/[0.06] hover:to-white/[0.03]">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded px-2 py-1 text-xs font-semibold ${statusLabel.color}`}>
                  {statusLabel.badge}
                </span>
                {tournament.tour && (
                  <span className="text-xs text-white/50">{tournament.tour.name}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {tournament.name}
              </h2>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tournament.playerCount && (
              <div>
                <p className="text-xs text-white/40">Players</p>
                <p className="text-sm font-semibold text-white">{tournament.playerCount}</p>
              </div>
            )}
            {tournament.course && (
              <div>
                <p className="text-xs text-white/40">Course</p>
                <p className="text-sm font-semibold text-white truncate">{tournament.course}</p>
              </div>
            )}
            {tournament.startDate && (
              <div>
                <p className="text-xs text-white/40">Starts</p>
                <p className="text-sm font-semibold text-white">
                  {new Date(tournament.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {tournament.purse && (
              <div>
                <p className="text-xs text-white/40">Purse</p>
                <p className="text-sm font-semibold text-white">
                  ${(tournament.purse / 1000000).toFixed(1)}M
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pt-2">
            <button className="w-full rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/30">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
