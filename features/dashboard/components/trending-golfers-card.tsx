export function TrendingGolfersCard() {
  const trendingPlayers = [
    { name: 'Cameron Young', movement: 'Leverage ↑ 18%', icon: '📈' },
    { name: 'Ben Griffin', movement: 'Leverage ↑ 14%', icon: '📈' },
    { name: 'Aaron Rai', movement: 'Leverage ↑ 11%', icon: '📈' },
    { name: 'Rory McIlroy', movement: 'Leverage ↓ 9%', icon: '📉' },
    { name: 'Corey Connors', movement: 'Leverage ↑ 8%', icon: '📈' },
  ]

  return (
    <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Trending Golfers
        </p>
        <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300">
          View All →
        </a>
      </div>

      <div className="space-y-3">
        {trendingPlayers.map((player, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{player.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{player.name}</p>
              </div>
            </div>
            <p className="text-xs text-white/60">{player.movement}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
