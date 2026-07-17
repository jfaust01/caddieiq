import type { Metadata } from 'next'
import Link from 'next/link'
import { FileJson } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Import Tools',
  description: 'Admin tools for managing data imports.',
}

const importTools = [
  {
    title: 'GolfCourse API',
    description: 'Search, re-import, and debug GolfCourseAPI course data.',
    href: '/admin/imports/golfcourse',
    icon: FileJson,
  },
]

export default function ImportsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Import Tools</h1>
        <p className="text-muted-foreground">
          Admin-only tools for managing and debugging data imports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {importTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link key={tool.href} href={tool.href}>
              <Card className="cursor-pointer transition-colors hover:bg-accent h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="size-5" />
                        {tool.title}
                      </CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
