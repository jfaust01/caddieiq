import { NextResponse } from 'next/server'

import { getDataCoverageReport } from '@/lib/data-coverage/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await getDataCoverageReport()
    return NextResponse.json({ ok: true, sections: report.sections.length })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 },
    )
  }
}
