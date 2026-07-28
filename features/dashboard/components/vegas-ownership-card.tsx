export function VegasOwnershipCard() {
  const topOdds = [
    { name: 'Scottie Scheffler', odds: '+450', ownership: '34%' },
    { name: 'Rory McIlroy', odds: '+700', ownership: '22%' },
    { name: 'Xander Schauffele', odds: '+1200', ownership: '18%' },
  ]

  return (
    <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-4">
        Vegas Odds & Ownership
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Odds */}
        <div>
          <p className="text-xs font-semibold text-white/60 mb-3">TOP 3 WIN ODDS</p>
          <div className="space-y-2">
            {topOdds.map((player, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.03] p-3"
              >
                <span className="text-sm font-semibold text-white">{player.name}</span>
                <span className="text-sm text-emerald-400 font-semibold">{player.odds}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ownership */}
        <div>
          <p className="text-xs font-semibold text-white/60 mb-3">TOP OWNERSHIP</p>
          <div className="space-y-2">
            {topOdds.map((player, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.03] p-3"
              >
                <span className="text-sm font-semibold text-white">{player.name}</span>
                <span className="text-sm text-emerald-400 font-semibold">{player.ownership}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
