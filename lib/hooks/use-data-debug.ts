'use client'

import { useEffect, useState } from 'react'

export function useDataDebug() {
  const [debugMode, setDebugMode] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load from localStorage on client
    const saved = localStorage.getItem('caddieiq-data-debug')
    setDebugMode(saved === 'true')
    setIsLoaded(true)
  }, [])

  const toggleDebug = () => {
    const newValue = !debugMode
    setDebugMode(newValue)
    localStorage.setItem('caddieiq-data-debug', newValue ? 'true' : 'false')
  }

  return {
    debugMode: isLoaded ? debugMode : false,
    toggleDebug,
    isLoaded,
  }
}
