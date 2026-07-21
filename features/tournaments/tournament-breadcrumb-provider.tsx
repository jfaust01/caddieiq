'use client'

import { BreadcrumbContext } from '@/contexts/breadcrumb-context'
import type { TournamentSummary } from './types'

interface TournamentBreadcrumbProviderProps {
  tournament: TournamentSummary
  children: React.ReactNode
}

export function TournamentBreadcrumbProvider({
  tournament,
  children,
}: TournamentBreadcrumbProviderProps) {
  return (
    <BreadcrumbContext.Provider value={{ tournamentName: tournament.name }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}
