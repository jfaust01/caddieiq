'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DataCoverageCategory } from '@/lib/admin/golfcourse-import-types'

interface DataCoverageDashboardProps {
  categories: DataCoverageCategory[]
  overallCoverage: number
}

export function DataCoverageDashboard({
  categories,
  overallCoverage,
}: DataCoverageDashboardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Course Data Completeness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{overallCoverage}%</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(overallCoverage)}% complete
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${overallCoverage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const availableCount = category.items.filter(i => i.available).length
        const totalCount = category.items.length

        return (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-sm capitalize">
                {category.category.replace(/([A-Z])/g, ' $1').trim()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {availableCount} of {totalCount} fields
                  </span>
                  <span className="font-mono font-medium">
                    {Math.round((availableCount / totalCount) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{
                      width: `${(availableCount / totalCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                {category.items.map((item) => (
                  <div
                    key={item.field}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {item.available ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <AlertCircle className="size-4 text-muted-foreground" />
                      )}
                      <span>{item.field}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {item.available && item.value !== null && item.value !== undefined
                        ? String(item.value).substring(0, 30)
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
