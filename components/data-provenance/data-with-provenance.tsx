'use client'

import { ProvenanceBadge } from './provenance-badge'
import type { DataProvenance } from '@/lib/types/data-provenance'

interface DataWithProvenanceProps {
  value: React.ReactNode
  provenance: DataProvenance
  showDebugMode?: boolean
}

export function DataWithProvenance({
  value,
  provenance,
  showDebugMode = false,
}: DataWithProvenanceProps) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Unavailable</span>
        {showDebugMode && (
          <ProvenanceBadge
            status={provenance.status}
            source={provenance.source}
            lastUpdated={provenance.lastUpdated}
            confidence={provenance.confidence}
            verified={provenance.verified}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span>{value}</span>
      {showDebugMode && (
        <ProvenanceBadge
          status={provenance.status}
          source={provenance.source}
          lastUpdated={provenance.lastUpdated}
          confidence={provenance.confidence}
          verified={provenance.verified}
        />
      )}
    </div>
  )
}
