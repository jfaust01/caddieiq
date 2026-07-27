'use client'

import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Performance badges shown below player name based on analytics scores.
 * Shows up to 2 badges: one for rating tier, one for form state.
 */
export function PlayerPerformanceBadges({ entrant }: { entrant: FieldEntrant }) {
  const badges: { label: string; bgColor: string; textColor: string }[] = []

  // Add rating badge based on ranking score
  if (entrant.rankingScore != null) {
    if (entrant.rankingScore >= 80) {
      badges.push({ label: 'Elite', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-200' })
    } else if (entrant.rankingScore >= 60) {
      badges.push({ label: 'Core Play', bgColor: 'bg-sky-500/20', textColor: 'text-sky-200' })
    } else if (entrant.rankingScore >= 40) {
      badges.push({ label: 'Value', bgColor: 'bg-amber-500/20', textColor: 'text-amber-200' })
    }
  }

  // Add form badge based on recent form
  if (entrant.formScore != null) {
    if (entrant.formScore >= 70) {
      badges.push({ label: 'Hot', bgColor: 'bg-rose-500/20', textColor: 'text-rose-200' })
    } else if (entrant.formScore <= 30) {
      badges.push({ label: 'Cold', bgColor: 'bg-slate-500/20', textColor: 'text-slate-200' })
    }
  }

  if (badges.length === 0) return null

  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {badges.slice(0, 2).map((badge, i) => (
        <span
          key={i}
          className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-medium whitespace-nowrap ${badge.bgColor} ${badge.textColor}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}
