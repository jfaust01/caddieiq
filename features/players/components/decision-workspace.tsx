'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { PlayerAnalytics } from '@/lib/analytics/types'
import type { Explanation } from '@/lib/explainability'
import { WorkspaceStrengths } from './workspace-sections/workspace-strengths'
import { WorkspaceRisks } from './workspace-sections/workspace-risks'
import { WorkspaceNotes } from './workspace-sections/workspace-notes'
import { WorkspaceFavorites } from './workspace-sections/workspace-favorites'
import { WorkspaceTracking } from './workspace-sections/workspace-tracking'
import { WorkspaceActions } from './workspace-sections/workspace-actions'
import { WorkspaceConfidence } from './workspace-sections/workspace-confidence'
import { WorkspaceVerdict } from './workspace-sections/workspace-verdict'

interface DecisionWorkspaceProps {
  playerId: string
  playerName: string
  analytics: PlayerAnalytics
  explanation?: Explanation
}

export function DecisionWorkspace({
  playerId,
  playerName,
  analytics,
  explanation,
}: DecisionWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('verdict')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Decision Workspace</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal analysis hub for {playerName}
          </p>
        </CardHeader>
      </Card>

      {isMobile ? (
        // Mobile: Stacked vertical layout with tabs
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1">
              <TabsTrigger value="verdict" className="text-xs">Verdict</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
              <TabsTrigger value="confidence" className="text-xs">Confidence</TabsTrigger>
            </TabsList>

            <TabsContent value="verdict" className="space-y-4">
              <WorkspaceVerdict analytics={analytics} explanation={explanation} />
              <WorkspaceStrengths analytics={analytics} explanation={explanation} />
              <WorkspaceRisks analytics={analytics} explanation={explanation} />
            </TabsContent>

            <TabsContent value="notes">
              <WorkspaceNotes playerId={playerId} />
            </TabsContent>

            <TabsContent value="actions">
              <WorkspaceActions playerId={playerId} playerName={playerName} />
            </TabsContent>

            <TabsContent value="confidence">
              <WorkspaceConfidence analytics={analytics} />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <WorkspaceFavorites playerId={playerId} playerName={playerName} />
            <WorkspaceTracking playerId={playerId} playerName={playerName} />
          </div>
        </div>
      ) : (
        // Desktop: 2-column layout
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <WorkspaceVerdict analytics={analytics} explanation={explanation} />
            <WorkspaceStrengths analytics={analytics} explanation={explanation} />
            <WorkspaceRisks analytics={analytics} explanation={explanation} />
            <WorkspaceNotes playerId={playerId} />
          </div>

          <div className="flex flex-col gap-6">
            <WorkspaceConfidence analytics={analytics} />
            <WorkspaceActions playerId={playerId} playerName={playerName} />
            <div className="flex flex-col gap-2">
              <WorkspaceFavorites playerId={playerId} playerName={playerName} />
              <WorkspaceTracking playerId={playerId} playerName={playerName} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
