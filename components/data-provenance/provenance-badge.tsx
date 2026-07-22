'use client'

import { useState } from 'react'
import { DataProvenance, DATA_STATUS_CONFIG, getFreshnessText } from '@/lib/types/data-provenance'
import { useDataDebug } from '@/lib/data-debug/debug-context'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ProvenanceBadgeProps {
  provenance: DataProvenance
  threshold?: number
}

const COLOR_MAP = {
  green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  gray: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800',
}

export function ProvenanceBadge({ provenance, threshold }: ProvenanceBadgeProps) {
  const [open, setOpen] = useState(false)
  const { enabled } = useDataDebug()

  if (!enabled) {
    return null
  }

  const config = DATA_STATUS_CONFIG[provenance.status]
  const colorClass = COLOR_MAP[config.color as keyof typeof COLOR_MAP]
  const freshnessText = provenance.lastUpdatedAt && threshold
    ? getFreshnessText(provenance.lastUpdatedAt, threshold)
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border cursor-pointer transition-colors ${colorClass}`}
          title={`${config.label} · Click for details`}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">Data Provenance</h4>
          </div>

          <div className="space-y-2">
            {provenance.sourceName && (
              <div>
                <span className="text-xs text-muted-foreground">Source:</span>
                <p className="font-medium">{provenance.sourceName}</p>
              </div>
            )}

            {provenance.sourceLocation && (
              <div>
                <span className="text-xs text-muted-foreground">Location:</span>
                <p className="font-mono text-xs">{provenance.sourceLocation}</p>
              </div>
            )}

            {provenance.sourceEndpoint && (
              <div>
                <span className="text-xs text-muted-foreground">Endpoint:</span>
                <p className="font-mono text-xs">{provenance.sourceEndpoint}</p>
              </div>
            )}

            {provenance.retrievedAt && (
              <div>
                <span className="text-xs text-muted-foreground">Retrieved:</span>
                <p>{provenance.retrievedAt.toLocaleString()}</p>
              </div>
            )}

            {provenance.lastUpdatedAt && (
              <div>
                <span className="text-xs text-muted-foreground">Last Updated:</span>
                <p>{freshnessText}</p>
              </div>
            )}

            {provenance.formula && (
              <div>
                <span className="text-xs text-muted-foreground">Formula:</span>
                <p className="font-mono text-xs">{provenance.formula}</p>
              </div>
            )}

            {provenance.inputFields && provenance.inputFields.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Inputs:</span>
                <p className="text-xs">{provenance.inputFields.join(', ')}</p>
              </div>
            )}

            {provenance.confidence !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <p className="font-medium">{Math.round(provenance.confidence * 100)}%</p>
              </div>
            )}

            {provenance.isVerified && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ Verified
              </div>
            )}

            {provenance.verificationNotes && (
              <div>
                <span className="text-xs text-muted-foreground">Verification:</span>
                <p className="text-xs italic">{provenance.verificationNotes}</p>
              </div>
            )}

            {provenance.fallbackReason && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Fallback: {provenance.fallbackReason}
              </div>
            )}

            {provenance.errorMessage && (
              <div className="text-xs text-red-600 dark:text-red-400">
                Error: {provenance.errorMessage}
              </div>
            )}
          </div>

          {provenance.rawValue !== undefined && (
            <div className="border-t pt-2">
              <span className="text-xs text-muted-foreground">Raw Value:</span>
              <pre className="font-mono text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(provenance.rawValue, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
