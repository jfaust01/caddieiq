'use client'

import { useState } from 'react'
import { Copy, Download, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RawApiResponseDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  response: Record<string, any>
  courseName: string
}

export function RawApiResponseDialog({
  isOpen,
  onOpenChange,
  response,
  courseName,
}: RawApiResponseDialogProps) {
  const [isCopied, setIsCopied] = useState(false)

  const jsonString = JSON.stringify(response, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setIsCopied(true)
      console.log('[v0] Copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('[v0] Failed to copy to clipboard:', error)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(jsonString)}`
    )
    element.setAttribute(
      'download',
      `golfcourse-${courseName}-${new Date().toISOString()}.json`
    )
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-96">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Raw GolfCourseAPI Response</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCopy}
              className="gap-2"
              variant={isCopied ? 'default' : 'outline'}
            >
              <Copy className="size-3" />
              {isCopied ? 'Copied' : 'Copy JSON'}
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="gap-2"
              variant="outline"
            >
              <Download className="size-3" />
              Download JSON
            </Button>
          </div>

          <div className="overflow-auto max-h-96 rounded-lg border border-border bg-muted p-4">
            <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">
              {jsonString}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
