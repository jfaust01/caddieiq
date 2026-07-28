import { formatDistanceToNow } from 'date-fns'

interface DashboardGreetingProps {
  userName: string | null | undefined
  lastRefreshTime: string
  onRefresh: () => void
}

export function DashboardGreeting({ userName, lastRefreshTime, onRefresh }: DashboardGreetingProps) {
  const displayName = userName ? userName.split(' ')[0] : 'there'
  const greeting = getGreeting()
  const refreshAgo = formatDistanceToNow(new Date(lastRefreshTime), { addSuffix: true })

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {displayName}
          </h1>
          <span className="text-sm text-white/40">👋</span>
        </div>
        <p className="mt-1 text-sm text-white/60">
          Here's your tournament command center
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-white/40">Last updated</p>
          <p className="text-sm text-white/70">{refreshAgo}</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.02] text-white/60 transition-all hover:bg-white/[0.05] hover:text-white"
          aria-label="Refresh dashboard"
          title="Refresh data"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
