export function ActivityFeedCard() {
  const activities = [
    { icon: '📊', title: 'Ownership projections updated', time: '2 min ago' },
    { icon: '🌤️', title: 'Weather updated for Detroit Golf Club', time: '4 min ago' },
    { icon: '🚫', title: '3 withdrawals detected', time: '12 min ago' },
    { icon: '⏰', title: 'Tee times have been released', time: '18 min ago' },
    { icon: '🤖', title: 'AI models refreshed', time: '25 min ago' },
  ]

  return (
    <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Activity Feed
        </p>
        <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300">
          View All →
        </a>
      </div>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 pb-3 border-b border-white/[0.055] last:border-0 last:pb-0"
          >
            <span className="text-lg flex-shrink-0">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{activity.title}</p>
              <p className="text-xs text-white/40">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
