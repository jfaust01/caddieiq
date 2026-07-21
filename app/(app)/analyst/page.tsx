'use client'

import { AiGolfAnalystInterface } from '@/features/analyst/components/ai-golf-analyst-interface'
import { PageHeader } from '@/features/ui/shared'
import { Brain } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AnalystPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border px-4 md:px-6 py-4 md:py-6">
        <PageHeader
          title="AI Golf Analyst"
          description="Data-driven insights powered by CaddieIQ historical data and real-time projections"
          icon={<Brain className="h-6 w-6" />}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <AiGolfAnalystInterface />
      </div>
    </div>
  )
}
