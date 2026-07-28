export function AiSlateSummaryCard() {
  const aiSummaryPoints = [
    'Ownership is condensed at the top with Scottie Scheffler (34%)',
    'Morning wave has a significant scoring advantage due to wind',
    'Best value cluster is between $6,500 - $8,000',
    'Courses favor long, accurate approach play this week',
    'High volatility tournament with low scoring conditions',
  ]

  const kpis = [
    { label: 'AVG PROJECTED SCORE', value: '70.4', trend: '-0.3 vs Yesterday' },
    { label: 'TOTAL OWNERSHIP', value: '100%', trend: '+2% vs Yesterday' },
  ]

  return (
    <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-6 space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-4">
          AI Slate Summary
        </p>
      </div>

      {/* Grid: Summary + KPIs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Summary Bullets */}
        <div className="lg:col-span-2 space-y-3">
          {aiSummaryPoints.map((point, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-emerald-400 flex-shrink-0 pt-0.5">•</span>
              <p className="text-sm text-white/80">{point}</p>
            </div>
          ))}
        </div>

        {/* Right: KPI Tiles */}
        <div className="space-y-3">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/[0.055] bg-white/[0.03] p-3"
            >
              <p className="text-xs text-white/40 font-semibold">{kpi.label}</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{kpi.value}</p>
              <p className="text-xs text-white/50 mt-1">{kpi.trend}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
