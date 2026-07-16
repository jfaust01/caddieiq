'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface JsonInspectorProps {
  /** Any JSON-serializable value; rendered pretty-printed and copyable. */
  value: unknown
}

/** Raw JSON inspector with copy-to-clipboard, for the admin debug view. */
export function JsonInspector({ value }: JsonInspectorProps) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(value, null, 2)

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); fail quietly.
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        className="absolute right-3 top-3"
      >
        {copied ? (
          <Check data-icon="inline-start" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <pre className="max-h-[32rem] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
        <code>{json}</code>
      </pre>
    </div>
  )
}
