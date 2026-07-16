'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { DataCoverageReport } from '@/lib/data-coverage/types'

/**
 * Copies the full diagnostics report as pretty-printed JSON to the clipboard.
 * Lets an operator paste an exact, machine-readable snapshot into a ticket or
 * spreadsheet without screenshotting the page.
 */
export function CopyReportButton({ report }: { report: DataCoverageReport }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable (insecure context); fail silently.
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="size-4" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-4" aria-hidden />
          Copy as JSON
        </>
      )}
    </Button>
  )
}
