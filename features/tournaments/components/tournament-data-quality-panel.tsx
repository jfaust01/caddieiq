'use client'

import { AlertCircle, CheckCircle, Clock, Eye, EyeOff, MoreVertical, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatTimestamp } from '@/features/tournaments/utils/format'
import { useState } from 'react'

export interface ModuleStatus {
  name: string
  status: 'VERIFIED' | 'CALCULATED' | 'AI_GENERATED' | 'PARTIAL' | 'UNAVAILABLE' | 'STALE' | 'PLACEHOLDER' | 'ERROR'
  source: string
  recordCount: number
  lastUpdated: string | null
  missingInputs: string[]
  productionSafe: boolean
}

interface TournamentDataQualityPanelProps {
  modules: ModuleStatus[]
}

const statusColors = {
  VERIFIED: { bg: 'bg-green-900/20', border: 'border-green-700', text: 'text-green-400', icon: CheckCircle },
  CALCULATED: { bg: 'bg-blue-900/20', border: 'border-blue-700', text: 'text-blue-400', icon: TrendingUp },
  AI_GENERATED: { bg: 'bg-purple-900/20', border: 'border-purple-700', text: 'text-purple-400', icon: Sparkles },
  PARTIAL: { bg: 'bg-yellow-900/20', border: 'border-yellow-700', text: 'text-yellow-400', icon: AlertCircle },
  UNAVAILABLE: { bg: 'bg-gray-900/20', border: 'border-gray-700', text: 'text-gray-400', icon: Eye },
  STALE: { bg: 'bg-orange-900/20', border: 'border-orange-700', text: 'text-orange-400', icon: Clock },
  PLACEHOLDER: { bg: 'bg-red-900/20', border: 'border-red-700', text: 'text-red-600', icon: AlertCircle },
  ERROR: { bg: 'bg-red-900/20', border: 'border-red-700', text: 'text-red-600', icon: AlertCircle },
}

export function TournamentDataQualityPanel({ modules }: TournamentDataQualityPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Calculate summary
  const summary = {
    verified: modules.filter(m => m.status === 'VERIFIED').length,
    calculated: modules.filter(m => m.status === 'CALCULATED').length,
    aiGenerated: modules.filter(m => m.status === 'AI_GENERATED').length,
    partial: modules.filter(m => m.status === 'PARTIAL').length,
    unavailable: modules.filter(m => m.status === 'UNAVAILABLE').length,
    stale: modules.filter(m => m.status === 'STALE').length,
    placeholder: modules.filter(m => m.status === 'PLACEHOLDER').length,
    error: modules.filter(m => m.status === 'ERROR').length,
  }

  const dummyData = modules.filter(m => m.status === 'PLACEHOLDER' || m.status === 'ERROR').length
  const allProductionSafe = modules.every(m => m.productionSafe)

  return (
    <Card className="border border-gray-700 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Data Quality</h2>
            <p className="text-sm text-gray-400 mt-1">Tournament data source and completeness</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="text-gray-400 hover:text-gray-200"
          >
            <MoreVertical className="size-4" />
          </Button>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-5 gap-2 text-sm">
          <div className="bg-green-900/10 border border-green-700/30 rounded px-3 py-2">
            <div className="text-xs text-gray-400">Verified</div>
            <div className="text-lg font-semibold text-green-400">{summary.verified}</div>
          </div>
          <div className="bg-blue-900/10 border border-blue-700/30 rounded px-3 py-2">
            <div className="text-xs text-gray-400">Calculated</div>
            <div className="text-lg font-semibold text-blue-400">{summary.calculated}</div>
          </div>
          <div className="bg-purple-900/10 border border-purple-700/30 rounded px-3 py-2">
            <div className="text-xs text-gray-400">AI-Generated</div>
            <div className="text-lg font-semibold text-purple-400">{summary.aiGenerated}</div>
          </div>
          <div className="bg-yellow-900/10 border border-yellow-700/30 rounded px-3 py-2">
            <div className="text-xs text-gray-400">Partial/Other</div>
            <div className="text-lg font-semibold text-yellow-400">{summary.partial + summary.stale}</div>
          </div>
          <div className="bg-gray-900/10 border border-gray-700/30 rounded px-3 py-2">
            <div className="text-xs text-gray-400">Unavailable</div>
            <div className="text-lg font-semibold text-gray-400">{summary.unavailable}</div>
          </div>
        </div>

        {/* Production Safety Badge */}
        <div className={`px-4 py-2 rounded text-sm font-medium ${
          allProductionSafe 
            ? 'bg-green-900/30 border border-green-700/30 text-green-300'
            : 'bg-red-900/30 border border-red-700/30 text-red-300'
        }`}>
          {allProductionSafe ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4" />
              <span>✓ Production Safe</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>⚠ Contains Placeholder Data ({dummyData} modules)</span>
            </div>
          )}
        </div>

        {/* Module List */}
        <div className="space-y-2">
          {modules.map((module) => {
            const colors = statusColors[module.status]
            const Icon = colors.icon

            return (
              <div key={module.name} className={`border rounded p-3 space-y-2 ${colors.bg} ${colors.border}`}>
                {/* Module Header */}
                <button
                  onClick={() => setExpanded(expanded === module.name ? null : module.name)}
                  className="w-full text-left flex items-center justify-between hover:opacity-75"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`size-4 flex-shrink-0 ${colors.text}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-100">{module.name}</div>
                      <div className="text-xs text-gray-400">{module.source}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${colors.text}`}>
                      {module.status}
                    </span>
                    <span className="text-xs text-gray-400">{module.recordCount}</span>
                  </div>
                </button>

                {/* Expanded Details */}
                {expanded === module.name && (
                  <div className="pt-2 border-t border-gray-700/50 space-y-2 text-sm">
                    {module.lastUpdated && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Updated:</span>
                        <span className="text-gray-300">
                          {formatTimestamp(module.lastUpdated)}
                        </span>
                      </div>
                    )}
                    
                    {module.missingInputs.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-gray-400">Missing Inputs:</span>
                        <ul className="ml-2 space-y-1">
                          {module.missingInputs.map((input) => (
                            <li key={input} className="text-gray-400 text-xs">
                              • {input}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {showDebug && (
                      <div className="pt-2 border-t border-gray-700/50 mt-2 font-mono text-xs text-gray-500 space-y-1 bg-black/30 p-2 rounded">
                        <div>Status: {module.status}</div>
                        <div>Source: {module.source}</div>
                        <div>Records: {module.recordCount}</div>
                        <div>ProductionSafe: {module.productionSafe ? 'true' : 'false'}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
