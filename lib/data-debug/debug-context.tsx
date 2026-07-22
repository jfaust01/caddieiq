'use client'

import React, { createContext, useContext, useState } from 'react'

interface DataDebugContextType {
  enabled: boolean
  toggle: () => void
}

const DataDebugContext = createContext<DataDebugContextType | undefined>(undefined)

export function DataDebugProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  const toggle = () => setEnabled(e => !e)

  return (
    <DataDebugContext.Provider value={{ enabled, toggle }}>
      {children}
    </DataDebugContext.Provider>
  )
}

export function useDataDebug() {
  const context = useContext(DataDebugContext)
  if (!context) {
    throw new Error('useDataDebug must be used within DataDebugProvider')
  }
  return context
}
