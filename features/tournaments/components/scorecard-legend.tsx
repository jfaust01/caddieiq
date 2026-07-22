'use client'

interface ScorecardLegendProps {
  isDesktop?: boolean
}

export function ScorecardLegend({ isDesktop = true }: ScorecardLegendProps) {
  const legendItems = [
    { label: 'Eagle or better', svg: EagleIcon },
    { label: 'Birdie', svg: BirdieIcon },
    { label: 'Bogey', svg: BogeyIcon },
    { label: 'Double bogey+', svg: DoubleBogeyIcon },
  ]

  return (
    <div
      className={`flex gap-6 ${
        isDesktop
          ? 'justify-center items-center'
          : 'justify-start items-center overflow-x-auto'
      } text-xs`}
    >
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 whitespace-nowrap">
          <item.svg />
          <span className="text-[#9EA5B1]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function EagleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
      <circle cx="8" cy="12" r="3" />
      <circle cx="16" cy="12" r="3" />
    </svg>
  )
}

function BirdieIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function BogeyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
      <rect x="5" y="5" width="14" height="14" rx="1" />
    </svg>
  )
}

function DoubleBogeyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
      <rect x="3" y="3" width="6" height="6" rx="0.5" />
      <rect x="15" y="15" width="6" height="6" rx="0.5" />
    </svg>
  )
}
