import { LayoutGrid, List, Plus, SlidersHorizontal } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { SearchBar } from '@/components/shared/search-bar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ModelsView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Build"
        title="Models"
        description="Design, tune, and deploy custom models. Compose inputs and scoring logic to generate your own picks."
        actions={
          <Button>
            <Plus data-icon="inline-start" />
            New model
          </Button>
        }
      />

      <Tabs defaultValue="all" className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">
              <LayoutGrid data-icon="inline-start" />
              All
            </TabsTrigger>
            <TabsTrigger value="drafts">
              <List data-icon="inline-start" />
              Drafts
            </TabsTrigger>
          </TabsList>
          <SearchBar placeholder="Search models..." className="sm:max-w-sm" />
        </div>

        <TabsContent value="all">
          <EmptyState
            icon={SlidersHorizontal}
            title="No models yet"
            description="Create your first model to define inputs, weights, and scoring logic."
            action={
              <Button>
                <Plus data-icon="inline-start" />
                Create model
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="drafts">
          <EmptyState
            icon={List}
            title="No drafts"
            description="Models you are still working on will show up here."
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
