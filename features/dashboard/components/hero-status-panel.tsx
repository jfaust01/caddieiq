interface HeroStatusPanelProps {
  label: string
  value: string
  unit?: string
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
}

export function HeroStatusPanel({ label, value, unit, trend }: HeroStatusPanelProps) {
  return (
    <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white" style={{ fontSize: '28px', color: '#10D98A' }}>
          {value}
        </span>
        {unit && <span className="text-sm text-white/60">{unit}</span>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-xs font-semibold ${
              trend.direction === 'up'
                ? 'text-emerald-400'
                : trend.direction === 'down'
                  ? 'text-red-400'
                  : 'text-white/40'
            }`}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-white/40">vs yesterday</span>
        </div>
      )}
    </div>
  )
}
