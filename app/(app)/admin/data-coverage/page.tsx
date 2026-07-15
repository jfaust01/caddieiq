import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { DataCoverageView } from '@/features/admin/data-coverage/data-coverage-view'
import { getDataCoverageReport } from '@/lib/data-coverage/service'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Data Coverage',
  description: 'Internal diagnostics: verified data coverage across the platform.',
}

// Counts are read live on every request; never cache this page.
export const dynamic = 'force-dynamic'

export default async function DataCoveragePage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  // ADMIN-only. Non-admins get a 404 rather than a 403 so the page's existence
  // is not disclosed — this route is intentionally absent from navigation.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN') notFound()

  let report
  try {
    report = await getDataCoverageReport()
  } catch (error) {
    console.log('[v0] data-coverage SERVICE failed:', error instanceof Error ? error.stack : error)
    throw error
  }
  console.log('[v0] data-coverage service OK, sections=', report.sections.length)
  return <DataCoverageView report={report} />
}
