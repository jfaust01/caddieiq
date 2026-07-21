import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabWorkspaceProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
  layoutVariant?: 'default' | 'compact'
}

export function TabWorkspace({
  tabs,
  defaultTab,
  className = '',
  layoutVariant = 'default',
}: TabWorkspaceProps) {
  const defaultValue = defaultTab || tabs[0]?.id

  const triggerClassName =
    layoutVariant === 'compact'
      ? 'text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2'
      : 'text-sm px-4 py-2'

  return (
    <Tabs defaultValue={defaultValue} className={className}>
      {/* Tab list with responsive scrolling */}
      <div className="overflow-x-auto border-b border-border/50 -mx-4 px-4 md:mx-0 md:px-0">
        <TabsList className="grid grid-flow-col w-max md:w-auto gap-1 bg-transparent p-0 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className={`${triggerClassName} flex items-center gap-2 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none`}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
