interface DashboardInsightCardProps {
  title: string
  description?: string
  primaryValue: string
  primaryLabel: string
  secondaryValue?: string
  secondaryLabel?: string
  icon?: React.ReactNode
  badge?: { label: string; color: string }
  onClick?: () => void
  href?: string
}

export function DashboardInsightCard({
  title,
  description,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  icon,
  badge,
  onClick,
  href,
}: DashboardInsightCardProps) {
  const Component = href ? 'a' : 'div'
  const props = href ? { href, className: 'block no-underline' } : { onClick }

  return (
    <Component
      {...props}
      className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              {title}
            </p>
            {description && (
              <p className="mt-0.5 text-xs text-white/50">{description}</p>
            )}
          </div>
          {icon && <div className="text-xl">{icon}</div>}
        </div>

        {/* Values */}
        <div className="space-y-2">
          <div>
            <p className="text-xs text-white/40">{primaryLabel}</p>
            <p className="text-2xl font-bold text-emerald-400">{primaryValue}</p>
          </div>
          {secondaryValue && (
            <div>
              <p className="text-xs text-white/40">{secondaryLabel}</p>
              <p className="text-lg font-semibold text-white">{secondaryValue}</p>
            </div>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <div className={`rounded px-2 py-1 text-xs font-semibold ${badge.color}`}>
            {badge.label}
          </div>
        )}
      </div>
    </Component>
  )
}
