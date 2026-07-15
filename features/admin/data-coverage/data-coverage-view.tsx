import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { SectionHeader } from '@/components/shared/section-header'
import type { DataCoverageReport } from '@/lib/data-coverage/types'

import { CopyReportButton } from './copy-report-button'
import { CoverageSectionCard } from './coverage-section-card'
import { HealthPanel } from './health-panel'
import { SummaryGrid } from './summary-grid'

/** Human-readable "generated at" stamp, rendered deterministically (UTC). */
function formatGeneratedAt(iso: string): string {
  const date = new Date(iso)
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

/**
 * Internal Data Coverage Dashboard — a single server-rendered diagnostics view.
 * It answers "what data do we actually have, and how much of it is verified?"
 * across every domain, and is deliberately honest: provider-restricted feeds
 * are labelled as such rather than scored, so coverage is never inflated.
 */
export function DataCoverageView({ report }: { report: DataCoverageReport }) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Internal diagnostics"
        title="Data Coverage"
        description="A live, honest inventory of what the platform has ingested. Verified counts reflect only genuinely confirmed data; provider-restricted feeds are flagged, never inflated."
        actions={<CopyReportButton report={report} />}
      />

      <section aria-label="Platform coverage summary" className="flex flex-col gap-4">
        <SummaryGrid summary={report.summary} />
      </section>

      <section aria-label="Coverage by domain" className="flex flex-col gap-4">
        <SectionHeader
          title="Coverage by domain"
          description="Each domain breaks down into verified, pending, and missing records."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {report.sections.map((section) => (
            <CoverageSectionCard key={section.id} section={section} />
          ))}
        </div>
      </section>

      <section aria-label="Platform health" className="flex flex-col gap-4">
        <SectionHeader
          title="Provider &amp; import health"
          description="Connection state for external dependencies and the last successful import per domain."
        />
        <HealthPanel health={report.health} />
      </section>

      <p className="text-xs text-muted-foreground">
        Report generated {formatGeneratedAt(report.generatedAt)}. Counts are read live from the
        database on each request.
      </p>
    </PageShell>
  )
}
