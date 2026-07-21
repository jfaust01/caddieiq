'use client'

import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TournamentDetailTabsProps {
  /** Compact overview panel content (redesigned for 2-3 viewport heights). */
  overview: ReactNode
  /** Optional additional tabs with full content. */
  additionalTabs?: Array<{
    value: string
    label: string
    content: ReactNode
    disabled?: boolean
    count?: number
  }>
}

/** No reserved tabs — all tabs are passed via additionalTabs. */

/**
 * Segmented quick-navigation for the tournament research hub. Overview tab now
 * shows a compact 2-3 viewport height dashboard with KPIs, top 5 leaderboard,
 * course fit summary, and key insights. Full content is available in dedicated tabs.
 * Field is enabled once a field is imported.
 */
export function TournamentDetailTabs({
  overview,
  additionalTabs = [],
}: TournamentDetailTabsProps) {
  // Use only the provided additional tabs
  const tabsToShow = additionalTabs

  return (
    <Tabs defaultValue="overview" className="gap-4 min-w-0">
      <div>
        <TabsList variant="line" className="h-9 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {tabsToShow.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled ?? false}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" className="flex flex-col gap-4 min-w-0">
        {overview}
      </TabsContent>

      {additionalTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="flex flex-col gap-4 min-w-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
