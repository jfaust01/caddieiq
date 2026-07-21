'use client'

import { AiGolfAnalystInterface } from '@/features/analyst/components/ai-golf-analyst-interface'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function AnalystPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">AI Golf Analyst</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Powered by CaddieIQ historical data and real-time projections
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <AiGolfAnalystInterface />
      </div>
    </div>
  )
}
