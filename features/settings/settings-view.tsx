import { Settings } from 'lucide-react'
import { PageHeader } from '@/features/ui/shared'
import { PageShell } from '@/components/shared/page-shell'
import { WorkspaceForm } from '@/features/settings/workspace-form'
import { NotificationPreferences } from '@/features/settings/notification-preferences'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SettingsView() {
  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="Manage your workspace, preferences, and account configuration."
        icon={<Settings className="h-6 w-6" />}
      />

      <Tabs defaultValue="general" className="gap-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                Update how your workspace is identified across CaddieIQ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose which updates you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
