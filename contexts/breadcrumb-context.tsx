'use client'

import { createContext } from 'react'

export interface BreadcrumbContextType {
  tournamentName?: string
}

export const BreadcrumbContext = createContext<BreadcrumbContextType>({})
