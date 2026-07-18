'use client'

import { useEffect, useState } from 'react'
import { getQualityReport } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface QualityIssue {
  type: string
  severity: 'critical' | 'warning' | 'info'
  count: number
  percentage: number
  description: string
  examples?: string[]
}

interface QualityReport {
  totalCourses: number
  completeness: number
  issues: QualityIssue[]
  recommendations: string[]
}

export function CourseQualityReport() {
  const [report, setReport] = useState<QualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        const data = await getQualityReport()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quality report')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading quality report...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!report) return null

  const criticalCount = report.issues.filter((i) => i.severity === 'critical').length
  const warningCount = report.issues.filter((i) => i.severity === 'warning').length
  const infoCount = report.issues.filter((i) => i.severity === 'info').length

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Data Health</CardTitle>
          <CardDescription>
            Quality metrics across all {report.totalCourses} courses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Data Completeness</span>
              <span className="text-lg font-bold">{report.completeness}%</span>
            </div>
            <div className="w-full bg-muted rounded h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${report.completeness}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{criticalCount}</p>
                    <p className="text-xs text-muted-foreground">Critical Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{warningCount}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{infoCount}</p>
                    <p className="text-xs text-muted-foreground">Info Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Quality Issues</CardTitle>
            <CardDescription>
              {report.issues.length} issues found across imported courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.issues.map((issue, idx) => (
                <div key={idx} className="border-l-4 border-l-muted-foreground pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{issue.type}</h4>
                    <Badge
                      variant={
                        issue.severity === 'critical'
                          ? 'destructive'
                          : issue.severity === 'warning'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                  <p className="text-sm font-medium">
                    {issue.count} courses ({issue.percentage}%)
                  </p>
                  {issue.examples && issue.examples.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Examples:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {issue.examples.slice(0, 3).map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Next steps to improve data quality</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="text-muted-foreground">
                  {rec}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
