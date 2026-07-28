'use client'

export function EnhancedRoundDnaLegend() {
  const items = [
    { label: 'Eagle or Better', color: '#06B6D4', icon: '✦' },
    { label: 'Birdie', color: '#22C55E', icon: '●' },
    { label: 'Par', color: '#6B7280', icon: '●' },
    { label: 'Bogey', color: '#F59E0B', icon: '●' },
    { label: 'Double+', color: '#EF4444', icon: '●' },
    { label: 'Best Hole', color: '#06B6D4', icon: '★' },
    { label: 'Worst Hole', color: '#EF4444', icon: '⚠' }
  ]
  
  return (
    <div className="flex flex-wrap gap-6 px-8 py-4 bg-white/[0.02] border-t border-white/[0.05]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="text-lg"
            style={{ color: item.color }}
          >
            {item.icon}
          </span>
          <span className="text-xs text-white/70">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
