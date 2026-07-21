'use client'

import { useEffect, useState } from 'react'

/**
 * Diagnostic component that measures and logs actual element geometry.
 * Run once on mount to inspect header heights and positions during scroll.
 * Remove from production after diagnosis.
 */
export function DiagnosticHeaderGeometry() {
  const [report, setReport] = useState<string>('')

  useEffect(() => {
    const diagnosticData: string[] = []

    // Find elements
    const topNav = document.querySelector('header[class*="z-50"]') // TopNav
    const commandCenter = document.querySelector('header[class*="z-20"]') // CommandCenterHeader
    const sidebarInset = document.querySelector('[class*="SidebarInset"]')
    const main = document.querySelector('main')

    // Initial measurements
    diagnosticData.push('=== INITIAL MEASUREMENTS ===')
    if (topNav) {
      const rect = topNav.getBoundingClientRect()
      diagnosticData.push(`TopNav: height=${rect.height}px, top=${rect.top}px, z-index=${getComputedStyle(topNav).zIndex}`)
    }
    if (commandCenter) {
      const rect = commandCenter.getBoundingClientRect()
      diagnosticData.push(`CommandCenter: height=${rect.height}px, top=${rect.top}px, z-index=${getComputedStyle(commandCenter).zIndex}`)
    }

    // Scroll listener
    let scrollCount = 0
    const handleScroll = () => {
      scrollCount++
      if (scrollCount === 5) {
        // Measure after scrolling
        diagnosticData.push('\n=== AFTER SCROLL ===')
        if (topNav) {
          const rect = topNav.getBoundingClientRect()
          diagnosticData.push(`TopNav: top=${rect.top}px (should stay 0 if sticky)`)
        }
        if (commandCenter) {
          const rect = commandCenter.getBoundingClientRect()
          diagnosticData.push(`CommandCenter: top=${rect.top}px (should be 56px if working correctly)`)
        }
        window.removeEventListener('scroll', handleScroll)
        setReport(diagnosticData.join('\n'))
      }
    }

    window.addEventListener('scroll', handleScroll)

    // Log immediately
    setReport(diagnosticData.join('\n'))

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (!report) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-xs bg-black text-white text-xs p-3 font-mono rounded border border-green-500 overflow-auto max-h-96">
      <pre>{report}</pre>
    </div>
  )
}
