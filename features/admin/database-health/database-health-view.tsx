import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionHeader } from "@/components/shared/section-header"
import type { DatabaseHealthReport } from "@/lib/system-health/database-health"

import { HealthOverview } from "./health-overview"
import { ImportPipelines } from "./import-pipelines"
import { KpiCards } from "./kpi-cards"
import { RebuildCourseIntelligence } from "./rebuild-course-intelligence"
import { RebuildCourseAnalytics } from "./rebuild-course-analytics"
import { SystemWarningsPanel } from "./system-warnings-panel"
import { TableHealthPanel } from "./table-health-panel"

/**
 * Main database health dashboard view. Displays comprehensive operational status
 * of the database, import pipelines, and system health in under 30 seconds.
 */
export function DatabaseHealthView({ report }: { report: DatabaseHealthReport }) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Internal operations"
        title="Database Health"
        description="Live operational dashboard. Overall platform health, table populations, import pipelines, and system warnings at a glance."
      />

      {/* Health Overview */}
      <section aria-label="Overall health status" className="flex flex-col gap-4">
        <HealthOverview
          status={report.overallStatus}
          healthPercentage={report.healthPercentage}
          generatedAt={report.generatedAt}
        />
      </section>

      {/* KPI Cards */}
      <section aria-label="Database metrics" className="flex flex-col gap-4">
        <KpiCards kpis={report.kpis} />
      </section>

      {/* System Warnings */}
      {report.warnings.length > 0 && (
        <section aria-label="System warnings" className="flex flex-col gap-4">
          <SectionHeader
            title="System Warnings"
            description={`${report.warnings.length} warning${report.warnings.length !== 1 ? "s" : ""} requiring attention`}
          />
          <SystemWarningsPanel warnings={report.warnings} />
        </section>
      )}

      {/* Table Health */}
      <section aria-label="Table health status" className="flex flex-col gap-4">
        <SectionHeader
          title="Table Health"
          description="Database table populations, status, and last updated timestamps"
        />
        <TableHealthPanel tables={report.tables} />
      </section>

      {/* Import Pipelines */}
      <section aria-label="Import pipelines" className="flex flex-col gap-4">
        <SectionHeader
          title="Import Pipelines"
          description="Status, recency, and performance of data import processes"
        />
        <ImportPipelines pipelines={report.pipelines} />
      </section>

      {/* Administrative Actions */}
      <section aria-label="Administrative actions" className="flex flex-col gap-4">
        <SectionHeader
          title="Administrative Actions"
          description="Tools for rebuilding and maintaining platform intelligence"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <RebuildCourseIntelligence />
          <RebuildCourseAnalytics />
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Report generated {report.generatedAt.slice(0, 16).replace("T", " ")} UTC. Counts are read live from the database on each
        request.
      </p>
    </PageShell>
  )
}
